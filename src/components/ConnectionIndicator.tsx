import { useState } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import { ProcessedThought } from "../types";
import Activity from "lucide-react/dist/esm/icons/activity";
import Info from "lucide-react/dist/esm/icons/info";
import X from "lucide-react/dist/esm/icons/x";

export function ConnectionIndicator({ thoughts }: { thoughts: ProcessedThought[] }) {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);

  // Calcola i pensieri dell'ultima settimana
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentThoughts = thoughts.filter((t) => t.timestamp >= oneWeekAgo);
  const recentCount = recentThoughts.length;

  // Somma pesata: per ogni pensiero usiamo la sua profondità (default 5 se mancante)
  const connectionScore = recentThoughts.reduce((sum, t) => sum + (typeof t.depth === 'number' ? t.depth : 5), 0);

  let levelText = "";
  let colorClass = "";
  let iconClass = "";
  
  // Il "punteggio massimo" di riferimento potrebbe essere 50 (es. 5 pensieri molto profondi, o 10 normali)
  const maxTargetScore = 50; 
  const rawProgress = (connectionScore / maxTargetScore) * 100;
  const progressPercentage = Math.min(100, Math.max(0, rawProgress));

  if (connectionScore === 0) {
    levelText = t('connection.disconnected');
    colorClass = "text-[var(--text-muted)] border-zinc-200 dark:border-zinc-800";
    iconClass = "text-[var(--text-muted)]";
  } else if (connectionScore < 15) {
    levelText = t('connection.reconnecting');
    colorClass = "text-[var(--accent-warm)] border-[var(--accent-warm)] opacity-70";
    iconClass = "text-[var(--accent-warm)]";
  } else if (connectionScore < 35) {
    levelText = t('connection.goodAlignment');
    colorClass = "text-[var(--accent-warm)] border-[var(--accent-warm)] opacity-90";
    iconClass = "text-[var(--accent-warm)]";
  } else {
    levelText = t('connection.deepConnection');
    colorClass = "text-[var(--accent-warm)] border-[var(--accent-warm)]";
    iconClass = "text-[var(--accent-warm)]";
  }

  return (
    <div className={`p-5 rounded-3xl border mb-8 flex flex-col gap-4 bg-[var(--bg-card)] border-[var(--border-color)] relative ${showInfo ? 'z-20' : 'z-0'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 bg-[var(--bg-base)] rounded-xl shadow-sm ${iconClass} flex items-center justify-center`}>
            <Activity size={20} strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">{t('connection.analysisTitle')}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t('connection.last7Days')}</p>
            </div>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="p-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-colors ml-1 flex items-center justify-center"
              aria-label={t('connection.infoLabel')}
            >
              <Info size={14} strokeWidth={1.5} className="opacity-80" />
            </button>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className={`font-bold text-lg ${iconClass} animate-pulse-organic`}>{levelText}</span>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{recentCount} {recentCount === 1 ? 'pensiero' : 'pensieri'} registrati</p>
        </div>
      </div>
      
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden mt-1 relative">
        <div 
          className="bg-[var(--accent-warm)] h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {showInfo && (
        <div className="absolute top-20 left-4 right-4 bg-[var(--bg-card)] shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 z-10 text-[var(--text-primary)] animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-sm flex items-center gap-2 font-display">
               {t('connection.howItWorks')}
            </h4>
            <button onClick={() => setShowInfo(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-xl">
               <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <p className="text-xs font-serif leading-relaxed text-[var(--text-secondary)] mb-2">
            Questo indicatore riflette l'<b>intensità della tua connessione interiore</b>. Non si basa solo su <i>quanti</i> pensieri registri, ma premia la <b>profondità introspettiva</b> di ciò che esprimi.
          </p>
          <p className="text-xs font-serif leading-relaxed text-[var(--text-secondary)]">
            {t('connection.description2')}
          </p>
        </div>
      )}
    </div>
  );
}
