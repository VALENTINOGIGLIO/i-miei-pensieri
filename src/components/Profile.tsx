import { useState, useEffect } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import { ProcessedThought } from "../types";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import BookMarked from "lucide-react/dist/esm/icons/book-marked";
import Compass from "lucide-react/dist/esm/icons/compass";
import Markdown from "react-markdown";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Download from "lucide-react/dist/esm/icons/download";
import X from "lucide-react/dist/esm/icons/x";
interface ProfileProps {
  thoughts: ProcessedThought[];
  apiKey: string;
}

interface ProfileData {
  profileText: string;
  booksToDeepen: { title: string; author: string; reason: string }[];
  booksToChallenge: { title: string; author: string; reason: string }[];
}

export function Profile({ thoughts, apiKey }: ProfileProps) {
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConsent, setExportConsent] = useState(false);
  
const handleExport = async () => {
    if (!exportConsent) return;
    
    setIsLoading(true);
    try {
      
      const zip = new JSZip();
    const thoughtsFolder = zip.folder("Pensieri");
    
    // Add thoughts
    thoughts.forEach((t) => {
      const dateStr = new Date(t.timestamp).toISOString();
      const tagsStr = t.tags ? t.tags.join(', ') : '';
      
      const frontmatter = `---
title: "${t.title.replace(/"/g, '\\"')}"
date: ${dateStr}
category: ${t.category}
tags: [${tagsStr}]
depth: ${t.depth}
mood: ${t.mood || 'neutral'}
---

`;
      const fileContent = frontmatter + `# ${t.title}\n\n` + t.content;
      
      // Clean filename
      const safeTitle = t.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeTitle}_${t.id.substring(0,6)}.md`;
      
      thoughtsFolder?.file(fileName, fileContent);
    });
    
    // Add AI Analysis if exists
    if (profileData && profileData.profileText) {
      const analysisContent = `# Analisi Psicologica e Profilo
      
${profileData.profileText}

## Consigli di Lettura (Approfondimento)
${profileData.booksToDeepen.map(b => `- **${b.title}** di ${b.author}: ${b.reason}`).join('\n')}

## Consigli di Lettura (Sfida)
${profileData.booksToChallenge.map(b => `- **${b.title}** di ${b.author}: ${b.reason}`).join('\n')}
`;
      zip.file("Analisi_Psicologica.md", analysisContent);
    }
    
    // Add index file
    const indexContent = `# Indice dei Pensieri\n\nTotale pensieri registrati: ${thoughts.length}\n\n` +
      thoughts.map(t => `- [[${t.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${t.id.substring(0,6)}]]`).join('\n');
    zip.file("Indice_Pensieri.md", indexContent);
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "I_Miei_Pensieri_Obsidian.zip");
    
    setShowExportModal(false);
    setExportConsent(false);
    } catch (err) {
      console.error("Errore durante l'esportazione:", err);
      alert("Si è verificato un errore durante l'esportazione. Assicurati di essere connesso a Internet per scaricare le librerie necessarie.");
    } finally {
      setIsLoading(false);
    }
  };

const fetchProfile = async (force: boolean = false) => {
    if (thoughts.length === 0) return;
    if (!apiKey) {
      setError("Manca la Chiave API Gemini. Inseriscila nelle Impostazioni per usare questa funzione.");
      return;
    }
    
    // Check if we already have a cached profile and we're not forcing refresh
    const cachedProfileData = localStorage.getItem("cached_profile_data");
    const currentSignature = JSON.stringify(thoughts);
    const profileThoughtsSignature = localStorage.getItem("profile_thoughts_signature");
    
    if (!force && cachedProfileData && profileThoughtsSignature === currentSignature) {
        try {
            setProfileData(JSON.parse(cachedProfileData));
            return;
        } catch (e) {
            // cache is corrupted, we will refetch
        }
    }

    setIsLoading(true);
    setError(null);
    
try {
      // 1. Definiamo le direttive tassative (Guardrail) per blindare l'IA
      const systemGuardrails = `
        REGOLA TASSATIVA: Sei un assistente letterario e filosofico. 
        Analizza i testi evidenziando temi, schemi e stili, associandoli esclusivamente a suggerimenti letterari o filosofici. 
        NON sei un medico né uno psicologo. È SEVERAMENTE VIETATO diagnosticare disturbi, sindromi o patologie (es. depressione, ansia, ADHD). 
        Non fornire MAI consigli medici, terapeutici o psichiatrici. 
        Se l'utente inserisce testi che suggeriscono intenti autolesionistici, grave disagio o minacce, INTERROMPI l'analisi e rispondi unicamente con: 
        'Il contenuto di questo pensiero richiede un'attenzione umana che un'intelligenza artificiale non può fornire. Se stai attraversando un momento difficile, ti invitiamo a contattare un professionista della salute mentale o un servizio di ascolto.'
      `;

      // 2. Prepariamo il testo dei pensieri
      const thoughtsText = thoughts
        .map(
          (t) =>
            `Titolo: ${t.title}\nContenuto: ${t.content}\nCategoria: ${t.category}\nTags: ${t.tags?.join(", ")}\nProfondità: ${t.depth}/10`
        )
        .join("\n\n");

      // 3. Prompt finale con le istruzioni unite
      const prompt = `
        ${systemGuardrails}
        
        Ecco tutti i pensieri registrati finora (${thoughts.length} in totale):
        ${thoughtsText}

        Sulla base di questi pensieri, fai un'analisi completa e MOLTO ONESTA della persona che li ha scritti, seguendo le regole tassative sopra indicate.
        Sii diretto, costruttivo e analitico. Fornisci un testo descrittivo.
        MOLTO IMPORTANTE: Se ci sono pochi pensieri (meno di 5), DEVI dichiarare esplicitamente all'inizio che i dati a disposizione sono insufficienti per un'analisi accurata. Sottolinea che l'affidabilità di questo profilo è attualmente solo superficiale e che migliorerà aggiungendo altre note. Mantieni un tono distaccato, non trarre conclusioni definitive ed evita di affermare che il profilo sia "nitido" o "molto chiaro" se si basa su un numero esiguo di pensieri.
      `;

      // 4. Chiamata diretta a Google Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
      
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              profileText: { type: "STRING", description: "Il testo dell'analisi psicologica e comportamentale in formato Markdown." },
              booksToDeepen: {
                type: "ARRAY",
                description: "2 libri scelti per approfondire i temi cari all'utente o con cui sarebbe d'accordo.",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    author: { type: "STRING" },
                    reason: { type: "STRING" }
                  },
                  required: ["title", "author", "reason"]
                }
              },
              booksToChallenge: {
                type: "ARRAY",
                description: "2 libri scelti per sfidare le certezze e le convinzioni dell'utente.",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    author: { type: "STRING" },
                    reason: { type: "STRING" }
                  },
                  required: ["title", "author", "reason"]
                }
              }
            },
            required: ["profileText", "booksToDeepen", "booksToChallenge"]
          }
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" }
        ]
      };

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Errore nella generazione del profilo tramite Gemini.");
      }

      const responseData = await res.json();
      
      // 3. Estraiamo e puliamo il JSON dalla risposta
      let jsonStr = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonStr) throw new Error("Risposta vuota da Gemini. Possibile blocco di sicurezza.");

      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
      }
      jsonStr = jsonStr.trim();
      const data = JSON.parse(jsonStr) as ProfileData;

      // 4. Salviamo i dati
      setProfileData(data);
      localStorage.setItem("cached_profile_data", JSON.stringify(data));
      localStorage.setItem("profile_thoughts_signature", currentSignature);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [thoughts.length]);
  if (!apiKey) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] rounded-xl border border-dashed border-red-300 dark:border-red-900/50">
        <p className="text-red-500 font-medium text-center mb-2">{t('profile.missingApiKeyTitle')}</p>
        <p className="text-[var(--text-muted)] text-sm text-center">
          Per utilizzare l'Analisi Psicologica devi inserire la chiave API Gemini nelle Impostazioni.
        </p>
      </div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <div className="w-full flex-1 flex items-center justify-center p-8 bg-[var(--bg-card)] rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-[var(--text-muted)] text-sm text-center">
          Registra qualche {t('profile.thoughtSingular')} in più per sbloccare l'analisi psicologica.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold font-display text-zinc-900">{t('profile.title')}</h2>
          <p className="text-zinc-500 text-sm">{t('profile.subtitle')}</p>
        </div>
        <button 
          onClick={() => fetchProfile(true)} 
          disabled={isLoading}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
        >
          {isLoading ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> : <RefreshCw size={16} strokeWidth={1.5} />}
          <span className="hidden sm:inline">{t('profile.refresh')}</span>
        </button>
      </div>

      {thoughts.length < 5 && (
        <div className="bg-[var(--bg-card)] border border-[var(--accent-warm)] text-[var(--text-primary)] p-4 rounded-xl text-sm mb-2 shadow-sm">
          <strong className="text-[var(--accent-warm)]">{t('profile.warning')}</strong> {t('profile.recordedOnly')} {thoughts.length} pensier{thoughts.length === 1 ? 'o' : 'i'}. 
          L'analisi mostrata qui sotto è molto sommaria e potenzialmente non affidabile. 
          Continua ad aggiungere {t('profile.thoughtPlural')} (ne consigliamo almeno 5) per delineare un profilo più accurato.
        </div>
      )}

      {isLoading && !profileData ? (
        <div className="w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex flex-col items-center justify-center p-12 text-[var(--text-muted)] gap-4">
            <Loader2 className="animate-spin w-8 h-8" strokeWidth={1.5} />
            <span className="text-sm font-serif">{t('profile.analyzingText')}</span>
          </div>
        </div>
      ) : error ? (
        <div className="w-full text-[var(--accent-warm)] text-sm p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--accent-warm)]">
          {error}
        </div>
      ) : profileData ? (
        <div className="flex flex-col gap-6">
          <div className="w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 relative overflow-hidden">
            <div className="prose prose-zinc dark:prose-invert font-serif max-w-none text-[var(--text-secondary)] leading-relaxed prose-h3:mt-6 prose-h3:mb-3">
               <div className="markdown-body font-serif">
                 <Markdown>{profileData.profileText || "Nessun profilo generato."}</Markdown>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.booksToDeepen && profileData.booksToDeepen.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-[var(--accent-warm)] opacity-10">
                  <BookMarked size={48} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-3 text-[var(--accent-warm)] mb-4">
                  <div className="bg-[var(--accent-warm)]/10 p-2 rounded-xl">
                    <BookMarked size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display font-medium text-lg text-[var(--text-primary)]">{t('profile.toDeepen')}</h3>
                </div>
                <div className="flex flex-col gap-4 relative z-10">
                  {profileData.booksToDeepen.map((book, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <h4 className="font-medium font-serif text-[var(--text-primary)] text-sm">{book.title}</h4>
                      <span className="text-xs font-serif text-[var(--text-secondary)] mb-1">di {book.author}</span>
                      <p className="text-sm font-serif text-[var(--text-secondary)] leading-relaxed">{book.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileData.booksToChallenge && profileData.booksToChallenge.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-[var(--accent-warm)] opacity-10">
                  <Compass size={48} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-3 text-[var(--accent-warm)] mb-4">
                  <div className="bg-[var(--accent-warm)]/10 p-2 rounded-xl">
                    <Compass size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display font-medium text-lg text-[var(--text-primary)]">{t('profile.toChallenge')}</h3>
                </div>
                <div className="flex flex-col gap-4 relative z-10">
                  {profileData.booksToChallenge.map((book, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <h4 className="font-medium font-serif text-[var(--text-primary)] text-sm">{book.title}</h4>
                      <span className="text-xs font-serif text-[var(--text-secondary)] mb-1">di {book.author}</span>
                      <p className="text-sm font-serif text-[var(--text-secondary)] leading-relaxed">{book.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center pb-2">
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-medium transition-transform active:scale-95 text-sm hover:bg-[var(--bg-hover)]"
        >
          <Download size={16} />
          Esporta dati per Obsidian
        </button>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-[var(--bg-primary)] w-full max-w-lg rounded-3xl flex flex-col border border-[var(--border-color)] shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={16} />
            </button>
            <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mb-4">
              Esportazione per Obsidian
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              Stai per scaricare tutti i tuoi pensieri e le tue analisi sotto forma di file Markdown racchiusi in un archivio ZIP, perfetti per essere aperti su Obsidian o app simili.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportConsent}
                  onChange={(e) => setExportConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-orange-500/50 text-orange-500 focus:ring-orange-500/20"
                />
                <span className="text-sm text-orange-700 dark:text-orange-400 font-medium leading-snug">
                  Comprendo che esportando i miei pensieri, verrà scaricato un archivio .zip contenente i miei dati sensibili in formato di testo in chiaro (non crittografato). Riconosco di assumermi la piena ed esclusiva responsabilità per la sicurezza e la protezione di questi file sul mio dispositivo.
                </span>
              </label>
            </div>
            <button 
              onClick={handleExport}
              disabled={!exportConsent}
              className="w-full bg-[var(--accent-warm)] text-white py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)]"
            >
              Scarica Dati (.zip)
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-center pb-8">
        <a 
          href="https://i-miei-{t('profile.thoughtPlural')}.web.app/scarica" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-[var(--text-accent)] font-medium underline decoration-[var(--text-accent)] underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Scarica le app ufficiali (iOS & Android)
        </a>
      </div>
    </div>
  );
}
