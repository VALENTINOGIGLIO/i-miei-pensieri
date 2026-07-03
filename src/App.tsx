import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useThoughts } from './hooks/useThoughts';
import { useDictation } from './hooks/useDictation';
import { BottomNav } from './components/BottomNav';
import { Stats } from './components/Stats';
import { RecordButton } from './components/RecordButton';
import { ThoughtCard } from './components/ThoughtCard';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { PasswordSetup } from './components/PasswordSetup';
import { ApiKeySetup } from './components/ApiKeySetup';
import { Legal } from './components/Legal';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { encryptText, decryptText } from './lib/crypto';
import { onAuthStateChanged, getRedirectResult, browserPopupRedirectResolver, User } from 'firebase/auth';
import Share from "lucide-react/dist/esm/icons/share";
import Search from "lucide-react/dist/esm/icons/search";
import SettingsIcon from "lucide-react/dist/esm/icons/settings";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Lock from "lucide-react/dist/esm/icons/lock";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Database from "lucide-react/dist/esm/icons/database";
import Sun from "lucide-react/dist/esm/icons/sun";
import Moon from "lucide-react/dist/esm/icons/moon";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Globe from "lucide-react/dist/esm/icons/globe";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import X from "lucide-react/dist/esm/icons/x";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { ConnectionIndicator } from './components/ConnectionIndicator';
import { Profile } from './components/Profile';
import { LandingPage } from './components/LandingPage';
import { useLanguage } from './contexts/LanguageContext';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<"pensieri" | "analisi" | "impostazioni">("pensieri");
  const [viewMode, setViewMode] = useState<"list" | "categories">("list");
  
  // Settings / Features
  const [apiKey, setApiKey] = useState("");
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("theme") as "light" | "dark") || (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light"));
  const { t, langPref, setLangPref } = useLanguage();
  const [enablePanicMode, setEnablePanicMode] = useState(() => localStorage.getItem("enablePanicMode") === "true");
  const [enableLocation, setEnableLocation] = useState(() => localStorage.getItem("enableLocation") === "true");
  const [enableTimeCapsule, setEnableTimeCapsule] = useState(() => localStorage.getItem("enableTimeCapsule") === "true");
  
  const [isPanicModeActive, setIsPanicModeActive] = useState(false);
  const [selectedUnlockDate, setSelectedUnlockDate] = useState("");
  
  // Optional Feature Toggles
  const [enablePrompts, setEnablePrompts] = useState(() => localStorage.getItem("enablePrompts") === "true");
  const [enableAdvancedStats, setEnableAdvancedStats] = useState(() => {
    const saved = localStorage.getItem('enableAdvancedStats');
    return saved !== null ? saved === 'true' : true;
  });
  const [enableInnerConnection, setEnableInnerConnection] = useState(() => {
    const saved = localStorage.getItem('enableInnerConnection');
    return saved !== null ? saved === 'true' : true;
  });
  const [enableMoodSummary, setEnableMoodSummary] = useState(() => {
    const saved = localStorage.getItem('enableMoodSummary');
    return saved !== null ? saved === 'true' : true;
  });
  const [enableAiAnalysis, setEnableAiAnalysis] = useState(() => {
    const saved = localStorage.getItem('enableAiAnalysis');
    return saved !== null ? saved === 'true' : true;
  });

  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const { thoughts, setThoughts, loading: thoughtsLoading, saveThought, deleteThought, updateThought, updateThoughtsBulk } = useThoughts(user, cryptoKey);
  const { isListening, transcript, error: dictationError, startListening, stopListening, isSupported } = useDictation();
  const [lastTranscript, setLastTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [showTranslateModal, setShowTranslateModal] = useState<string | null>(null);
  const [isTranslatingThoughts, setIsTranslatingThoughts] = useState(false);

  const promptsList = [
    "Quale ideologia politica trovi più pericolosa oggi, e perché parte di te ne è attratta?",
    "Cosa ti spaventa di più del tuo futuro e come la società ha plasmato questa paura?",
    "C'è una decisione morale passata che ti tormenta ancora?",
    "Come la classe sociale in cui sei nato ha definito i tuoi limiti psicologici?",
    "Se la tua filosofia di vita fosse applicata da tutti, il mondo collasserebbe?",
    "Qual è un tuo pregiudizio di cui sei consapevole ma che non riesci a sradicare?",
    "In che modo il tuo desiderio di approvazione sociale ti rende vulnerabile?",
    "Stai vivendo la tua vita o stai recitando un ruolo imposto dal tuo ambiente?",
    "Quale aspetto della psicologia umana trovi inaccettabile?",
    "Il concetto di libertà individuale è solo un'illusione rassicurante per te?"
  ];
  const [currentPrompt, setCurrentPrompt] = useState(promptsList[Math.floor(Math.random() * promptsList.length)]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);


  useEffect(() => {
    localStorage.setItem("enablePrompts", String(enablePrompts));
    localStorage.setItem("enableAdvancedStats", String(enableAdvancedStats));
    localStorage.setItem("enableInnerConnection", String(enableInnerConnection));
    localStorage.setItem("enableMoodSummary", String(enableMoodSummary));
    localStorage.setItem("enablePanicMode", String(enablePanicMode));
    localStorage.setItem("enableLocation", String(enableLocation));
    localStorage.setItem("enableTimeCapsule", String(enableTimeCapsule));
    localStorage.setItem("enableAiAnalysis", String(enableAiAnalysis));
  }, [enablePrompts, enableAdvancedStats, enableInnerConnection, enableMoodSummary, enablePanicMode, enableLocation, enableTimeCapsule, enableAiAnalysis]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedAi = localStorage.getItem('enableAiAnalysis');
      if (savedAi !== null) setEnableAiAnalysis(savedAi === 'true');
      
      const savedLoc = localStorage.getItem('enableLocation');
      if (savedLoc !== null) setEnableLocation(savedLoc === 'true');
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/scarica") return;
    const hasSeen = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeen) setShowOnboarding(true);

    const timeout = setTimeout(() => setAuthLoading(false), 5000);
    getRedirectResult(auth, browserPopupRedirectResolver).catch(err => console.error("Redirect Auth Error", err));

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      clearTimeout(timeout);
      setUser(u);
      setAuthLoading(false);
      if (!u) setCryptoKey(null);
    }, (err) => {
      console.error("Auth Error", err);
      clearTimeout(timeout);
      setAuthLoading(false);
    });
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, []);

  // Sync API Key from Firestore when cryptoKey is available
  useEffect(() => {
    const fetchApiKey = async () => {
      if (user && cryptoKey) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.encryptedApiKey && data.apiKeyIv) {
              const decryptedKey = await decryptText(data.encryptedApiKey, data.apiKeyIv, cryptoKey);
              if (decryptedKey) {
                setApiKey(decryptedKey);
              }
            }
          }
        } catch (e) {
          console.error("Errore nel recupero della API key:", e);
        }
      }
    };
    fetchApiKey();
  }, [user, cryptoKey]);

  // Auto-rename old default thoughts
  useEffect(() => {
    const toRename = thoughts.filter(t => t.title === "Pensiero Veloce" || t.title === "Pensiero Salvato");
    if (toRename.length > 0) {
      const bulkUpdates = toRename.map(t => {
        let defaultTitle = t.content.split(' ').slice(0, 5).join(' ');
        if (t.content.split(' ').length > 5) defaultTitle += '...';
        return { id: t.id, updatedData: { title: defaultTitle } };
      });
      updateThoughtsBulk(bulkUpdates).catch(console.error);
    }
  }, [thoughts, updateThoughtsBulk]);

  const handleSaveApiKey = async (key: string) => {
    setApiKey(key);
    setShowApiKeySetup(false);
    
    if (user && cryptoKey && key) {
      try {
        const { ciphertext, iv } = await encryptText(key, cryptoKey);
        await setDoc(doc(db, 'users', user.uid), {
          encryptedApiKey: ciphertext,
          apiKeyIv: iv
        }, { merge: true });
      } catch (e) {
        console.error("Errore nel salvataggio della API key:", e);
      }
    } else if (user && !key) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          encryptedApiKey: null,
          apiKeyIv: null
        }, { merge: true });
      } catch (e) {}
    }
  };

  const handleShare = async () => {
    try {
      const baseUrl = window.location.origin;
      if (navigator.share) {
        await navigator.share({
          title: "I miei Pensieri",
          text: "Registra e riordina i tuoi pensieri con l'Intelligenza Artificiale in modo sicuro!",
          url: baseUrl,
        });
      } else {
        await navigator.clipboard.writeText(baseUrl);
        alert("Link copiato negli appunti! L'app è pronta per essere condivisa.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rollPrompt = async () => {
    if (!apiKey) {
      setShowApiKeySetup(true);
      return;
    }
    setIsGeneratingPrompt(true);
    try {
      const topics = ["sociologia", "psicologia umana profonda", "filosofia morale ed etica", "ideologia e condizionamento sociale", "politica e potere", "l'alienazione tecnologica", "il senso dell'esistenza", "le illusioni della società moderna", "la natura del dolore umano", "il libero arbitrio e il determinismo"];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const recentThoughts = thoughts.slice(0, 10).map(t => t.content).join("\n");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Agisci come un pensatore critico, spietato e profondo. Genera una singola e breve domanda (max 15-20 parole) che tratti in modo specifico di ${randomTopic}. Deve essere una domanda impegnativa, difficile, che spinga a una riflessione scomoda e metta in discussione le certezze dell'utente. NON usare toni motivazionali, banali o da 'life coach'. Evita domande generiche o già fatte in precedenza, sii sempre estremamente vario e originale. Se forniti, puoi usare questi pensieri dell'utente come leggero spunto per la tua critica, ma mantieni il focus sul tema ${randomTopic}:\n${recentThoughts}` }] }],
            generationConfig: { temperature: 0.9 },
          }),
        }
      );
      const data = await res.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (answer) setCurrentPrompt(answer.replace(/"/g, "").trim());
    } catch (e) {
      setCurrentPrompt(promptsList[Math.floor(Math.random() * (promptsList.length - 1))]);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleStopRecording = async () => {
    stopListening();
    if (!transcript.trim()) return;
    setLastTranscript(transcript);
    setIsProcessing(true);
    setProcessError(null);
    try {
      let defaultTitle = transcript.trim().split(' ').slice(0, 5).join(' ');
      if (transcript.trim().split(' ').length > 5) defaultTitle += '...';
      let aiResult = { title: defaultTitle, content: transcript.trim(), tags: ["riflessione"], depth: 5, category: "Altro" };
      
      if (apiKey) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Analizza questo pensiero vocale trascritto e restituisci SOLO un JSON valido con questa struttura esatta, senza formattazione markdown e senza commenti:\n{"title": "Un titolo breve e accattivante", "content": "Il testo originale, migliorato leggermente per scorrevolezza se necessario ma mantenendo il significato", "tags": ["tag1", "tag2"], "depth": 7, "category": "Lavoro/Personale/Relazioni/Sviluppo"}\n\nPensiero: "${transcript}"` }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          })
        });
        const data = await res.json();
        let textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResp) {
          const startIdx = textResp.indexOf('{');
          const endIdx = textResp.lastIndexOf('}');
          if (startIdx !== -1 && endIdx !== -1) {
            textResp = textResp.substring(startIdx, endIdx + 1);
          }
          aiResult = JSON.parse(textResp);
        }
      }

      let locationObj = undefined;
      if (enableLocation && "geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          locationObj = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (e) {
          console.error("Geolocalizzazione fallita:", e);
        }
      }

      let unlockTimestamp = undefined;
      if (enableTimeCapsule && selectedUnlockDate) {
        unlockTimestamp = new Date(selectedUnlockDate).getTime();
      }

      await saveThought({
        id: crypto.randomUUID(),
        title: aiResult.title || "Nuovo Pensiero",
        content: aiResult.content || transcript.trim(),
        rawText: transcript.trim(),
        originalAudio: transcript.trim(),
        timestamp: Date.now(),
        tags: aiResult.tags || ["riflessione"],
        depth: aiResult.depth || 5,
        category: aiResult.category || "Altro",
        location: locationObj,
        unlockDate: unlockTimestamp
      });
      setSelectedUnlockDate("");
      
    } catch (err) {
      console.error(err);
      setProcessError("Errore nell'analisi del pensiero. Assicurati che la chiave API sia valida.");
      // Salva comunque il pensiero originale in caso di errore AI
      await saveThought({
        id: crypto.randomUUID(),
        title: "Pensiero Salvato",
        content: transcript.trim(),
        rawText: transcript.trim(),
        originalAudio: transcript.trim(),
        timestamp: Date.now(),
        tags: ["bozza"],
        depth: 5,
        category: "Altro"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportThoughtsTxt = () => {
    if (thoughts.length === 0) return;
    const txt = thoughts.map(t => `Titolo: ${t.title}\nData: ${new Date(t.timestamp).toLocaleString()}\nTesto: ${t.content}\nTags: ${t.tags.join(', ')}\nCategoria: ${t.category}\n\n------------------------\n\n`).join('');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'i-miei-pensieri-backup.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportThoughtsJson = () => {
    if (thoughts.length === 0) return;
    const blob = new Blob([JSON.stringify(thoughts, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'i-miei-pensieri-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTranslateThoughts = async (method: 'ai' | 'free', targetLang: string) => {
    if (method === 'ai' && localStorage.getItem('privacy_accepted_v2') === 'false') {
      window.dispatchEvent(new Event('open_privacy_modal'));
      return;
    }
    
    if (method === 'ai' && !apiKey) {
      setShowTranslateModal(null);
      setShowApiKeySetup(true);
      return;
    }
    
    setShowTranslateModal(null);
    setIsTranslatingThoughts(true);
    
    const langName = targetLang === 'en' ? 'Inglese' : 'Italiano';
    
    try {
      const bulkUpdates = [];
      for (const t of thoughts) {
        let newContent = t.content;
        
        if (method === 'ai') {
          const prompt = `Traduci il seguente testo in ${langName}. Restituisci SOLO il testo tradotto, senza commenti aggiuntivi:\n\n${t.content}`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
          });
          const data = await res.json();
          const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResp) newContent = textResp;
        } else {
          // Free API MyMemory
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t.content)}&langpair=autodetect|${targetLang}`);
          const data = await res.json();
          if (data.responseData?.translatedText) newContent = data.responseData.translatedText;
        }
        
        bulkUpdates.push({ id: t.id, updatedData: { content: newContent } });
        // sleep a bit to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (bulkUpdates.length > 0) {
        await updateThoughtsBulk(bulkUpdates);
      }
      alert(t('app.translationCompleted'));
    } catch (e) {
      console.error(e);
      alert(t('app.translationError'));
    } finally {
      setIsTranslatingThoughts(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      // 1. Delete all Firestore thought documents
      const { db } = await import('./lib/firebase');
      const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      const thoughtsRef = collection(db, 'users', user.uid, 'thoughts');
      const snapshot = await getDocs(thoughtsRef);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'thoughts', d.id))));

      // 2. Clear all local storage data
      const keysToRemove = Object.keys(localStorage).filter(
        k => !['theme'].includes(k) // keep theme preference
      );
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // 3. Delete Firebase Auth account
      await user.delete();

      // Done — auth state change will redirect to Login automatically
    } catch (err: any) {
      console.error(err);
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
      alert(t('app.deleteError').replace('{{message}}', err.message));
    }
  };

  if (window.location.pathname === "/scarica" || window.location.pathname === "/landing") {
    return <LandingPage />;
  }

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-16 h-16 border-4 border-[var(--accent-warm)] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--text-secondary)] font-medium">Avvio dell'ambiente sicuro...</p>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <Onboarding onComplete={() => setShowOnboarding(false)} />
        <Legal />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Login />
        <Legal />
      </>
    );
  }

  if (!cryptoKey) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-primary)]">
        <header className="p-4 flex items-center justify-between border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-warm)] flex items-center justify-center shadow-lg">
              <Lock size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold font-outfit text-[var(--text-primary)] tracking-tight">{t('app.unlock')}</h1>
          </div>
          <button onClick={() => auth.signOut()} className="text-[var(--text-secondary)] text-sm">{t('app.logout')}</button>
        </header>
        <div className="flex-1 p-6 flex flex-col">
          <PasswordSetup onKeyDerived={setCryptoKey} />
        </div>
        <Legal />
      </div>
    );
  }

  const renderPensieri = () => (
    <div className="flex-1 overflow-y-auto flex flex-col relative">
      
      {/* Mic Box - at top of tab area */}
      <div className="px-4 py-3 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex flex-col items-center sticky top-0 z-30 shadow-sm backdrop-blur-md bg-opacity-95">
        {transcript && isListening && (
          <div className="w-full bg-[var(--bg-card)] p-3 rounded-xl shadow-sm border border-[var(--border-color)] italic text-[var(--text-secondary)] font-serif text-sm text-center mb-3">
            "{transcript}"
          </div>
        )}
        {enableTimeCapsule && (
          <label className="w-full flex items-center justify-between bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] mb-3 cursor-pointer active:bg-[var(--bg-card)]">
            <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2 shrink-0">
              <Lock size={16} /> {t('app.timeCapsule')}
            </span>
            <div className="flex-1 flex justify-end">
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                value={selectedUnlockDate} 
                onChange={(e) => setSelectedUnlockDate(e.target.value)}
                className="bg-transparent text-sm text-[var(--text-primary)] outline-none cursor-pointer text-right min-w-[120px]"
              />
            </div>
          </label>
        )}
        <div className="py-2 w-full">
          <RecordButton 
            isListening={isListening} 
            onStart={() => {
              if (!apiKey) {
                setShowApiKeySetup(true);
                return;
              }
              startListening();
            }} 
            onStop={handleStopRecording} 
            disabled={isProcessing} 
          />
        </div>
      </div>
      
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-outfit text-[var(--text-primary)]">{t('app.yourMind')}</h2>
          {enablePanicMode && (
            <button
              onClick={() => setIsPanicModeActive(!isPanicModeActive)}
              className={`p-2 rounded-full transition-colors ${isPanicModeActive ? 'bg-red-100 text-red-500' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500'}`}
              title={t('app.panicMode')}
            >
              <Lock size={20} />
            </button>
          )}
        </div>

        {enablePrompts && (
          <div className="mb-8 relative">
             <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-cool)] rounded-2xl opacity-10 blur-xl"></div>
             <div className="relative bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-warm)]/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={20} className="text-[var(--accent-warm)]" />
                  </div>
                  <button onClick={rollPrompt} disabled={isGeneratingPrompt} className="text-[var(--accent-warm)] text-sm font-medium hover:opacity-80 transition-opacity">
                    {isGeneratingPrompt ? "Analisi..." : "Cambia"}
                  </button>
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] font-outfit leading-snug">{currentPrompt}</h3>
             </div>
          </div>
        )}

        {thoughtsLoading ? (
           <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[var(--accent-warm)] border-t-transparent rounded-full animate-spin"></div></div>
        ) : thoughts.length === 0 ? (
           <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] border-dashed mt-4">
             <p className="text-[var(--text-secondary)]">{t('app.noThoughts')}</p>
           </div>
        ) : (
          <div className={`space-y-4 ${isPanicModeActive ? 'blur-md pointer-events-none opacity-50' : ''} transition-all duration-300`}>
            <AnimatePresence>
              {thoughts.map(thought => (
                <ThoughtCard key={thought.id} thought={thought} onDelete={deleteThought} onUpdate={updateThought} apiKey={apiKey} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      <Legal />
    </div>
  );

  return (
    <LazyMotion features={domAnimation}>
      <div className="h-[100dvh] bg-[var(--bg-primary)] flex flex-col overflow-hidden w-full md:max-w-2xl lg:max-w-4xl mx-auto relative shadow-2xl md:border-x border-[var(--border-color)]">
        {/* Main Content Area - flex-1 allows it to take remaining height minus BottomNav */}
        <div className="flex-1 overflow-hidden flex flex-col relative z-0">
           {activeTab === 'pensieri' && renderPensieri()}
           {activeTab === 'analisi' && (
             <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
                {localStorage.getItem('privacy_accepted_v2') === 'false' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center shadow-lg">
                    <div className="w-12 h-12 bg-red-500 mx-auto mb-3 rounded-full" />
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{t('app.limitedFeatures')}</h3>
                    <p className="text-[var(--text-secondary)] mb-4 text-sm">
                      Hai rifiutato l'Informativa sulla Privacy, pertanto le funzionalità di analisi IA sono state disabilitate.
                      {t('app.acceptTermsToReactivate')}
                    </p>
                    <button 
                      onClick={() => window.dispatchEvent(new Event('open_privacy_modal'))}
                      className="bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] px-6 py-2 rounded-xl font-bold hover:bg-[var(--bg-hover)] transition-colors text-sm"
                    >
                      Mostra Termini
                    </button>
                  </div>
                )}
                {enableInnerConnection && <ConnectionIndicator thoughts={thoughts} />}
                <Profile thoughts={thoughts} apiKey={apiKey} cryptoKey={cryptoKey} enableAiAnalysis={enableAiAnalysis} />
                <Stats thoughts={thoughts} enableAdvancedStats={enableAdvancedStats} enableMoodSummary={enableMoodSummary} enableInnerConnection={false} apiKey={apiKey} />
                <Legal />
             </div>
           )}
           {activeTab === 'impostazioni' && (
             <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
               <div className="flex items-center gap-2 mb-6">
                 <SettingsIcon size={24} className="text-[var(--text-primary)]" />
                 <h2 className="text-2xl font-bold font-outfit text-[var(--text-primary)]">{t('app.settings')}</h2>
               </div>
               
               <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                 <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors text-left">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-[var(--text-primary)]/10 flex items-center justify-center">
                       {theme === 'light' ? <Sun size={20} className="text-[var(--text-primary)]" /> : <Moon size={20} className="text-[var(--text-primary)]" />}
                     </div>
                     <div>
                       <h3 className="font-medium text-[var(--text-primary)]">{t('app.theme')}</h3>
                       <p className="text-sm text-[var(--text-secondary)]">{theme === 'light' ? t('app.light') : t('app.dark')}</p>
                     </div>
                   </div>
                   <ChevronRight size={20} className="text-[var(--text-tertiary)]" />
                 </button>
                 
                 <div className="h-[1px] bg-[var(--border-color)] w-full"></div>

                  {/* Language row */}
                  <div className="w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Globe size={20} className="text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[var(--text-primary)]">{t('app.language')}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {langPref === 'auto' ? 'Automatica' : langPref === 'it' ? 'Italiano' : 'English'}
                        </p>
                      </div>
                    </div>
                    {/* 3-way segmented control */}
                    <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-1 gap-1">
                      {(['it', 'en', 'auto'] as const).map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            if (langPref !== lang) {
                              setLangPref(lang);
                              if (lang === 'it' || lang === 'en') setShowTranslateModal(lang);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            langPref === lang
                              ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/30'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {lang === 'it' ? '🇮🇹 IT' : lang === 'en' ? '🇬🇧 EN' : '🔄 Auto'}
                        </button>
                      ))}
                    </div>
                  </div>

                 <div className="h-[1px] bg-[var(--border-color)] w-full"></div>

                 <button onClick={() => setShowFeaturesModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors text-left">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-[var(--accent-warm)]/10 flex items-center justify-center">
                       <Sparkles size={20} className="text-[var(--accent-warm)]" />
                     </div>
                     <div>
                       <h3 className="font-medium text-[var(--text-primary)]">{t('app.additionalFeatures')}</h3>
                       <p className="text-sm text-[var(--text-secondary)]">{t('app.customizeExperience')}</p>
                     </div>
                   </div>
                   <ChevronRight size={20} className="text-[var(--text-tertiary)]" />
                 </button>
                 
                 <div className="h-[1px] bg-[var(--border-color)] w-full"></div>
                 
                 <button onClick={() => setShowApiKeySetup(true)} className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors text-left">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                       <Database size={20} className="text-blue-500" />
                     </div>
                     <div>
                       <h3 className="font-medium text-[var(--text-primary)]">{t('app.apiKey')}</h3>
                       <p className="text-sm text-[var(--text-secondary)]">{apiKey ? t('app.configured') : t('app.notConfigured')}</p>
                     </div>
                   </div>
                   <ChevronRight size={20} className="text-[var(--text-tertiary)]" />
                 </button>
                 
                 <div className="h-[1px] bg-[var(--border-color)] w-full"></div>
                 
                 <button onClick={() => setShowSecurityModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors text-left text-red-500">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                       <Lock size={20} className="text-red-500" />
                     </div>
                     <div>
                       <h3 className="font-medium">{t('app.securityAndAccount')}</h3>
                       <p className="text-sm opacity-80">{t('app.manageData')}</p>
                     </div>
                   </div>
                   <ChevronRight size={20} className="opacity-50" />
                 </button>
               </div>

                {/* ─── Esporta Pensieri ─── */}
                <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-color)] mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 text-[var(--accent-warm)] rounded-xl flex items-center justify-center">
                      <Download size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] text-base">{t('app.exportThoughts')}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{t('app.downloadBackup')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={exportThoughtsTxt} className="flex-1 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] py-3 rounded-xl font-bold hover:bg-[var(--bg-hover)] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                      <FileText size={16} /> .TXT
                    </button>
                    <button onClick={exportThoughtsJson} className="flex-1 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] py-3 rounded-xl font-bold hover:bg-[var(--bg-hover)] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                      <Database size={16} /> .JSON
                    </button>
                  </div>
                </div>

                {/* ─── ZONA PERICOLOSA: Elimina Account ─── */}
                <div className="mt-2 border-2 border-red-500/30 rounded-2xl overflow-hidden bg-red-500/5">
                  <div className="p-4 border-b border-red-500/20">
                    <h3 className="font-bold text-red-500 text-base flex items-center gap-2">
                      <Trash2 size={18} />
                      {t('app.dangerZone')}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Azioni irreversibili sull'account.
                    </p>
                  </div>
                  <div className="p-4">
                    <button
                      id="delete-account-btn"
                      onClick={() => { setDeleteConfirmText(""); setShowDeleteModal(true); }}
                      className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 text-base"
                    >
                      <Trash2 size={22} />
                      {t('app.deleteAccountBtn')}
                    </button>
                    <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
                      Ai sensi del GDPR Art. 17 (diritto all'oblio), puoi richiedere la cancellazione
                      completa e irreversibile di tutti i tuoi dati. L'operazione è permanente.
                    </p>
                  </div>
                </div>
                
                {/* ─── Link Legali ─── */}
                <div className="flex flex-col items-center justify-center gap-2 mt-8 mb-4">
                  <button onClick={() => window.dispatchEvent(new Event('open_privacy_modal'))} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline decoration-dotted underline-offset-4">
                    {t('app.privacyAndTerms', { defaultValue: 'Privacy & Termini di Servizio' })}
                  </button>
                </div>
             </div>
           )}
        </div>
        
        {/* Absolute Bottom Navigation */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          enableAnalisi={enableAiAnalysis || enableAdvancedStats || enableMoodSummary || enableInnerConnection} 
        />
        
        <Legal />

        {/* Modals via Portal to escape stacking context */}
        {createPortal(
          <AnimatePresence>
            {isTranslatingThoughts && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
                <Loader2 size={48} className="text-white animate-spin mb-4" />
                <h2 className="text-white text-xl font-bold">{t('app.translating')}</h2>
                <p className="text-white/80 mt-2">Attendere prego, non chiudere l'applicazione.</p>
              </div>
            )}
            {showTranslateModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowTranslateModal(null)}>
                <div className="bg-[var(--bg-primary)] rounded-3xl p-6 w-full max-w-md max-h-[85dvh] flex flex-col border border-[var(--border-color)] shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('app.translateThoughtsTitle')}</h2>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                    Hai cambiato la lingua dell'interfaccia. Vuoi tradurre anche tutti i tuoi pensieri passati nella nuova lingua?
                  </p>
                  
                  <div className="space-y-3 overflow-y-auto">
                    <button 
                      onClick={() => handleTranslateThoughts('ai', showTranslateModal)}
                      className="w-full text-left p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-purple-500/50 bg-[var(--bg-secondary)] transition-all flex items-start gap-3"
                    >
                      <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{t('app.useAi')}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          (Consigliato) Traduzione eccellente. I pensieri verranno inviati temporaneamente a Google Gemini.
                          Richiede l'accettazione della Privacy.
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleTranslateThoughts('free', showTranslateModal)}
                      className="w-full text-left p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-orange-500/50 bg-[var(--bg-secondary)] transition-all flex items-start gap-3"
                    >
                      <Globe className="text-orange-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{t('app.useFreeTranslator')}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          {t('app.useFreeTranslatorDesc')}
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setShowTranslateModal(null)}
                      className="w-full text-left p-4 rounded-xl border-2 border-[var(--border-color)] hover:bg-[var(--bg-hover)] bg-[var(--bg-secondary)] transition-all flex items-start gap-3"
                    >
                      <X className="text-[var(--text-tertiary)] shrink-0 mt-0.5" size={20} />
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">Non tradurre i pensieri</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          Traduci solo l'interfaccia, lascia i pensieri vecchi nella lingua originale.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showApiKeySetup && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <ApiKeySetup key="api-setup" currentKey={apiKey} onSave={handleSaveApiKey} onClose={() => setShowApiKeySetup(false)} />
              </div>
            )}
            {showFeaturesModal && (
              <m.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={() => setShowFeaturesModal(false)}
              >
                <m.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                  className="bg-[var(--bg-primary)] rounded-3xl p-6 w-full max-w-md max-h-[85dvh] flex flex-col border border-[var(--border-color)] shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold font-outfit text-[var(--text-primary)]">{t('app.additionalFeatures')}</h2>
                    <button onClick={() => setShowFeaturesModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">✕</button>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto pr-2 pb-2">
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.inspiringPhrases')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.inspiringPhrasesDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enablePrompts} onChange={e => setEnablePrompts(e.target.checked)} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.aiAnalysis')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.aiAnalysisDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enableAiAnalysis} onChange={e => {
                        if (e.target.checked && localStorage.getItem('privacy_accepted_v2') === 'false') {
                          window.dispatchEvent(new Event('open_privacy_modal'));
                          return;
                        }
                        setEnableAiAnalysis(e.target.checked);
                      }} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.advancedStats')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.advancedStatsDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enableAdvancedStats} onChange={e => setEnableAdvancedStats(e.target.checked)} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.innerConnection')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.innerConnectionDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enableInnerConnection} onChange={e => setEnableInnerConnection(e.target.checked)} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.moodSummary')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.moodSummaryDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enableMoodSummary} onChange={e => {setEnableMoodSummary(e.target.checked); localStorage.setItem('enableMoodSummary', String(e.target.checked));}} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                    
                    <div className="my-4 h-[1px] bg-[var(--border-color)] w-full"></div>
                    
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.panicMode')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.panicModeDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enablePanicMode} onChange={e => {setEnablePanicMode(e.target.checked); localStorage.setItem('enablePanicMode', String(e.target.checked));}} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.timeCapsule')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.timeCapsuleDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enableTimeCapsule} onChange={e => {setEnableTimeCapsule(e.target.checked); localStorage.setItem('enableTimeCapsule', String(e.target.checked));}} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                      <div className="flex-1 pr-4">
                        <span className="block font-medium text-[var(--text-primary)]">{t('features.location')}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{t('features.locationDesc')}</span>
                      </div>
                      <input type="checkbox" checked={enableLocation} onChange={e => {
                        if (e.target.checked && localStorage.getItem('privacy_accepted_v2') === 'false') {
                          window.dispatchEvent(new Event('open_privacy_modal'));
                          return;
                        }
                        setEnableLocation(e.target.checked);
                        localStorage.setItem('enableLocation', String(e.target.checked));
                      }} className="w-6 h-6 rounded-md accent-[var(--accent-warm)]" />
                    </label>
                  </div>
                </m.div>
              </m.div>
            )}
            {showSecurityModal && (
              <m.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
                onClick={() => setShowSecurityModal(false)}
              >
                <m.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                  className="bg-[var(--bg-primary)] rounded-3xl p-6 w-full max-w-md max-h-[85dvh] flex flex-col border border-[var(--border-color)] shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold font-outfit text-red-500">Sicurezza e Privacy</h2>
                    <button onClick={() => setShowSecurityModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">✕</button>
                  </div>
                  
                  <div className="space-y-6 overflow-y-auto pr-2 pb-2">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-[var(--text-primary)]">Come funziona in modo semplice:</h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        Solo tu puoi leggere i tuoi pensieri grazie alla tua password. Nessun altro può accedervi, nemmeno noi creatori dell'app. Attenzione però: se dimentichi la password, i tuoi pensieri andranno persi per sempre poiché non esiste alcun modo per recuperarli.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-[var(--text-primary)]">Dettagli tecnici (Per Esperti):</h3>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed font-mono bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] overflow-x-auto">
                        Crittografia End-to-End (E2EE) attiva. I dati sono cifrati client-side con AES-GCM (256-bit). La chiave di cifratura è derivata dalla password utente tramite algoritmo PBKDF2 (100.000 iterazioni) e un salt univoco. Il server Firebase Firestore riceve e archivia unicamente dati cifrati (ciphertext) ed è matematicamente impossibilitato a decrittografarli senza la chiave, la quale non lascia mai il dispositivo.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-[var(--text-primary)]">Esclusione di Responsabilità (Legale):</h3>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        L'applicazione è fornita "così com'è" e senza garanzie di alcun tipo. L'autore e l'azienda sviluppatrice declinano espressamente ogni responsabilità per eventuali perdite di dati, falle di sicurezza derivanti da un uso improprio o per l'impossibilità di recuperare le password dimenticate. L'utente è l'unico responsabile della custodia delle proprie credenziali. Ogni riferimento o analisi generata dall'Intelligenza Artificiale ha scopo puramente ludico/informativo e NON sostituisce in alcun modo il parere di un medico, psicologo o professionista sanitario. Utilizzando l'app, l'utente accetta integralmente queste condizioni.
                      </p>
                    </div>
                  </div>
                </m.div>
              </m.div>
            )}
            {/* ─── DELETE ACCOUNT CONFIRMATION MODAL ─── */}
            {showDeleteModal && (
              <m.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4"
                onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
              >
                <m.div
                  initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60, scale: 0.95 }}
                  className="bg-[var(--bg-primary)] rounded-3xl p-6 w-full max-w-md border-2 border-red-500/40 shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Trash2 size={24} className="text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text-primary)] font-outfit">Elimina Account</h2>
                      <p className="text-sm text-[var(--text-secondary)]">Azione irreversibile</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 leading-relaxed">
                      ⚠️ Verranno eliminati <strong>permanentemente</strong>:
                      <ul className="mt-2 space-y-1 list-disc pl-4">
                        <li>Tutti i tuoi pensieri e registrazioni</li>
                        <li>Il tuo account e le credenziali di accesso</li>
                        <li>Tutti i dati locali del dispositivo</li>
                      </ul>
                      <p className="mt-2 font-semibold">Questa operazione non può essere annullata.</p>
                    </div>

                    <div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Per confermare, scrivi <strong className="text-[var(--text-primary)]">ELIMINA</strong> qui sotto:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="Scrivi ELIMINA per confermare"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all font-mono text-base"
                        disabled={isDeletingAccount}
                        autoComplete="off"
                      />
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'ELIMINA' || isDeletingAccount}
                      className="w-full py-4 px-6 bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
                    >
                      {isDeletingAccount
                        ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Eliminazione in corso...</>
                        : <><Trash2 size={20} /> Elimina Definitivamente</>}
                    </button>

                    <button
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isDeletingAccount}
                      className="w-full py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
                    >
                      Annulla
                    </button>
                  </div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </LazyMotion>
  );
}
