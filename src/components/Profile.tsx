import { useState, useEffect } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import { ProcessedThought } from "../types";
import { encryptText, decryptText } from '../lib/crypto';
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
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Zap from "lucide-react/dist/esm/icons/zap";
import SkipForward from "lucide-react/dist/esm/icons/skip-forward";

interface ProfileProps {
  thoughts: ProcessedThought[];
  apiKey: string;
  cryptoKey?: CryptoKey | null;
  enableAiAnalysis?: boolean;
}

interface ProfileData {
  profileText: string;
  booksToDeepen: { title: string; author: string; reason: string }[];
  booksToChallenge: { title: string; author: string; reason: string }[];
}

interface EnrichedThought {
  id: string;
  wikilinks: string[];
  paraFolder: "10 - Projects" | "20 - Areas" | "30 - Resources" | "40 - Archives";
  smartTags: string[];
}

interface EnrichedExportData {
  enrichedThoughts: EnrichedThought[];
  mocContent: string;
}

// ─── Browser Detection ─────────────────────────────────────────────────────────
type BrowserName = "chrome" | "firefox" | "safari" | "edge" | "other";

function detectBrowser(): BrowserName {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "chrome";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/^((?!chrome|android).)*safari/i.test(ua)) return "safari";
  return "other";
}

function supportsFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

// ─── Step enum ───────────────────────────────────────────────────────────────
type ModalStep = "intro" | "legal" | "ai-enrich" | "export";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeFileName(t: ProcessedThought): string {
  const date = new Date(t.timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const safeTitle = t.title
    .replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ ]/g, "")
    .trim()
    .slice(0, 50);
  return `${yyyy}-${mm}-${dd} - ${safeTitle}.md`;
}

function thoughtToMarkdown(
  t: ProcessedThought,
  enriched?: EnrichedThought
): string {
  const dateStr = new Date(t.timestamp).toISOString();
  const dateDisplay = new Date(t.timestamp).toLocaleDateString("it-IT", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Merge base tags with smart AI tags
  const baseTags = t.tags ? t.tags.map(tag => `"${tag}"`) : [];
  const smartTags = enriched?.smartTags
    ? enriched.smartTags.map(tag => `"${tag}"`)
    : [];
  const allTags = [...new Set([...baseTags, ...smartTags])];

  const wikilinksSection =
    enriched?.wikilinks && enriched.wikilinks.length > 0
      ? `\n## 🔗 Connessioni\n\n${enriched.wikilinks.map(l => `- [[${l}]]`).join("\n")}\n`
      : "";

  return `---
title: "${t.title.replace(/"/g, '\\"')}"
date: ${dateStr}
category: ${t.category}
tags: [${allTags.join(", ")}]
depth: ${t.depth}
mood: ${t.mood || "neutral"}
para: ${enriched?.paraFolder || "30 - Resources"}
source: i-miei-pensieri-app
---

# ${t.title}

> *Registrato il ${dateDisplay}*

${t.content}
${wikilinksSection}`;
}

function buildMOCMarkdown(
  thoughts: ProcessedThought[],
  enriched?: EnrichedExportData
): string {
  const now = new Date().toISOString();

  if (enriched?.mocContent) {
    return enriched.mocContent;
  }

  // Fallback MOC senza AI
  const byCategory = thoughts.reduce((acc, t) => {
    acc[t.category] = acc[t.category] || [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, ProcessedThought[]>);

  const categorySections = Object.entries(byCategory)
    .map(([cat, ts]) =>
      `### ${cat}\n\n${ts.map(t => `- [[${safeFileName(t).replace(".md", "")}|${t.title}]]`).join("\n")}`
    )
    .join("\n\n");

  return `---
tipo: mappa-contenuti
aggiornato_il: ${now}
totale_pensieri: ${thoughts.length}
tags: ["MOC", "indice", "dashboard"]
---

# 🧠 La Mia Mente — Dashboard

> Mappa generata automaticamente da **I Miei Pensieri**. Totale: **${thoughts.length}** pensieri.

---

## 📊 Tutti i Pensieri (Dataview)

\`\`\`dataview
TABLE mood as "Umore", depth as "Profondità", date as "Data"
FROM "00 - Inbox"
WHERE source = "i-miei-pensieri-app"
SORT date DESC
\`\`\`

---

## 🗂 Per Categoria

${categorySections}

---

## 📅 Recenti

\`\`\`dataview
LIST
FROM "00 - Inbox"
WHERE source = "i-miei-pensieri-app"
SORT date DESC
LIMIT 10
\`\`\`

---

## 💡 Suggerimento
Installa il plugin **Dataview** in Obsidian per far funzionare le tabelle dinamiche sopra.
`;
}

// ─── Componente principale ────────────────────────────────────────────────────

export function Profile({ thoughts, apiKey, cryptoKey, enableAiAnalysis = true }: ProfileProps) {
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("intro");
  const [exportConsent, setExportConsent] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "writing" | "done" | "error">("idle");
  const [exportMessage, setExportMessage] = useState("");
  const [vaultName, setVaultName] = useState<string | null>(
    () => localStorage.getItem("obsidian_vault_name")
  );

  // AI enrichment state
  const [enrichedData, setEnrichedData] = useState<EnrichedExportData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const closeModal = () => {
    setShowExportModal(false);
    setModalStep("intro");
    setExportConsent(false);
    setExportStatus("idle");
    setExportMessage("");
    setEnrichError(null);
  };

  // ─── Apertura Obsidian ──────────────────────────────────────────────────
  const openObsidian = (vault?: string) => {
    const name = vault || vaultName;
    if (!name) return;
    try {
      window.open(`obsidian://open?vault=${encodeURIComponent(name)}`, "_blank");
    } catch (_) {
      // silent fail — Obsidian non installato
    }
  };

  // ─── Arricchimento AI (Gemini) ──────────────────────────────────────────
  const fetchEnrichment = async () => {
    if (!apiKey || thoughts.length === 0) {
      setModalStep("export");
      return;
    }
    setIsEnriching(true);
    setEnrichError(null);

    try {
      // Truncate content to avoid token limits (max ~300 chars per thought)
      const thoughtsPayload = thoughts.map(th => ({
        id: th.id,
        title: th.title,
        content: th.content.slice(0, 300),
        category: th.category,
        tags: th.tags,
      }));

      const prompt = `Sei un sistema di knowledge management. Analizza questi ${thoughts.length} pensieri e per ciascuno restituisci un oggetto di arricchimento.

PENSIERI:
${JSON.stringify(thoughtsPayload, null, 2)}

Per ogni pensiero:
1. "wikilinks": array di titoli ESATTI di altri pensieri nell'elenco che sono tematicamente correlati (massimo 3). Se non ci sono correlazioni, restituisci array vuoto.
2. "paraFolder": scegli tra "10 - Projects" (obiettivi con scadenza), "20 - Areas" (responsabilità continue), "30 - Resources" (interessi/conoscenze), "40 - Archives" (inattivo/completato).
3. "smartTags": 3-5 tag semantici in italiano, minuscolo, senza spazi (usa-trattino).

Genera anche un "mocContent": una bellissima Dashboard in Markdown per Obsidian con:
- Header YAML frontmatter
- Blocchi \`\`\`dataview per mostrare tutti i pensieri in tabella
- Sezioni per categoria PARA
- Link [[wiki]] ai pensieri raggruppati per paraFolder
- Nota: richiede plugin Dataview in Obsidian`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              enrichedThoughts: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    wikilinks: { type: "ARRAY", items: { type: "STRING" } },
                    paraFolder: {
                      type: "STRING",
                      enum: ["10 - Projects", "20 - Areas", "30 - Resources", "40 - Archives"],
                    },
                    smartTags: { type: "ARRAY", items: { type: "STRING" } },
                  },
                  required: ["id", "wikilinks", "paraFolder", "smartTags"],
                },
              },
              mocContent: { type: "STRING" },
            },
            required: ["enrichedThoughts", "mocContent"],
          },
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      };

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Errore Gemini");
      }

      const responseData = await res.json();
      let jsonStr = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonStr) throw new Error("Risposta vuota da Gemini");

      const startIdx = jsonStr.indexOf("{");
      const endIdx = jsonStr.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
      }
      const data = JSON.parse(jsonStr.trim()) as EnrichedExportData;
      setEnrichedData(data);
      setModalStep("export");
    } catch (err: any) {
      setEnrichError(err.message || "Errore durante l'arricchimento AI");
    } finally {
      setIsEnriching(false);
    }
  };

  // ─── Export con File System Access API (Desktop) ────────────────────────
  const handleDirectExport = async () => {
    if (!exportConsent) return;
    setExportStatus("writing");
    setExportMessage("Selezione cartella Obsidian…");

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
        id: "obsidian-vault",
      });

      // Salva il nome vault per obsidian://open e per sessioni future
      const detectedVaultName: string = dirHandle.name;
      setVaultName(detectedVaultName);
      localStorage.setItem("obsidian_vault_name", detectedVaultName);

      let written = 0;

      // Mappa enrichment per id
      const enrichMap = new Map<string, EnrichedThought>(
        enrichedData?.enrichedThoughts.map(e => [e.id, e]) || []
      );

      // Scrivi pensieri nelle cartelle PARA corrette
      for (const thought of thoughts) {
        const enriched = enrichMap.get(thought.id);
        const folder = enriched?.paraFolder || "00 - Inbox";
        const folderHandle = await dirHandle.getDirectoryHandle(folder, { create: true });
        const fileName = safeFileName(thought);
        const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(thoughtToMarkdown(thought, enriched));
        await writable.close();
        written++;
        setExportMessage(`Scrittura ${written}/${thoughts.length} pensieri…`);
      }

      // Scrivi analisi psicologica
      if (profileData?.profileText) {
        const analysisContent = buildAnalysisMarkdown(profileData);
        const analysisHandle = await dirHandle.getFileHandle("Analisi_Psicologica.md", { create: true });
        const w = await analysisHandle.createWritable();
        await w.write(analysisContent);
        await w.close();
      }

      // Scrivi Dashboard MOC
      setExportMessage("Generazione Dashboard MOC…");
      const mocContent = buildMOCMarkdown(thoughts, enrichedData || undefined);
      const mocHandle = await dirHandle.getFileHandle("🧠 Dashboard.md", { create: true });
      const mocWritable = await mocHandle.createWritable();
      await mocWritable.write(mocContent);
      await mocWritable.close();

      setExportStatus("done");
      setExportMessage(
        `✅ ${written} pensieri scritti nel tuo Vault "${detectedVaultName}"!`
      );

      // Auto-open Obsidian dopo 800ms (solo se non Safari)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (!isSafari) {
        setTimeout(() => openObsidian(detectedVaultName), 800);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setExportStatus("idle");
        setExportMessage("");
      } else {
        setExportStatus("error");
        setExportMessage("Errore durante la scrittura dei file. Riprova.");
        console.error("Export error:", err);
      }
    }
  };

  // ─── Fallback ZIP (Mobile / Firefox) ────────────────────────────────────
  const handleZipExport = async () => {
    if (!exportConsent) return;
    setExportStatus("writing");
    setExportMessage("Creazione archivio ZIP…");

    try {
      const zip = new JSZip();
      const enrichMap = new Map<string, EnrichedThought>(
        enrichedData?.enrichedThoughts.map(e => [e.id, e]) || []
      );

      // Organizza in cartelle PARA dentro lo ZIP
      thoughts.forEach(thought => {
        const enriched = enrichMap.get(thought.id);
        const folder = enriched?.paraFolder || "00 - Inbox";
        zip.folder(folder)?.file(safeFileName(thought), thoughtToMarkdown(thought, enriched));
      });

      if (profileData?.profileText) {
        zip.file("Analisi_Psicologica.md", buildAnalysisMarkdown(profileData));
      }
      zip.file("🧠 Dashboard.md", buildMOCMarkdown(thoughts, enrichedData || undefined));

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "I_Miei_Pensieri_Obsidian.zip");

      setExportStatus("done");
      setExportMessage("✅ Archivio ZIP scaricato! Estrai e apri la cartella in Obsidian.");
    } catch (err) {
      console.error("ZIP export error:", err);
      setExportStatus("error");
      setExportMessage("Errore durante la creazione del file ZIP. Riprova.");
    }
  };

  // ─── Helpers markdown ────────────────────────────────────────────────────
  function buildAnalysisMarkdown(data: ProfileData): string {
    return `---
tipo: analisi-psicologica
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

  // ─── Fetch profilo psicologico ────────────────────────────────────────────
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
        if (cryptoKey) {
          const parsedCache = JSON.parse(cachedProfileData);
          if (parsedCache.ciphertext && parsedCache.iv) {
             const decryptedData = await decryptText(parsedCache.ciphertext, parsedCache.iv, cryptoKey);
             setProfileData(JSON.parse(decryptedData));
             return;
          }
        }
      } catch (_) { /* cache corrotta */ }
    }

    setIsLoading(true);
    setError(null);

    try {
      const systemGuardrails = `
        REGOLA TASSATIVA: Sei un assistente letterario e filosofico.
        Analizza i testi evidenziando temi, schemi e stili, associandoli esclusivamente a suggerimenti letterari o filosofici.
        NON sei un medico né uno psicologo. È SEVERAMENTE VIETATO diagnosticare disturbi, sindromi o patologie.
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
        Sulla base di questi pensieri, fai un'analisi completa e MOLTO ONESTA della persona che li ha scritti.
        Sii diretto, costruttivo e analitico.
        MOLTO IMPORTANTE: Se ci sono pochi pensieri (meno di 5), dichiara esplicitamente all'inizio che i dati sono insufficienti per un'analisi accurata.
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
              profileText: { type: "STRING" },
              booksToDeepen: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    author: { type: "STRING" },
                    reason: { type: "STRING" },
                  },
                  required: ["title", "author", "reason"],
                },
              },
              booksToChallenge: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    author: { type: "STRING" },
                    reason: { type: "STRING" },
                  },
                  required: ["title", "author", "reason"],
                },
              },
            },
            required: ["profileText", "booksToDeepen", "booksToChallenge"],
          },
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      };

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Errore nella generazione del profilo tramite Gemini.");
      }

      const responseData = await res.json();
      let jsonStr = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonStr) throw new Error("Risposta vuota da Gemini.");

      const startIdx = jsonStr.indexOf("{");
      const endIdx = jsonStr.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
      }
      const data = JSON.parse(jsonStr.trim()) as ProfileData;

      setProfileData(data);
      if (cryptoKey) {
        const encrypted = await encryptText(JSON.stringify(data), cryptoKey);
        localStorage.setItem("cached_profile_data", JSON.stringify(encrypted));
      }
      localStorage.setItem("profile_thoughts_signature", currentSignature);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (enableAiAnalysis) fetchProfile(); }, [thoughts.length, enableAiAnalysis]);

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (enableAiAnalysis && !apiKey) {
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
  const browser = detectBrowser();
  const isSafari = browser === "safari";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const [urlCopied, setUrlCopied] = useState(false);
  const stepIndex = { intro: 0, legal: 1, "ai-enrich": 2, export: 3 };
  const totalSteps = 4;

  // ─── Render ───────────────────────────────────────────────────────────────
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
      {enableAiAnalysis && thoughts.length < 5 && (
        <div className="bg-[var(--bg-card)] border border-[var(--accent-warm)] text-[var(--text-primary)] p-4 rounded-xl text-sm mb-2 shadow-sm">
          <strong className="text-[var(--accent-warm)]">{t('profile.warning')}</strong> {t('profile.recordedOnly')} {thoughts.length} pensier{thoughts.length === 1 ? "o" : "i"}.
          L'analisi mostrata è molto sommaria. Aggiungi almeno 5 {t('profile.thoughtPlural')} per un profilo accurato.
        </div>
      )}

      {/* Contenuto profilo */}
      {enableAiAnalysis && isLoading && !profileData ? (
        <div className="w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col items-center justify-center p-12 text-[var(--text-muted)] gap-4">
            <Loader2 className="animate-spin w-8 h-8" strokeWidth={1.5} />
            <span className="text-sm font-serif">{t('profile.analyzingText')}</span>
          </div>
        </div>
      ) : enableAiAnalysis && error ? (
        <div className="w-full text-[var(--accent-warm)] text-sm p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--accent-warm)]">
          {error}
        </div>
      ) : enableAiAnalysis && profileData ? (
        <div className="flex flex-col gap-6">
          <div className="w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="prose prose-zinc dark:prose-invert font-serif max-w-none text-[var(--text-secondary)] leading-relaxed prose-h3:mt-6 prose-h3:mb-3">
              <div className="markdown-body font-serif">
                <Markdown>{profileData.profileText || "Nessun profilo generato."}</Markdown>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.booksToDeepen?.length > 0 && (
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

            {profileData.booksToChallenge?.length > 0 && (
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

      {/* Pulsante export */}
      <div className="mt-8 flex justify-center pb-2">
        <button
          onClick={() => { setShowExportModal(true); setModalStep("intro"); }}
          id="obsidian-export-open-btn"
          className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-medium transition-transform active:scale-95 text-sm hover:bg-[var(--bg-hover)]"
        >
          <Download size={16} />
          Esporta dati per Obsidian
        </button>
      </div>

      {/* Link app */}
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

      {/* ═══════════════════════════════════════════════════════
           MODALE ESPORTAZIONE — 4 STEP
          ═══════════════════════════════════════════════════════ */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-[var(--bg-primary)] w-full max-w-lg rounded-3xl flex flex-col border border-[var(--border-color)] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={16} />
            </button>

            {/* Progress bar 4 step */}
            <div className="w-full h-1 bg-[var(--bg-secondary)] flex-shrink-0">
              <div
                className="h-1 bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
                style={{
                  width: `${((stepIndex[modalStep] + 1) / totalSteps) * 100}%`,
                }}
              />
            </div>

            {/* ── STEP 1: Intro Obsidian ─────────────────────────── */}
            {modalStep === "intro" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg">
                    <Brain size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Cos'è Obsidian?</h3>
                    <p className="text-xs text-[var(--text-muted)]">Il tuo secondo cervello digitale</p>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)]">Obsidian</strong> trasforma i tuoi pensieri in una <em>rete di conoscenza personale</em> interconnessa — visibile graficamente come una costellazione di idee.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { icon: "🔗", title: "Connetti i tuoi pensieri", desc: "Crea link [[wiki]] tra note e scopri connessioni invisibili." },
                    { icon: "🌐", title: "Graph View — la tua mente visuale", desc: "Visualizza tutti i tuoi pensieri come un grafo interattivo." },
                    { icon: "🤖", title: "AI integrata", desc: "Gemini analizzerà i tuoi pensieri e creerà i link automaticamente." },
                    { icon: "🔒", title: "I dati sono tuoi", desc: "File Markdown locali sul tuo dispositivo. Nessun server esterno." },
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <span className="text-xl flex-shrink-0">{f.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{f.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="https://obsidian.md/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink size={15} />
                    <span className="text-sm font-medium">Non hai Obsidian? Scaricalo gratis →</span>
                  </div>
                </a>

                <button
                  onClick={() => setModalStep("legal")}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-3 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                >
                  Inizia <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ── STEP 2: Disclaimer Legale ─────────────────────── */}
            {modalStep === "legal" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Shield size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Avviso Privacy</h3>
                    <p className="text-xs text-[var(--text-muted)]">Leggi prima di procedere</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">⚠️ I dati escono dalla cassaforte crittografata (E2EE)</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Esportando verso Obsidian, i tuoi pensieri vengono convertiti in file <strong>Markdown in chiaro</strong> sul tuo dispositivo. Qualsiasi app con accesso allo storage potrebbe leggerli. Sei l'unico responsabile della loro sicurezza.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="export-consent-checkbox"
                      checked={exportConsent}
                      onChange={e => setExportConsent(e.target.checked)}
                      className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border-orange-400 text-orange-500 focus:ring-orange-500/20"
                    />
                    <span className="text-sm text-orange-700 dark:text-orange-400 font-medium leading-snug">
                      Ho capito. I miei dati saranno in chiaro fuori dall'app e mi assumo la piena responsabilità per la loro sicurezza.
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
                    onClick={() => setModalStep("ai-enrich")}
                    disabled={!exportConsent}
                    className="flex-[2] bg-gradient-to-r from-violet-600 to-purple-700 text-white py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    Continua <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: AI Enrichment ─────────────────────────── */}
            {modalStep === "ai-enrich" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">✨ Potenzia con l'IA</h3>
                    <p className="text-xs text-[var(--text-muted)]">Passo opzionale — ~5 secondi</p>
                  </div>
                </div>

                {!isEnriching && !enrichedData && !enrichError && (
                  <>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Prima di esportare, vuoi che <strong>Gemini analizzi i tuoi pensieri</strong> e li arricchisca automaticamente?
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { icon: "🔗", label: "[[Wikilinks]] automatici tra pensieri correlati" },
                        { icon: "📁", label: "Categorizzazione automatica nelle cartelle PARA" },
                        { icon: "🏷️", label: "Tag semantici intelligenti in italiano" },
                        { icon: "📊", label: "Dashboard Dataview con tabelle dinamiche" },
                      ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)]">
                          <span className="text-base">{f.icon}</span>
                          <span className="text-sm text-[var(--text-secondary)]">{f.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setModalStep("export")}
                        className="flex-1 py-3 rounded-xl font-medium text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-1"
                      >
                        <SkipForward size={14} />
                        Salta
                      </button>
                      <button
                        onClick={fetchEnrichment}
                        className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        <Zap size={16} />
                        Potenzia con IA
                      </button>
                    </div>
                  </>
                )}

                {isEnriching && (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <div className="relative">
                      <Loader2 size={40} className="animate-spin text-amber-500" strokeWidth={1.5} />
                      <Sparkles size={16} className="text-amber-400 absolute -top-1 -right-1" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--text-primary)]">Gemini sta analizzando…</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Creazione wikilinks e categorizzazione PARA</p>
                    </div>
                  </div>
                )}

                {enrichedData && !isEnriching && (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ Arricchimento completato!</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {thoughts.length} pensieri categorizzati · Wikilinks generati · Dashboard MOC pronta
                      </p>
                    </div>
                    <button
                      onClick={() => setModalStep("export")}
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-3 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      Continua all'esportazione <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {enrichError && !isEnriching && (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">⚠️ Errore arricchimento AI</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{enrichError}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setModalStep("export")}
                        className="flex-1 py-3 rounded-xl font-medium text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        Salta e continua
                      </button>
                      <button
                        onClick={fetchEnrichment}
                        className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90"
                      >
                        Riprova
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Export ────────────────────────────────── */}
            {modalStep === "export" && (
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <FolderOpen size={24} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Esporta in Obsidian</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {thoughts.length} pensieri · {enrichedData ? "🤖 AI arricchiti" : "Export standard"}
                    </p>
                  </div>
                </div>

                {exportStatus === "idle" && (
                  <div className="flex flex-col gap-3">
                    {isFileSystemSupported ? (
                      <button
                        onClick={handleDirectExport}
                        id="obsidian-direct-export-btn"
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-3 shadow-lg"
                      >
                        <FolderOpen size={20} />
                        {vaultName ? `Aggiorna "${vaultName}"` : "Seleziona il tuo Vault Obsidian"}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* Banner Safari — scrittura diretta impossibile */}
                        {isSafari && (
                          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col gap-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xl flex-shrink-0">🌐</span>
                              <div>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                                  Safari non supporta la scrittura diretta
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                  Per importare <strong>direttamente</strong> nel tuo Vault senza ZIP,
                                  apri questa pagina in <strong>Chrome o Edge</strong>. Safari blocca
                                  l'accesso al filesystem per motivi di sicurezza.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={currentUrl}
                                className="flex-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-muted)] font-mono truncate"
                                onClick={e => (e.target as HTMLInputElement).select()}
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(currentUrl).then(() => {
                                    setUrlCopied(true);
                                    setTimeout(() => setUrlCopied(false), 2000);
                                  });
                                }}
                                className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                              >
                                {urlCopied ? "✓ Copiato!" : "Copia URL"}
                              </button>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">
                              Oppure usa il download ZIP qui sotto — funziona su tutti i browser.
                            </p>
                          </div>
                        )}
                        <button
                          onClick={handleZipExport}
                          id="obsidian-zip-export-btn"
                          className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-3 shadow-lg"
                        >
                          <Download size={20} />
                          Scarica archivio ZIP per Obsidian
                        </button>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] flex flex-col gap-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                        {isFileSystemSupported ? "Come funziona (Desktop)" : isSafari ? "Come procedere (Safari)" : "Come procedere (Mobile)"}
                      </p>
                      {isFileSystemSupported ? (
                        <ol className="text-xs text-[var(--text-secondary)] flex flex-col gap-2 list-none">
                          {[
                            vaultName
                              ? `Il vault "${vaultName}" è già memorizzato. Clicca e conferma l'accesso.`
                              : "Clicca il pulsante: si aprirà la finestra di selezione cartella.",
                            "Seleziona la cartella del tuo Vault di Obsidian (ricordata per le prossime volte).",
                            `I pensieri vengono scritti nelle cartelle PARA ${enrichedData ? "automaticamente" : "(cartella Inbox)"}. Obsidian si aprirà automaticamente!`,
                          ].map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : isSafari ? (
                        <ol className="text-xs text-[var(--text-secondary)] flex flex-col gap-2 list-none">
                          {[
                            "Copia l'URL qui sopra e aprilo in Chrome o Edge.",
                            "In Chrome, potrai selezionare direttamente la cartella del tuo Vault.",
                            "Oppure: scarica lo ZIP, estrailo e trascina le cartelle in Obsidian.",
                          ].map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <ol className="text-xs text-[var(--text-secondary)] flex flex-col gap-2 list-none">
                          {[
                            "Scarica il file .zip con il pulsante sopra.",
                            "Estrai il contenuto sul tuo computer.",
                            "Trascina le cartelle estratte dentro il tuo Vault Obsidian.",
                          ].map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] font-bold">
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                    <button
                      onClick={() => setModalStep("ai-enrich")}
                      className="w-full py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      ← Indietro
                    </button>
                  </div>
                )}

                {exportStatus === "writing" && (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <Loader2 size={36} className="animate-spin text-violet-500" strokeWidth={1.5} />
                    <p className="text-sm text-[var(--text-secondary)]">{exportMessage}</p>
                  </div>
                )}

                {exportStatus === "done" && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                      <p className="text-sm font-bold text-green-700 dark:text-green-400">{exportMessage}</p>
                    </div>

                    {/* Pulsante "Apri in Obsidian" */}
                    {(vaultName || isFileSystemSupported) && (
                      <button
                        onClick={() => openObsidian()}
                        id="open-obsidian-btn"
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-4 rounded-xl font-bold transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-3 shadow-lg"
                      >
                        <Brain size={20} />
                        🔮 Apri in Obsidian
                      </button>
                    )}

                    {/* Prossimi passi */}
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] flex flex-col gap-3">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Prossimi passi in Obsidian</p>
                      {[
                        { icon: "📁", text: `Trova i tuoi pensieri ${enrichedData ? "nelle cartelle PARA (Projects, Areas, Resources…)" : "nella cartella \"00 - Inbox\""}` },
                        { icon: "📊", text: "Apri \"🧠 Dashboard.md\" per la mappa visuale dei tuoi pensieri" },
                        { icon: "🌐", text: "Prova la Graph View per vedere le connessioni tra pensieri" },
                        { icon: "🔗", text: enrichedData ? "I [[wikilinks]] tra pensieri correlati sono già stati creati dall'IA!" : "Usa [[doppie parentesi]] per collegare le note manualmente" },
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-base flex-shrink-0">{step.icon}</span>
                          <p className="text-xs text-[var(--text-secondary)]">{step.text}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={closeModal}
                      className="w-full py-3 rounded-xl font-medium text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      Chiudi
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
                        Usa ZIP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
