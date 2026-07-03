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
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Shield from "lucide-react/dist/esm/icons/shield";
import Brain from "lucide-react/dist/esm/icons/brain";

interface ProfileProps {
  thoughts: ProcessedThought[];
  apiKey: string;
}

interface ProfileData {
  profileText: string;
  booksToDeepen: { title: string; author: string; reason: string }[];
  booksToChallenge: { title: string; author: string; reason: string }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Genera il contenuto Markdown+YAML di un singolo pensiero */
function thoughtToMarkdown(t: ProcessedThought): string {
  const dateStr = new Date(t.timestamp).toISOString();
  const dateDisplay = new Date(t.timestamp).toLocaleDateString("it-IT", {
    year: "numeric", month: "long", day: "numeric"
  });
  const tagsStr = t.tags ? t.tags.map(tag => `"${tag}"`).join(", ") : "";
  return `---
title: "${t.title.replace(/"/g, '\\"')}"
date: ${dateStr}
category: ${t.category}
tags: [${tagsStr}]
depth: ${t.depth}
mood: ${t.mood || "neutral"}
source: i-miei-pensieri-app
---

# ${t.title}

> *Registrato il ${dateDisplay}*

${t.content}
`;
}

/** Genera un nome file sicuro per Obsidian */
function safeFileName(t: ProcessedThought): string {
  const date = new Date(t.timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const safeTitle = t.title.replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ ]/g, "").trim().slice(0, 50);
  return `${yyyy}-${mm}-${dd} - ${safeTitle}.md`;
}

/** Controlla se il browser supporta la File System Access API */
function supportsFileSystemAccess(): boolean {
  return "showDirectoryPicker" in window;
}

// ─── Step enum per il modale ─────────────────────────────────────────────────
type ModalStep = "intro" | "legal" | "export";

// ─── Componente principale ───────────────────────────────────────────────────

export function Profile({ thoughts, apiKey }: ProfileProps) {
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("intro");
  const [exportConsent, setExportConsent] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "writing" | "done" | "error">("idle");
  const [exportMessage, setExportMessage] = useState("");

  const closeModal = () => {
    setShowExportModal(false);
    setModalStep("intro");
    setExportConsent(false);
    setExportStatus("idle");
    setExportMessage("");
  };

  // ─── Esportazione con File System Access API (Desktop) ──────────────────
  const handleDirectExport = async () => {
    if (!exportConsent) return;
    setExportStatus("writing");
    setExportMessage("Selezione cartella Obsidian…");

    try {
      // Chiedi all'utente di selezionare la cartella del Vault
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
        id: "obsidian-vault",
      });

      let written = 0;

      // Cartella Pensieri
      const pensieriFolderHandle = await dirHandle.getDirectoryHandle("00 - Inbox", { create: true });
      for (const thought of thoughts) {
        const fileName = safeFileName(thought);
        const fileHandle = await pensieriFolderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(thoughtToMarkdown(thought));
        await writable.close();
        written++;
        setExportMessage(`Scrittura file ${written}/${thoughts.length}…`);
      }

      // Analisi psicologica (se disponibile)
      if (profileData?.profileText) {
        const analysisContent = buildAnalysisMarkdown(profileData);
        const analysisHandle = await dirHandle.getFileHandle("Analisi_Psicologica.md", { create: true });
        const writable = await analysisHandle.createWritable();
        await writable.write(analysisContent);
        await writable.close();
      }

      // Indice pensieri
      const indexContent = buildIndexMarkdown(thoughts);
      const indexHandle = await dirHandle.getFileHandle("Indice_Pensieri.md", { create: true });
      const writable = await indexHandle.createWritable();
      await writable.write(indexContent);
      await writable.close();

      setExportStatus("done");
      setExportMessage(
        `✅ ${written} pensieri scritti direttamente nel tuo Vault! Apri Obsidian per vederli.`
      );
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Utente ha annullato la selezione cartella
        setExportStatus("idle");
        setExportMessage("");
      } else {
        setExportStatus("error");
        setExportMessage("Si è verificato un errore durante la scrittura dei file. Riprova.");
        console.error("Export error:", err);
      }
    }
  };

  // ─── Fallback: esportazione ZIP (Mobile / Firefox) ───────────────────────
  const handleZipExport = async () => {
    if (!exportConsent) return;
    setExportStatus("writing");
    setExportMessage("Creazione archivio ZIP…");

    try {
      const zip = new JSZip();
      const folder = zip.folder("00 - Inbox");

      thoughts.forEach((thought) => {
        folder?.file(safeFileName(thought), thoughtToMarkdown(thought));
      });

      if (profileData?.profileText) {
        zip.file("Analisi_Psicologica.md", buildAnalysisMarkdown(profileData));
      }
      zip.file("Indice_Pensieri.md", buildIndexMarkdown(thoughts));

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "I_Miei_Pensieri_Obsidian.zip");

      setExportStatus("done");
      setExportMessage(
        "✅ Archivio scaricato! Estrai il file ZIP e trascina la cartella in Obsidian."
      );
    } catch (err) {
      console.error("ZIP export error:", err);
      setExportStatus("error");
      setExportMessage("Errore durante la creazione del file ZIP. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Helpers per il contenuto dei file ────────────────────────────────────
  function buildAnalysisMarkdown(data: ProfileData): string {
    return `---
tipo: analisi_psicologica
generato_il: ${new Date().toISOString()}
source: i-miei-pensieri-app
tags: ["profilo", "analisi", "IA"]
---

# 🧠 Analisi Psicologica e Profilo

${data.profileText}

---

## 📚 Libri Consigliati (Approfondimento)

${data.booksToDeepen.map(b => `### ${b.title}\n*di ${b.author}*\n\n${b.reason}`).join("\n\n")}

---

## 🔥 Libri Consigliati (Sfida)

${data.booksToChallenge.map(b => `### ${b.title}\n*di ${b.author}*\n\n${b.reason}`).join("\n\n")}
`;
  }

  function buildIndexMarkdown(ts: ProcessedThought[]): string {
    return `---
tipo: indice
aggiornato_il: ${new Date().toISOString()}
totale_pensieri: ${ts.length}
---

# 📖 Indice dei Pensieri

Totale pensieri registrati: **${ts.length}**

${ts.map(th => {
  const safeName = safeFileName(th).replace(".md", "");
  return `- [[00 - Inbox/${safeName}|${th.title}]]`;
}).join("\n")}
`;
  }

  // ─── Fetch profilo psicologico ─────────────────────────────────────────────
  const fetchProfile = async (force: boolean = false) => {
    if (thoughts.length === 0) return;
    if (!apiKey) {
      setError("Manca la Chiave API Gemini. Inseriscila nelle Impostazioni per usare questa funzione.");
      return;
    }

    const cachedProfileData = localStorage.getItem("cached_profile_data");
    const currentSignature = JSON.stringify(thoughts);
    const profileThoughtsSignature = localStorage.getItem("profile_thoughts_signature");

    if (!force && cachedProfileData && profileThoughtsSignature === currentSignature) {
      try {
        setProfileData(JSON.parse(cachedProfileData));
        return;
      } catch (_) { /* cache corrotta */ }
    }

    setIsLoading(true);
    setError(null);

    try {
      const systemGuardrails = `
        REGOLA TASSATIVA: Sei un assistente letterario e filosofico.
        Analizza i testi evidenziando temi, schemi e stili, associandoli esclusivamente a suggerimenti letterari o filosofici.
        NON sei un medico né uno psicologo. È SEVERAMENTE VIETATO diagnosticare disturbi, sindromi o patologie (es. depressione, ansia, ADHD).
        Non fornire MAI consigli medici, terapeutici o psichiatrici.
        Se l'utente inserisce testi che suggeriscono intenti autolesionistici, grave disagio o minacce, INTERROMPI l'analisi e rispondi unicamente con:
        'Il contenuto di questo pensiero richiede un'attenzione umana che un'intelligenza artificiale non può fornire. Se stai attraversando un momento difficile, ti invitiamo a contattare un professionista della salute mentale o un servizio di ascolto.'
      `;

      const thoughtsText = thoughts
        .map(th => `Titolo: ${th.title}\nContenuto: ${th.content}\nCategoria: ${th.category}\nTags: ${th.tags?.join(", ")}\nProfondità: ${th.depth}/10`)
        .join("\n\n");

      const prompt = `
        ${systemGuardrails}

        Ecco tutti i pensieri registrati finora (${thoughts.length} in totale):
        ${thoughtsText}

        Sulla base di questi pensieri, fai un'analisi completa e MOLTO ONESTA della persona che li ha scritti, seguendo le regole tassative sopra indicate.
        Sii diretto, costruttivo e analitico. Fornisci un testo descrittivo.
        MOLTO IMPORTANTE: Se ci sono pochi pensieri (meno di 5), DEVI dichiarare esplicitamente all'inizio che i dati a disposizione sono insufficienti per un'analisi accurata. Sottolinea che l'affidabilità di questo profilo è attualmente solo superficiale e che migliorerà aggiungendo altre note. Mantieni un tono distaccato, non trarre conclusioni definitive ed evita di affermare che il profilo sia "nitido" o "molto chiaro" se si basa su un numero esiguo di pensieri.
      `;

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
      let jsonStr = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonStr) throw new Error("Risposta vuota da Gemini. Possibile blocco di sicurezza.");

      const startIdx = jsonStr.indexOf("{");
      const endIdx = jsonStr.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
      }
      const data = JSON.parse(jsonStr.trim()) as ProfileData;

      setProfileData(data);
      localStorage.setItem("cached_profile_data", JSON.stringify(data));
      localStorage.setItem("profile_thoughts_signature", currentSignature);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [thoughts.length]);

  // ─── Guard: API key mancante ──────────────────────────────────────────────
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

  const isFileSystemSupported = supportsFileSystemAccess();

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
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

      {/* Warning pochi pensieri */}
      {thoughts.length < 5 && (
        <div className="bg-[var(--bg-card)] border border-[var(--accent-warm)] text-[var(--text-primary)] p-4 rounded-xl text-sm mb-2 shadow-sm">
          <strong className="text-[var(--accent-warm)]">{t('profile.warning')}</strong> {t('profile.recordedOnly')} {thoughts.length} pensier{thoughts.length === 1 ? 'o' : 'i'}.
          L'analisi mostrata qui sotto è molto sommaria e potenzialmente non affidabile.
          Continua ad aggiungere {t('profile.thoughtPlural')} (ne consigliamo almeno 5) per delineare un profilo più accurato.
        </div>
      )}

      {/* Contenuto profilo */}
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

      {/* Pulsante export Obsidian */}
      <div className="mt-8 flex justify-center pb-2">
        <button
          onClick={() => { setShowExportModal(true); setModalStep("intro"); }}
          className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-medium transition-transform active:scale-95 text-sm hover:bg-[var(--bg-hover)]"
        >
          <Download size={16} />
          Esporta dati per Obsidian
        </button>
      </div>

      {/* Link download app */}
      <div className="mt-4 flex justify-center pb-8">
        <a
          href="https://i-miei-pensieri.web.app/scarica"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--text-accent)] font-medium underline decoration-[var(--text-accent)] underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Scarica le app ufficiali (iOS &amp; Android)
        </a>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           MODALE ESPORTAZIONE — 3 STEP
           Step 1: "Cos'è Obsidian?"
           Step 2: Disclaimer Privacy / consenso
           Step 3: Esportazione + istruzioni post-download
          ═══════════════════════════════════════════════════════════ */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-[var(--bg-primary)] w-full max-w-lg rounded-3xl flex flex-col border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={16} />
            </button>

            {/* Progress bar */}
            <div className="w-full h-1 bg-[var(--bg-secondary)]">
              <div
                className="h-1 bg-[var(--accent-warm)] transition-all duration-500"
                style={{
                  width: modalStep === "intro" ? "33%" : modalStep === "legal" ? "66%" : "100%"
                }}
              />
            </div>

            {/* ─── STEP 1: Intro Obsidian ─────────────────────────── */}
            {modalStep === "intro" && (
              <div className="p-6 flex flex-col gap-5">
                {/* Header con logo stile Obsidian */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg">
                    <Brain size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Cos'è Obsidian?</h3>
                    <p className="text-xs text-[var(--text-muted)]">Il tuo secondo cervello</p>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)]">Obsidian</strong> è un'app gratuita per prendere note che trasforma i tuoi pensieri in una <em>rete di conoscenza personale</em> — un vero e proprio <strong>secondo cervello digitale</strong>.
                </p>

                {/* Feature cards */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <span className="text-xl">🔗</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Connetti i tuoi pensieri</p>
                      <p className="text-xs text-[var(--text-muted)]">Crea link tra note e scopri connessioni che non sapevi di avere nella tua mente.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Visualizza graficamente la tua mente</p>
                      <p className="text-xs text-[var(--text-muted)]">La "Graph View" di Obsidian mostra i tuoi pensieri come una costellazione di idee collegate.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <span className="text-xl">🔒</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">I tuoi dati rimangono tuoi</p>
                      <p className="text-xs text-[var(--text-muted)]">Tutto è salvato come semplici file di testo sul tuo dispositivo. Nessun server esterno.</p>
                    </div>
                  </div>
                </div>

                {/* Download Obsidian CTA */}
                <a
                  href="https://obsidian.md/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink size={15} />
                    <span className="text-sm font-medium">Non hai Obsidian? Scaricalo gratis</span>
                  </div>
                  <ChevronRight size={15} className="opacity-60" />
                </a>

                <button
                  onClick={() => setModalStep("legal")}
                  className="w-full bg-[var(--accent-warm)] text-white py-3 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                >
                  Continua
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ─── STEP 2: Disclaimer Legale ─────────────────────── */}
            {modalStep === "legal" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Shield size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Avviso di Sicurezza</h3>
                    <p className="text-xs text-[var(--text-muted)]">Leggi prima di procedere</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">⚠️ I tuoi dati usciranno dalla cassaforte crittografata</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    L'app attualmente protegge i tuoi pensieri con crittografia end-to-end (E2EE). Esportando verso Obsidian, i file vengono salvati come <strong>testo in chiaro</strong> sul tuo dispositivo. Qualsiasi persona o app con accesso alla memoria del tuo dispositivo potrebbe leggerli.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="export-consent-checkbox"
                      checked={exportConsent}
                      onChange={(e) => setExportConsent(e.target.checked)}
                      className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border-orange-400 text-orange-500 focus:ring-orange-500/20"
                    />
                    <span className="text-sm text-orange-700 dark:text-orange-400 font-medium leading-snug">
                      Ho letto l'avviso. Comprendo che i miei dati saranno in formato non crittografato fuori dall'app e mi assumo la piena responsabilità per la loro sicurezza.
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStep("intro")}
                    className="flex-1 py-3 rounded-xl font-medium text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    ← Indietro
                  </button>
                  <button
                    onClick={() => setModalStep("export")}
                    disabled={!exportConsent}
                    className="flex-[2] bg-[var(--accent-warm)] text-white py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    Procedi
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Export + istruzioni post-download ────── */}
            {modalStep === "export" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <FolderOpen size={24} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Esporta in Obsidian</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {thoughts.length} pensieri pronti all'esportazione
                    </p>
                  </div>
                </div>

                {/* Stato esportazione */}
                {exportStatus === "idle" && (
                  <div className="flex flex-col gap-3">
                    {isFileSystemSupported ? (
                      <button
                        onClick={handleDirectExport}
                        id="obsidian-direct-export-btn"
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-3 shadow-lg"
                      >
                        <FolderOpen size={20} />
                        <span>Seleziona il tuo Vault Obsidian</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleZipExport}
                        id="obsidian-zip-export-btn"
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-3 shadow-lg"
                      >
                        <Download size={20} />
                        <span>Scarica archivio ZIP per Obsidian</span>
                      </button>
                    )}

                    {/* Istruzioni contestuali */}
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] flex flex-col gap-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                        {isFileSystemSupported ? "Come funziona (Desktop)" : "Come procedere (Mobile)"}
                      </p>
                      {isFileSystemSupported ? (
                        <ol className="text-xs text-[var(--text-secondary)] flex flex-col gap-2 list-none">
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                            <span>Clicca il pulsante qui sopra: si aprirà una finestra del sistema.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                            <span>Naviga e seleziona la cartella del tuo Vault di Obsidian.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                            <span>I tuoi pensieri appariranno <strong>istantaneamente</strong> dentro Obsidian nella cartella "00 - Inbox".</span>
                          </li>
                        </ol>
                      ) : (
                        <ol className="text-xs text-[var(--text-secondary)] flex flex-col gap-2 list-none">
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                            <span>Scarica il file <strong>.zip</strong> cliccando il pulsante qui sopra.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                            <span>Estrai il contenuto dello zip sul tuo computer.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                            <span>Trascina le cartelle estratte dentro la tua cartella Vault di Obsidian. Apri Obsidian: tutto è già lì! 🎉</span>
                          </li>
                        </ol>
                      )}
                    </div>
                  </div>
                )}

                {exportStatus === "writing" && (
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <Loader2 size={36} className="animate-spin text-violet-500" strokeWidth={1.5} />
                    <p className="text-sm text-[var(--text-secondary)]">{exportMessage}</p>
                  </div>
                )}

                {exportStatus === "done" && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-400 font-medium text-center">
                      {exportMessage}
                    </div>

                    {/* Istruzioni post-export */}
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] flex flex-col gap-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Prossimi passi in Obsidian</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-base">📁</span>
                          <p className="text-xs text-[var(--text-secondary)]">Apri Obsidian e trovi i tuoi pensieri nella cartella <strong>"00 - Inbox"</strong>.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-base">🔗</span>
                          <p className="text-xs text-[var(--text-secondary)]">Usa <strong>[[doppie parentesi]]</strong> per collegare note tra di loro e costruire la tua rete di conoscenza.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-base">🌐</span>
                          <p className="text-xs text-[var(--text-secondary)]">Prova la <strong>"Graph View"</strong> (dal menu laterale) per vedere la mappa visuale della tua mente.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-base">📊</span>
                          <p className="text-xs text-[var(--text-secondary)]">Apri il file <strong>"Indice_Pensieri.md"</strong> per una lista completa con link a tutti i tuoi pensieri.</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="w-full bg-[var(--accent-warm)] text-white py-3 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90"
                    >
                      Perfetto, chiudi
                    </button>
                  </div>
                )}

                {exportStatus === "error" && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 text-center">
                      {exportMessage}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setExportStatus("idle"); setExportMessage(""); }}
                        className="flex-1 py-3 rounded-xl font-medium text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        Riprova
                      </button>
                      <button
                        onClick={handleZipExport}
                        className="flex-[2] bg-[var(--accent-warm)] text-white py-3 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        Usa ZIP invece
                      </button>
                    </div>
                  </div>
                )}

                {exportStatus === "idle" && (
                  <button
                    onClick={() => setModalStep("legal")}
                    className="w-full py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    ← Indietro
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
