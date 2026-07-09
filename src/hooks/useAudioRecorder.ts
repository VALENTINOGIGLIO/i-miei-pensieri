import { useState, useRef, useCallback } from "react";

/**
 * useAudioRecorder
 * Hook unificato basato su MediaRecorder API.
 * Risolve il bug del microfono su Android/iOS dove SpeechRecognition
 * entrava in conflitto con l'AudioContext del visualizer.
 *
 * Flusso:
 * 1. getUserMedia() ottiene il MediaStream
 * 2. MediaRecorder registra l'audio grezzo
 * 3. AudioContext/AnalyserNode legge lo stesso stream per il volume
 * 4. Al stop, i chunk vengono assemblati in un Blob audio
 * 5. Il Blob viene trascritto via Gemini API (audio -> testo)
 */

type RecorderState = "idle" | "requesting" | "recording" | "processing" | "error";

interface UseAudioRecorderReturn {
  state: RecorderState;
  isListening: boolean;
  volume: number;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useAudioRecorder(apiKey?: string): UseAudioRecorderReturn {
  const [state, setState] = useState<RecorderState>("idle");
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  // Accumula i risultati finali della SpeechRecognition senza sovrascrivere
  const finalTranscriptRef = useRef<string>("");

  const isSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setVolume(0);
  }, []);

  const cleanupStream = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // Annulla i callback prima di stop() per evitare onresult tardivi
        // che sovrascriverebbero il reset del transcript nell'onstop
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    stopVisualizer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, [stopVisualizer]);

  const startVisualizer = useCallback((stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.2;
      analyserRef.current = analyser;

      ctx.createMediaStreamSource(stream).connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
        setVolume(Math.min(1, Math.pow(avg / 50, 1.2)));
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn("Visualizer non disponibile:", e);
    }
  }, []);

  const transcribeAudio = useCallback(async (blob: Blob): Promise<string> => {
    if (!apiKey) {
      // Fallback: Web Speech API come trascrizione (solo su browser supportati)
      return new Promise((resolve) => {
        const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { resolve(""); return; }
        const r = new SR();
        r.lang = "it-IT"; r.continuous = false; r.interimResults = false;
        r.onresult = (e: any) => resolve(e.results[0]?.[0]?.transcript || "");
        r.onerror = () => resolve("");
        r.start();
        // Chiudi dopo 1s (non ha audio da processare in questo flusso)
        setTimeout(() => { try { r.stop(); } catch {} }, 1000);
      });
    }

    // Trascrizione via Gemini: converte blob in base64 e usa il modello
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const mimeType = blob.type || "audio/webm";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            { text: "Trascrivi esattamente questo audio in italiano. Restituisci SOLO il testo trascritto, senza alcun commento o formattazione aggiuntiva." },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }, [apiKey]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Il microfono non è supportato su questo browser.");
      return;
    }

    setError(null);
    setTranscript("");
    finalTranscriptRef.current = "";
    chunksRef.current = [];
    setState("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
        video: false,
      });
    } catch (err: any) {
      setError("Permesso microfono negato. Abilitalo nelle impostazioni del browser.");
      setState("error");
      return;
    }

    streamRef.current = stream;
    startVisualizer(stream);

    // Scegli il formato audio più compatibile
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "",
    ];
    const supportedMime = mimeTypes.find((m) => !m || MediaRecorder.isTypeSupported(m)) || "";

    const mr = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : {});
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      cleanupStream();
      if (chunksRef.current.length === 0) {
        setState("idle");
        return;
      }
      // Reset il transcript live (SpeechRecognition) prima di Gemini:
      // evita che ThoughtCard salvi il grezzo incompleto quando isListening diventa false.
      // Solo il risultato Gemini (sotto) triggererà il salvataggio.
      setTranscript("");
      finalTranscriptRef.current = "";
      setState("processing");
      try {
        const blob = new Blob(chunksRef.current, { type: supportedMime || "audio/webm" });
        const text = await transcribeAudio(blob);
        setTranscript(text);
      } catch (err: any) {
        setError("Errore durante la trascrizione: " + (err.message || "riprovare."));
      } finally {
        setState("idle");
      }
    };

    mr.onerror = () => {
      cleanupStream();
      setError("Errore durante la registrazione.");
      setState("error");
    };

    mr.start(250); // chunk ogni 250ms per dati frequenti
    setState("recording");

    // Avvia SpeechRecognition in parallelo per trascrizione progressiva istantanea
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "it-IT";
        rec.onresult = (e: any) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              // Appende al buffer accumulato, non sovrascrive
              finalTranscriptRef.current += e.results[i][0].transcript + " ";
            } else {
              interim += e.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscriptRef.current + interim);
        };
        rec.onerror = (err: any) => {
          console.warn("SpeechRecognition error:", err);
        };
        rec.start();
        recognitionRef.current = rec;
      } catch (e) {
        console.warn("Errore all'avvio di SpeechRecognition:", e);
      }
    }
  }, [isSupported, startVisualizer, cleanupStream, transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
    setState("idle");
  }, []);

  return {
    state,
    isListening: state === "recording",
    volume,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
  };
}
