import { useState, useEffect } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import KeyRound from "lucide-react/dist/esm/icons/key-round";
import Lock from "lucide-react/dist/esm/icons/lock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Clipboard from "lucide-react/dist/esm/icons/clipboard";
import Check from "lucide-react/dist/esm/icons/check";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import { 
  deriveKey, 
  encryptText, 
  decryptText, 
  generateVaultKey, 
  exportKeyToBase64, 
  importKeyFromBase64 
} from "../lib/crypto";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { generateSeedPhrase, validateSeedPhrase } from "../lib/bip39-italian";

export function PasswordSetup({ onKeyDerived }: { onKeyDerived: (key: CryptoKey) => void }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stati di Onboarding / Setup
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [acceptedZeroKnowledge, setAcceptedZeroKnowledge] = useState(false);
  
  // Stati per la Seed Phrase
  const [step, setStep] = useState<"login" | "seed_setup" | "transition_setup" | "recovery" | "new_password">("login");
  const [generatedSeed, setGeneratedSeed] = useState("");
  const [copied, setCopied] = useState(false);
  const [temporaryVaultKey, setTemporaryVaultKey] = useState<CryptoKey | null>(null);
  const [temporaryVaultKeyBase64, setTemporaryVaultKeyBase64] = useState("");
  
  // Stati per la Recovery
  const [recoverySeed, setRecoverySeed] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const checkUserDoc = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          setIsFirstTime(!userDoc.exists() || !userDoc.data().pbkdf2Iterations);
        } catch (e) {
          setIsFirstTime(false);
        }
      }
    };
    checkUserDoc();
  }, []);

  const getIterations = async (uid: string): Promise<number> => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().pbkdf2Iterations) {
      return userDoc.data().pbkdf2Iterations;
    }
    const creationTimeStr = auth.currentUser?.metadata?.creationTime;
    const creationTime = creationTimeStr ? new Date(creationTimeStr).getTime() : Date.now();
    const CUTOFF = new Date("2026-07-02T21:00:00Z").getTime();
    const iterations = creationTime >= CUTOFF ? 600000 : 100000;
    await setDoc(userDocRef, { pbkdf2Iterations: iterations }, { merge: true });
    return iterations;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError(t('password.insertPasswordError'));
      return;
    }
    if (!auth.currentUser) {
      setError(t('password.unauthenticatedError'));
      return;
    }
    if (isFirstTime && !acceptedZeroKnowledge) {
      setError("Devi accettare la limitazione dell'architettura Zero-Knowledge per proseguire.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const uid = auth.currentUser.uid;
      const iterations = await getIterations(uid);
      
      // 1. Deriva la chiave della password
      const passwordKey = await deriveKey(trimmedPassword, uid, iterations);
      
      const userDoc = await getDoc(doc(db, "users", uid));
      const userData = userDoc.data();
      
      if (isFirstTime) {
        // NUOVO UTENTE: Genera chiave di sblocco master e seed phrase
        const vKey = await generateVaultKey();
        const vKeyBase64 = await exportKeyToBase64(vKey);
        const seed = generateSeedPhrase();
        
        setGeneratedSeed(seed);
        setTemporaryVaultKey(vKey);
        setTemporaryVaultKeyBase64(vKeyBase64);
        setStep("seed_setup");
        setLoading(false);
      } else if (userData && !userData.vaultKeyEncryptedWithPassword) {
        // UTENTE ESISTENTE (MIGRAZIONE): la passwordKey diventa la Vault Key
        const vKeyBase64 = await exportKeyToBase64(passwordKey);
        const seed = generateSeedPhrase();
        
        setGeneratedSeed(seed);
        setTemporaryVaultKey(passwordKey);
        setTemporaryVaultKeyBase64(vKeyBase64);
        setStep("transition_setup");
        setLoading(false);
      } else {
        // UTENTE POST-AGGIORNAMENTO: sblocca tramite vault key
        const encData = userData?.vaultKeyEncryptedWithPassword;
        if (!encData || !encData.ciphertext || !encData.iv) {
          throw new Error("Dati di sblocco della cassaforte non trovati su Firestore.");
        }
        
        const decryptedBase64 = await decryptText(encData.ciphertext, encData.iv, passwordKey);
        const vaultKey = await importKeyFromBase64(decryptedBase64);
        onKeyDerived(vaultKey);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Errore di sblocco: password non corretta o errore di rete. (${err.message || String(err)})`);
    } finally {
      if (step === "login") setLoading(false);
    }
  };

  const handleConfirmSeedPhrase = async () => {
    if (!auth.currentUser || !temporaryVaultKey || !temporaryVaultKeyBase64) return;
    setLoading(true);
    setError(null);
    try {
      const uid = auth.currentUser.uid;
      const iterations = await getIterations(uid);
      const trimmedPassword = password.trim();
      
      const passwordKey = await deriveKey(trimmedPassword, uid, iterations);
      const seedPhraseKey = await deriveKey(generatedSeed, uid, iterations);
      
      // Cifra la Vault Key con la password
      const encPassword = await encryptText(temporaryVaultKeyBase64, passwordKey);
      // Cifra la Vault Key con la Seed Phrase
      const encSeed = await encryptText(temporaryVaultKeyBase64, seedPhraseKey);
      
      // Salva nel DB
      await setDoc(doc(db, "users", uid), {
        vaultKeyEncryptedWithPassword: encPassword,
        vaultKeyEncryptedWithSeedPhrase: encSeed,
        pbkdf2Iterations: iterations
      }, { merge: true });
      
      onKeyDerived(temporaryVaultKey);
    } catch (err: any) {
      console.error(err);
      setError(`Errore durante il salvataggio dei dati: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSeed = recoverySeed.trim().toLowerCase().replace(/\s+/g, " ");
    if (!cleanSeed) {
      setError("Inserisci la Seed Phrase di recupero.");
      return;
    }
    if (!validateSeedPhrase(cleanSeed)) {
      setError("La Seed Phrase non è valida. Assicurati che contenga esattamente 12 parole in italiano corrette.");
      return;
    }
    if (!auth.currentUser) return;

    setLoading(true);
    setError(null);
    try {
      const uid = auth.currentUser.uid;
      const iterations = await getIterations(uid);
      
      const userDoc = await getDoc(doc(db, "users", uid));
      const userData = userDoc.data();
      const encSeed = userData?.vaultKeyEncryptedWithSeedPhrase;
      
      if (!encSeed || !encSeed.ciphertext || !encSeed.iv) {
        throw new Error("Questa cassaforte non supporta il recupero con Seed Phrase o i dati non sono configurati.");
      }
      
      // Deriva chiave dal seed e decifra la Vault Key
      const seedPhraseKey = await deriveKey(cleanSeed, uid, iterations);
      const decryptedBase64 = await decryptText(encSeed.ciphertext, encSeed.iv, seedPhraseKey);
      
      setTemporaryVaultKeyBase64(decryptedBase64);
      setStep("new_password");
    } catch (err: any) {
      console.error(err);
      setError(`Recupero fallito. La Seed Phrase potrebbe essere errata. (${err.message || String(err)})`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNewPassword = newPassword.trim();
    if (!trimmedNewPassword) {
      setError("Inserisci una nuova password.");
      return;
    }
    if (!auth.currentUser || !temporaryVaultKeyBase64) return;

    setLoading(true);
    setError(null);
    try {
      const uid = auth.currentUser.uid;
      const iterations = await getIterations(uid);
      
      const newPasswordKey = await deriveKey(trimmedNewPassword, uid, iterations);
      const newEncPassword = await encryptText(temporaryVaultKeyBase64, newPasswordKey);
      
      // Salva la nuova chiave cifrata
      await setDoc(doc(db, "users", uid), {
        vaultKeyEncryptedWithPassword: newEncPassword
      }, { merge: true });
      
      const vaultKey = await importKeyFromBase64(temporaryVaultKeyBase64);
      onKeyDerived(vaultKey);
    } catch (err: any) {
      console.error(err);
      setError(`Errore nel salvataggio della nuova password: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSeed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (isFirstTime === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-[var(--bg-base)] text-[var(--accent-warm)]">
        <Loader2 size={36} className="animate-spin" />
        <p className="mt-4 text-sm text-[var(--text-secondary)] font-medium font-sans">Inizializzazione Cassaforte sicura...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 text-center bg-[var(--bg-base)] transition-colors duration-200">
      <div className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-lg shadow-[var(--border-color)]/20 border border-[var(--border-color)] max-w-sm w-full flex flex-col gap-6 items-center">
        
        {step === "login" && (
          <>
            <div className="w-16 h-16 bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] rounded-2xl flex items-center justify-center relative">
              <Lock size={32} />
              <KeyRound size={16} className="absolute bottom-2 right-2 text-[var(--accent-warm)] bg-[var(--bg-primary)] rounded-full" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-outfit mb-2">{t('password.vault')}</h2>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col gap-4">
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Password ${t('password.vault')}`}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:border-[var(--accent-warm)] focus:ring-2 focus:ring-[var(--accent-warm)]/30 outline-none transition-all text-[var(--text-primary)] font-mono text-base"
                  disabled={loading}
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isFirstTime && (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-left animate-in fade-in duration-300">
                  <p className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                    ⚠️ Architettura Zero-Knowledge e Rischio Perdita Dati
                  </p>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                    I tuoi dati vengono crittografati localmente (AES-GCM 256). Nessuno può decifrarli. Limitazione: Non esiste una funzione di recupero password. Lo smarrimento comporta la perdita irreversibile dei dati. Lo sviluppatore declina ogni responsabilità.
                  </p>
                  <label className="flex items-start gap-2 mt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedZeroKnowledge}
                      onChange={(e) => setAcceptedZeroKnowledge(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-color)] accent-[var(--accent-warm)] mt-0.5"
                    />
                    <span className="text-[11px] font-medium text-[var(--text-primary)] leading-snug">
                      Ho capito che se perdo la password perdo tutti i miei dati per sempre
                    </span>
                  </label>
                </div>
              )}

              {error && (
                <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm w-full text-left font-sans">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password.trim() || (isFirstTime === true && !acceptedZeroKnowledge)}
                className="w-full bg-[var(--accent-warm)] h-[52px] disabled:opacity-60 hover:opacity-90 text-white py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{isFirstTime ? "Creazione in corso..." : "Sblocco in corso..."}</span>
                  </>
                ) : (
                  isFirstTime ? "Crea Cassaforte" : t('password.unlockData')
                )}
              </button>

              {loading && (
                <div className="text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3.5 rounded-xl text-xs text-left leading-relaxed mt-2 animate-pulse border border-amber-500/20 font-sans">
                  <p className="font-semibold flex items-center gap-1.5 mb-1 text-[var(--text-primary)]">
                    🔒 Calcolo crittografico locale (PBKDF2)
                  </p>
                  L'app sta calcolando la chiave di decrittografia (600.000 iterazioni) direttamente sul tuo processore per garantire la massima sicurezza Zero-Knowledge dei tuoi dati. Può richiedere da 1 a 15 secondi (o fino a un minuto sui dispositivi mobili o meno recenti).
                </div>
              )}

              {!isFirstTime && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("recovery");
                  }}
                  className="text-xs text-[var(--accent-warm)] hover:underline mt-2"
                >
                  Ho perso la password, usa la Seed Phrase
                </button>
              )}
            </form>
          </>
        )}

        {(step === "seed_setup" || step === "transition_setup") && (
          <div className="flex flex-col gap-5 items-center w-full animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-outfit mb-2">
                {step === "transition_setup" ? "Chiave di Recupero di Emergenza" : "Salva la tua Seed Phrase"}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                {step === "transition_setup" 
                  ? "Abbiamo aggiornato la sicurezza. Questa frase di 12 parole ti permetterà di recuperare i tuoi dati se in futuro dovessi dimenticare la password."
                  : "Questa frase di 12 parole è l'unico modo matematico per ripristinare il tuo database se dimentichi la password. Scrivila su carta e conservala in un luogo sicuro."}
              </p>
            </div>

            <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-2xl font-mono text-sm text-[var(--text-primary)] leading-relaxed select-all relative grid grid-cols-2 sm:grid-cols-3 gap-2">
              {generatedSeed.split(" ").map((word, idx) => (
                <span key={idx} className="bg-[var(--bg-primary)] px-2.5 py-1 border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-start gap-1">
                  <span className="text-[var(--text-muted)] text-[9px] mr-1">{idx + 1}.</span>{word}
                </span>
              ))}
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-xs text-[var(--accent-warm)] font-semibold hover:underline"
            >
              {copied ? <Check size={14} /> : <Clipboard size={14} />}
              {copied ? "Copiata!" : "Copia negli appunti"}
            </button>

            {error && (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm w-full text-left font-sans">
                {error}
              </div>
            )}

            <button
              onClick={handleConfirmSeedPhrase}
              disabled={loading}
              className="w-full bg-[var(--accent-warm)] h-[52px] hover:opacity-90 text-white py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Salvataggio in corso...</span>
                </>
              ) : (
                "Ho salvato la frase, continua"
              )}
            </button>
          </div>
        )}

        {step === "recovery" && (
          <form onSubmit={handleRecoverySubmit} className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] rounded-2xl flex items-center justify-center">
              <KeyRound size={32} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-outfit mb-2">Recupero Cassaforte</h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Inserisci la tua Seed Phrase di 12 parole in italiano per decifrare il caveau e impostare una nuova password.
              </p>
            </div>

            <textarea
              value={recoverySeed}
              onChange={(e) => setRecoverySeed(e.target.value)}
              placeholder="Esempio: abaco abete acqua..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:border-[var(--accent-warm)] focus:ring-2 focus:ring-[var(--accent-warm)]/30 outline-none transition-all text-[var(--text-primary)] font-mono text-sm leading-relaxed"
              disabled={loading}
            />

            {error && (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm w-full text-left font-sans">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !recoverySeed.trim()}
              className="w-full bg-[var(--accent-warm)] h-[52px] disabled:opacity-60 hover:opacity-90 text-white py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verifica in corso...</span>
                </>
              ) : (
                "Verifica Seed Phrase"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("login");
              }}
              className="text-xs text-[var(--text-muted)] hover:underline mt-1"
            >
              Torna al login password
            </button>
          </form>
        )}

        {step === "new_password" && (
          <form onSubmit={handleNewPasswordSubmit} className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
              <Check size={32} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] font-outfit mb-2">Nuova Password</h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Seed Phrase verificata! Inserisci una nuova password per proteggere la tua cassaforte da ora in avanti.
              </p>
            </div>

            <div className="relative w-full">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nuova Password Cassaforte"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:border-[var(--accent-warm)] focus:ring-2 focus:ring-[var(--accent-warm)]/30 outline-none transition-all text-[var(--text-primary)] font-mono text-base"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm w-full text-left font-sans">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword.trim()}
              className="w-full bg-[var(--accent-warm)] h-[52px] disabled:opacity-60 hover:opacity-90 text-white py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Salvataggio in corso...</span>
                </>
              ) : (
                "Salva Nuova Password"
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
