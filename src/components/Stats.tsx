import { useState, useMemo } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import { format, subDays, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { ProcessedThought } from "../types";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Markdown from "react-markdown";

interface StatsProps {
  thoughts: ProcessedThought[];
  apiKey: string;
  enableMoodSummary?: boolean;
  enableAdvancedStats?: boolean;
  enableInnerConnection?: boolean;
}

export function Stats({ thoughts, apiKey, enableMoodSummary = true, enableAdvancedStats = true, enableInnerConnection = true }: StatsProps) {
  const { t } = useLanguage();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!apiKey) {
      setSummaryError(t('stats.missingApiKey'));
      return;
    }
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      // Prendi i pensieri degli ultimi 30 giorni
      const thirtyDaysAgo = subDays(new Date(), 30).getTime();
      const recentThoughts = thoughts.filter(t => t.timestamp >= thirtyDaysAgo);
      
      if (recentThoughts.length === 0) {
        setSummaryError(t('stats.noRecentThoughts'));
        setIsGeneratingSummary(false);
        return;
      }

      const thoughtsText = recentThoughts.map(t => 
        `Data: ${format(new Date(t.timestamp), "d MMM", { locale: it })}\nTitolo: ${t.title}\nUmore: ${t.mood || 'Non specificato'}\nContenuto: ${t.content}`
      ).join("\n\n");

      const prompt = `Sei un assistente che analizza il diario dell'utente. Leggi i pensieri degli ultimi 30 giorni e scrivi un breve riepilogo discorsivo (massimo 3-4 frasi) dell'umore e dei temi principali affrontati. Usa un tono empatico, diretto, amichevole e scrivi in prima persona singolare ("ho notato che", "sei stato"). Ecco i pensieri:\n\n${thoughtsText}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!res.ok) throw new Error(t('stats.summaryError'));
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiSummary(text);
      } else {
        throw new Error("Risposta vuota");
      }
    } catch (err: any) {
      setSummaryError(err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const chartData = useMemo(() => {
    if (thoughts.length === 0) return [];
    
    // Sort chronological
    const sorted = [...thoughts].sort((a, b) => a.timestamp - b.timestamp);
    
    // Group by date to get count & average depth
    const grouped: Record<string, { date: string; count: number; depthSum: number; rawTimestamp: number }> = {};
    
    sorted.forEach(t => {
      const d = format(new Date(t.timestamp), "d MMM", { locale: it });
      if (!grouped[d]) {
        grouped[d] = { date: d, count: 0, depthSum: 0, rawTimestamp: t.timestamp };
      }
      grouped[d].count += 1;
      grouped[d].depthSum += (t.depth || 5);
    });

    return Object.values(grouped).map(g => ({
      date: g.date,
      count: g.count,
      avgDepth: Number((g.depthSum / g.count).toFixed(1)),
      rawTimestamp: g.rawTimestamp
    })).sort((a, b) => a.rawTimestamp - b.rawTimestamp);
  }, [thoughts]);

  const innerConnectionScore = useMemo(() => {
    if (thoughts.length === 0) return 0;
    const thirtyDaysAgo = subDays(new Date(), 30).getTime();
    const recentThoughts = thoughts.filter(t => t.timestamp >= thirtyDaysAgo);
    if (recentThoughts.length === 0) return 0;
    
    // Frequenza: media pensieri al giorno (su 30 giorni)
    const frequency = recentThoughts.length / 30;
    // Intensità: media profondità dei pensieri recenti
    const avgDepth = recentThoughts.reduce((acc, t) => acc + (t.depth || 5), 0) / recentThoughts.length;
    
    // Normalizziamo la frequenza assumendo che 1.5 pensieri al giorno sia il massimo "utile" (100% per freq)
    const normalizedFreq = Math.min(frequency / 1.5, 1);
    const normalizedDepth = avgDepth / 10;
    
    // Punteggio bilanciato: 40% frequenza, 60% profondità emotiva
    return Math.round((normalizedFreq * 0.4 + normalizedDepth * 0.6) * 100);
  }, [thoughts]);

  if (thoughts.length === 0) {
    return (
      <div className="w-full flex-1 flex items-center justify-center p-8 bg-[var(--bg-card)] rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-[var(--text-muted)] text-sm text-center">
          {t('stats.recordSomeThoughts')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">{t('stats.title')}</h2>
        <p className="text-[var(--text-secondary)] text-sm">{t('stats.subtitle')}</p>
      </div>

      {enableMoodSummary && <div className="p-6 bg-[var(--bg-card)] rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-[var(--accent-warm)] opacity-10 pointer-events-none">
          <Sparkles size={64} strokeWidth={1} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-md">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
              Riepilogo dell'Umore <Sparkles size={16} className="text-[var(--accent-warm)]" />
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">{t('stats.moodSummaryDesc')}</p>
          </div>
          <button 
            onClick={generateSummary}
            disabled={isGeneratingSummary}
            className="h-[40px] px-4 py-2 bg-[var(--accent-warm)] text-[var(--bg-base)] text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              t('stats.generateSummaryBtn')
            )}
          </button>
        </div>
        
        {summaryError && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 mt-2">
            {summaryError}
          </div>
        )}

        {aiSummary && (
          <div className="mt-4 p-4 bg-[var(--bg-base)] rounded-xl border border-zinc-200 dark:border-zinc-800 text-[var(--text-secondary)] text-sm leading-relaxed italic font-serif">
            <Markdown>{aiSummary}</Markdown>
          </div>
        )}
      </div>}

      {enableInnerConnection && thoughts.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-[var(--accent-warm)]/10 to-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--accent-warm)]/20 flex flex-col gap-4 relative overflow-hidden">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{t('stats.innerConnectionTitle')}</h3>
            <p className="text-xs text-[var(--text-secondary)]">{t('stats.innerConnectionDesc')}</p>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-display font-bold text-[var(--accent-warm)]">{innerConnectionScore}%</span>
            <span className="text-sm font-medium text-[var(--text-secondary)] mb-1 pb-1">
              {innerConnectionScore > 80 ? t('stats.veryHigh') : innerConnectionScore > 50 ? t('stats.good') : t('stats.needsCultivation')}
            </span>
          </div>
        </div>
      )}

      {enableAdvancedStats && (
        <>
          <div className="p-6 bg-[var(--bg-card)] rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">{t('stats.frequencyTitle')}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{t('stats.frequencyDesc')}</p>
            </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: "bold", color: "#3f3f46", marginBottom: "4px" }}
              />
              <Area type="monotone" dataKey="count" name="Pensieri" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 bg-[var(--bg-card)] rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">{t('stats.intensityTitle')}</h3>
          <p className="text-xs text-[var(--text-secondary)]">La profondità analizzata dall'IA giorno per giorno</p>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} domain={[0, 10]} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: "bold", color: "#3f3f46", marginBottom: "4px" }}
              />
              <Line type="monotone" dataKey="avgDepth" name="Profondità" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
