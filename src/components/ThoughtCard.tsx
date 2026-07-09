import { ProcessedThought } from "../types";
import { useLanguage } from '../contexts/LanguageContext';
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Mic from "lucide-react/dist/esm/icons/mic";
import Square from "lucide-react/dist/esm/icons/square";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Lock from "lucide-react/dist/esm/icons/lock";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useState, useEffect } from "react";
import { ShareModal } from "./ShareModal";

interface ThoughtCardProps {
  thought: ProcessedThought;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: any) => void;
  apiKey: string;
}

export function ThoughtCard({
  thought,
  onDelete,
  onUpdate,
  apiKey,
}: ThoughtCardProps) {
  const { t, lang } = useLanguage();
  const {
    isListening,
    volume,
    transcript,
    startRecording: startListening,
    stopRecording: stopListening,
    resetTranscript,
    isSupported,
  } = useAudioRecorder(apiKey);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showMaieutica, setShowMaieutica] = useState(false);
  const [isGeneratingMaieutica, setIsGeneratingMaieutica] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (transcript) setLastTranscript(transcript);
  }, [transcript]);

  const handleEditStop = () => {
    stopListening();
  };

  useEffect(() => {
    const processAndSaveEdit = async () => {
      // Cattura il valore corrente subito per evitare stale closure durante l'async
      const currentTranscript = transcript.trim();
      // Soglia minima: ignora rumore ambientale o chiusura accidentale del mic
      if (currentTranscript.length < 10 || isListening || isProcessing) return;

      setIsProcessing(true);
      try {
        const privacyAccepted = localStorage.getItem('privacy_accepted_v2') === 'true';
        if (!apiKey || !apiKey.trim() || !privacyAccepted) {
          // Fallback senza AI: appende il testo grezzo al pensiero
          const newContent = (thought.content + " " + currentTranscript).trim();
          onUpdate(thought.id, {
            content: newContent,
            pensiero_originale_grezzo: newContent,
            pensiero_rielaborato_ia: newContent,
          });
          return;
        }

        const prompt = `Agisci come ghostwriter e analista esistenziale. Questo è il pensiero originale: "${thought.content}".
        Ho appena registrato questa nuova riflessione vocale: "${currentTranscript}".
        Il tuo compito è fondere la nuova aggiunta con il pensiero originale in modo organico e naturale. Prendi ciò che c'è di autentico nel nuovo ragionamento e riscrivilo integrandolo come una riflessione strutturata, densa, in prima persona, ad alto valore introspettivo (come se fosse un diario intimo). Scarta le banalità ed espandi i nodi concettuali. Il risultato finale deve essere un testo unico e coeso, che includa sia la premessa originale che l'evoluzione portata dalla nuova aggiunta.
        Aggiorna anche il titolo se necessario (max 5 parole). Restituisci SOLO un JSON valido senza markdown:
        {"title": "Titolo essenziale", "content": "Riflessione intera, unita e fusa in modo organico", "tags": ["tag1", "tag2"], "category": "Lavoro/Personale/Idee/Relazioni/Sviluppo", "depth": 7}`;

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    content: { type: "STRING" },
                    tags: {
                      type: "ARRAY",
                      items: { type: "STRING" }
                    },
                    category: { type: "STRING" },
                    depth: { type: "INTEGER" }
                  },
                  required: ["title", "content", "tags", "category", "depth"]
                }
              },
            })
          });

        if (!res.ok) {
          // API non disponibile: fallback silenzioso senza alert
          console.warn(`Gemini edit non disponibile (${res.status}). Salvo trascrizione grezza.`);
          const newContent = (thought.content + " " + currentTranscript).trim();
          const newRaw = (thought.pensiero_originale_grezzo || thought.content) + " " + currentTranscript;
          onUpdate(thought.id, { content: newContent, pensiero_originale_grezzo: newRaw, pensiero_rielaborato_ia: newContent });
          return;
        }
        const data = await res.json();
        let textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResp) {
          const startIdx = textResp.indexOf('{');
          const endIdx = textResp.lastIndexOf('}');
          if (startIdx !== -1 && endIdx !== -1) {
            textResp = textResp.substring(startIdx, endIdx + 1);
          }
          const aiResult = JSON.parse(textResp);

          const newRaw = (thought.pensiero_originale_grezzo || thought.content) + " " + currentTranscript;

          onUpdate(thought.id, {
            title: aiResult.title || thought.title,
            content: aiResult.content || thought.content,
            pensiero_originale_grezzo: newRaw,
            pensiero_rielaborato_ia: aiResult.content || thought.content,
            tags: aiResult.tags || thought.tags,
            category: aiResult.category || thought.category,
            depth: aiResult.depth || thought.depth,
          });
        } else {
          // Risposta vuota: fallback silenzioso
          const newContent = (thought.content + " " + currentTranscript).trim();
          onUpdate(thought.id, { content: newContent });
        }
      } catch (err) {
        // Fallback silenzioso: no alert, salva trascrizione grezza
        console.error("Errore edit vocale:", err);
        try {
          const newContent = (thought.content + " " + transcript.trim()).trim();
          if (newContent !== thought.content) {
            onUpdate(thought.id, { content: newContent });
          }
        } catch { /* ignore */ }
      } finally {
        setIsProcessing(false);
        resetTranscript();
      }
    };
    processAndSaveEdit();
  }, [transcript, isListening]);

  // Generazione maieutica socratica on-demand (all'espansione della tendina)
  useEffect(() => {
    const generateMaieuticaOnDemand = async () => {
      if (showMaieutica && (!thought.spunti_maieutici || thought.spunti_maieutici.length === 0) && apiKey && !isGeneratingMaieutica) {
        const privacyAccepted = localStorage.getItem('privacy_accepted_v2') === 'true';
        if (!privacyAccepted) return;
        
        setIsGeneratingMaieutica(true);
        try {
          const maieuticaPrompt = `Agisci come un filosofo socratico. Leggi il pensiero dell'utente e genera 2 o 3 domande aperte, chirurgiche e profonde per aiutarlo a scavare nella sua stessa logica. Non giudicare, non consigliare. Solo domande. Restituisci l'output in un array JSON.\n\nPensiero: "${thought.content}"`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: maieuticaPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.5,
                responseSchema: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              }
            })
          });
          if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
          const data = await res.json();
          let textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResp) {
            const startIdx = textResp.indexOf('[');
            const endIdx = textResp.lastIndexOf(']');
            if (startIdx !== -1 && endIdx !== -1) {
              textResp = textResp.substring(startIdx, endIdx + 1);
            }
            const questions = JSON.parse(textResp);
            if (Array.isArray(questions)) {
              onUpdate(thought.id, { spunti_maieutici: questions });
            }
          }
        } catch (e) {
          console.error("Errore generazione maieutica on-demand:", e);
        } finally {
          // Garantisce sempre il reset del loader, anche in caso di errore
          setIsGeneratingMaieutica(false);
        }
      }
    };
    generateMaieuticaOnDemand();
  }, [showMaieutica, thought.spunti_maieutici, apiKey, thought.content, thought.id, onUpdate, isGeneratingMaieutica]);

  const handleReelaborate = async () => {
    if (!apiKey || isProcessing) return;
    setIsProcessing(true);
    try {
      const rawText = thought.pensiero_originale_grezzo || thought.rawText || thought.content;
      const prompt = `Agisci come ghostwriter e analista esistenziale. Ricevi un flusso grezzo di pensiero vocale e il tuo compito è trasformarlo — non trascriverlo. Prendi ciò che c'è di autentico nel ragionamento e riscrivilo come una riflessione strutturata, densa, in prima persona, ad alto valore introspettivo. Scarta le banalità, espandi i nodi concettuali, elimina le ridondanze. Il risultato deve sembrare scritto da chi ha già metabolizzato l'esperienza, non da chi la sta raccontando. Non fare correzione bozze: fai architettura del pensiero. Genera anche un titolo essenziale e preciso (max 5 parole) che ne catturi il nucleo. Restituisci SOLO un JSON valido senza markdown:\n{"title": "Titolo essenziale", "content": "Riflessione riscritta", "tags": ["tag1", "tag2"], "depth": 7, "category": "Lavoro/Personale/Relazioni/Sviluppo"}\n\nFlusso grezzo: "${rawText}"`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                content: { type: "STRING" },
                tags: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                category: { type: "STRING" },
                depth: { type: "INTEGER" }
              },
              required: ["title", "content", "tags", "category", "depth"]
            }
          },
        })
      });

      if (!res.ok) throw new Error("Gemini API error during re-elaboration");
      const data = await res.json();
      let textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResp) {
        const startIdx = textResp.indexOf('{');
        const endIdx = textResp.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          textResp = textResp.substring(startIdx, endIdx + 1);
        }
        const aiResult = JSON.parse(textResp);

        // Genera spunti maieutici in background!
        let socraticQuestions: string[] = [];
        try {
          const maieuticaPrompt = `Agisci come un filosofo socratico. Leggi il pensiero dell'utente e genera 2 o 3 domande aperte, chirurgiche e profonde per aiutarlo a scavare nella sua stessa logica. Non giudicare, non consigliare. Solo domande. Restituisci l'output in un array JSON.\n\nPensiero: "${aiResult.content || thought.content}"`;
          const maieuticaRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: maieuticaPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.5,
                responseSchema: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              }
            })
          });
          if (maieuticaRes.ok) {
            const maieuticaData = await maieuticaRes.json();
            const mqText = maieuticaData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (mqText) {
              socraticQuestions = JSON.parse(mqText);
            }
          }
        } catch (e) {
          console.error("Errore maieutica in rielaborazione:", e);
        }

        onUpdate(thought.id, {
          title: aiResult.title || thought.title,
          content: aiResult.content || thought.content,
          pensiero_rielaborato_ia: aiResult.content || thought.content,
          tags: aiResult.tags || thought.tags,
          category: aiResult.category || thought.category,
          depth: aiResult.depth || thought.depth,
          spunti_maieutici: socraticQuestions.length > 0 ? socraticQuestions : (thought.spunti_maieutici || []),
        });
      }
    } catch (e) {
      console.error(e);
      alert("Errore nella rigenerazione dell'analisi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTitle = thought.translations?.[lang]?.title || thought.title;
  const activeContent = thought.translations?.[lang]?.content || thought.content;

  const hasBothVersions = !!thought.pensiero_originale_grezzo;

  const displayedContent = showOriginal 
    ? (thought.pensiero_originale_grezzo || thought.rawText || activeContent)
    : activeContent;

  return (
    <>
      <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 transition-shadow hover:shadow-md h-full w-full">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-semibold text-lg text-[var(--text-primary)] leading-tight">
              {activeTitle}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full whitespace-nowrap border border-zinc-200 dark:border-zinc-700">
                {formatDistanceToNow(thought.timestamp, {
                  addSuffix: true,
                  locale: it,
                })}
              </span>
              {thought.category && (
                <span className="text-xs font-medium text-[var(--accent-warm)] bg-[var(--accent-warm)]/10 px-2 py-1 rounded-full border border-[var(--accent-warm)]/20">
                  {thought.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
             {isSupported && (
               <div className="relative w-9 h-9 flex justify-center items-center rounded-full">
                 {isListening && (
                   <div 
                     className="absolute inset-0 rounded-full pointer-events-none transition-all duration-75 ease-out bg-transparent"
                     style={{
                       boxShadow: `0 0 ${8 + volume * 16}px ${2 + volume * 8}px var(--accent-warm)`,
                       opacity: 0.4 + (volume * 0.3),
                       transform: `scale(${1 + volume * 0.5})`,
                     }}
                   />
                 )}
                 <button
                   onClick={isListening ? handleEditStop : startListening}
                   disabled={isProcessing}
                   style={{
                     transform: isListening ? `scale(${1 + volume * 0.15})` : 'scale(1)'
                   }}
                   className={`relative w-full h-full rounded-full transition-all duration-75 ease-out z-10 flex items-center justify-center ${
                     isListening
                       ? "bg-red-500 text-white shadow-md hover:bg-red-600"
                       : "bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] hover:bg-[var(--accent-warm)]/20"
                   } disabled:opacity-50`}
                   title={t('thoughtCard.editWithVoice')}
                 >
                   {isProcessing ? (
                     <Loader2 size={16} className="animate-spin" />
                   ) : isListening ? (
                     <Square size={16} className="fill-current" />
                   ) : (
                     <Mic size={16} />
                   )}
                 </button>
               </div>
             )}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full text-[var(--text-muted)] hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[var(--text-primary)] transition-colors"
              title="Condividi"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isListening || isProcessing || showDeleteConfirm}
              className="p-2 rounded-full text-[var(--text-muted)] hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-500 transition-colors disabled:opacity-50"
              title={t('thoughtCard.deleteThought')}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3 mt-2 border border-red-100 dark:border-red-900/50 animate-in fade-in zoom-in-95 duration-200">
            <p className="font-medium text-red-800 dark:text-red-400 text-sm">
              {t('thoughtCard.confirmDelete')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-base)] text-[var(--text-secondary)] font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              >
                {t('thoughtCard.cancel')}
              </button>
              <button
                onClick={() => onDelete(thought.id)}
                className="px-4 py-2 rounded-xl bg-[var(--accent-warm)] text-[var(--bg-base)] font-medium text-sm hover:opacity-90 shadow-sm"
              >
                {t('thoughtCard.deleteBtn')}
              </button>
            </div>
          </div>
        )}

        {isListening && transcript && (
          <div className="bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] italic text-sm p-3 rounded-xl border border-[var(--accent-warm)]/20">
            {t('thoughtCard.youAreSaying')} "{transcript}"
          </div>
        )}

        {thought.unlockDate && thought.unlockDate > Date.now() ? (
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-300 dark:border-zinc-700 my-2 select-none">
            <Lock size={20} className="text-zinc-400" />
            <p className="text-sm font-medium text-zinc-500 text-center">
              {t('thoughtCard.sealedInCapsule')}<br/>
              {t('thoughtCard.willOpenOn')} {new Date(thought.unlockDate).toLocaleDateString("it-IT")}.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 font-serif leading-relaxed text-sm blur-sm mt-2 select-none pointer-events-none">
              {activeContent.substring(0, 100)}...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {hasBothVersions && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-color)] p-0.5 rounded-lg w-fit text-[10px] font-medium font-sans">
                  <button 
                    type="button"
                    onClick={() => setShowOriginal(false)}
                    className={`px-2.5 py-1 rounded-md transition-all ${!showOriginal ? 'bg-[var(--accent-warm)] text-white shadow-sm font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  >
                    Rielaborato (IA)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowOriginal(true)}
                    className={`px-2.5 py-1 rounded-md transition-all ${showOriginal ? 'bg-[var(--accent-warm)] text-white shadow-sm font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  >
                    Originale
                  </button>
                </div>
                {!showOriginal && (
                  <button
                    type="button"
                    onClick={handleReelaborate}
                    disabled={isProcessing}
                    className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-card)]"
                    title="Rigenera Rielaborazione IA"
                  >
                    <RefreshCw size={10} className={isProcessing ? "animate-spin text-[var(--accent-warm)]" : ""} />
                  </button>
                )}
              </div>
            )}
            
            {(() => {
              const shouldTruncate = displayedContent.length > 450;
              const textToShow = (shouldTruncate && !isExpanded) ? `${displayedContent.substring(0, 450)}...` : displayedContent;
              return (
                <>
                  <p className="text-zinc-600 dark:text-zinc-400 font-serif leading-relaxed text-sm whitespace-pre-wrap">
                    {textToShow}
                  </p>
                  {shouldTruncate && (
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs text-[var(--accent-warm)] hover:underline font-semibold w-fit mt-1 self-start font-sans"
                    >
                      {isExpanded ? "Leggi meno" : "Leggi di più"}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {thought.tags && thought.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto pt-2">
            {thought.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
            
            {thought.location && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${thought.location.lat},${thought.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-opacity"
                title={t('thoughtCard.openInMaps')}
              >
                <MapPin size={12} /> {t('thoughtCard.location')}
              </a>
            )}
          </div>
        )}

        {/* Accordion Domande Maieutiche */}
        <div className="border-t border-[var(--border-color)] pt-3 mt-2 flex flex-col w-full font-sans">
          <button
            type="button"
            onClick={() => setShowMaieutica(!showMaieutica)}
            className="flex items-center justify-between text-xs font-semibold text-[var(--accent-warm)] hover:opacity-80 transition-all text-left"
          >
            <span>🔍 Domande Maieutiche</span>
            <span className="text-[10px] font-bold">{showMaieutica ? "▲ Chiudi" : "▼ Espandi"}</span>
          </button>
          {showMaieutica && (
            <div className="mt-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 rounded-2xl flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] italic leading-relaxed animate-in slide-in-from-top-2 duration-200">
              {thought.spunti_maieutici && thought.spunti_maieutici.length > 0 ? (
                thought.spunti_maieutici.map((q, idx) => (
                  <p key={idx} className="border-l-2 border-[var(--accent-warm)]/40 pl-2.5 py-0.5">
                    &ldquo;{q}&rdquo;
                  </p>
                ))
              ) : (
                <div className="flex items-center gap-2 py-1 text-[var(--text-muted)] not-italic">
                  <Loader2 className="animate-spin text-[var(--accent-warm)]" size={12} />
                  <span>Elaborazione in corso...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <ShareModal 
          thought={{ ...thought, title: activeTitle, content: activeContent }} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </>
  );
}
