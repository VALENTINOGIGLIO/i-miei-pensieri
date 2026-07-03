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
import { useDictation } from "../hooks/useDictation";
import { useState, useEffect } from "react";

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
  const { t } = useLanguage();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useDictation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transcript) setLastTranscript(transcript);
  }, [transcript]);

  const handleEditStop = async () => {
    stopListening();
    const textToProcess = isListening ? transcript : lastTranscript;

    if (!textToProcess || textToProcess.trim().length === 0) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/edit-thought", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
        body: JSON.stringify({
          text: textToProcess,
          currentTitle: thought.title,
          currentContent: thought.content,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Errore durante l'aggiornamento del pensiero.",
        );
      }
      const data = await res.json();
      onUpdate(thought.id, {
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        category: data.category,
        depth: data.depth,
      });
    } catch (err) {
      console.error(err);
      alert(t('thoughtCard.editError'));
    } finally {
      setIsProcessing(false);
      setLastTranscript("");
    }
  };

  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 transition-shadow hover:shadow-md h-full w-full">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-semibold text-lg text-[var(--text-primary)] leading-tight">
            {thought.title}
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
            <button
              onClick={isListening ? handleEditStop : startListening}
              disabled={isProcessing}
              className={`p-2 rounded-full transition-colors ${
                isListening
                  ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60"
                  : "bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] hover:bg-[var(--accent-warm)]/20"
              } disabled:opacity-50`}
              title={t('thoughtCard.editWithVoice')}
            >
              {isProcessing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isListening ? (
                <Square size={18} className="fill-current" />
              ) : (
                <Mic size={18} />
              )}
            </button>
          )}
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
            {thought.content.substring(0, 100)}...
          </p>
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400 font-serif leading-relaxed text-sm">{thought.content}</p>
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
    </div>
  );
}
