import { useState, useEffect, useRef, useCallback } from "react";

// Extend window object to include the prefixed speech recognition api
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let Recognition: any = null;
if (typeof window !== "undefined") {
  Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
}

export function useDictation() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Try Safari or Chrome.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "it-IT"; // Set to Italian for "prendere i miei pensieri"

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
         setTranscript((prev) => prev + " " + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
         console.error("Speech recognition error", event.error);
         setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // If we unexpectedly stop, update state
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
         recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setError(null);
      setTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
         setError("Failed to start listening.");
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported: !!Recognition
  };
}
