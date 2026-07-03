import { useState, useEffect } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import KeyRound from "lucide-react/dist/esm/icons/key-round";
import Lock from "lucide-react/dist/esm/icons/lock";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Fingerprint from "lucide-react/dist/esm/icons/fingerprint";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import { deriveKey } from "../lib/crypto";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function PasswordSetup({ onKeyDerived }: { onKeyDerived: (key: CryptoKey) => void }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [hasBiometricsSetup, setHasBiometricsSetup] = useState(false);
  const [platformBiometricAvailable, setPlatformBiometricAvailable] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const biometricsEnabled = localStorage.getItem("biometrics_enabled") === "true";
    const savedPass = localStorage.getItem("saved_vault_password");
    if (biometricsEnabled && savedPass) {
      setHasBiometricsSetup(true);
    } else {
      // No biometrics set up → show password form directly
      setShowPasswordForm(true);
    }

    // Check if a REAL platform authenticator exists (Face ID / Touch ID / Windows Hello)
    // This prevents showing biometric option on devices without it (or on desktop Chrome which shows QR)
    if (window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setPlatformBiometricAvailable(available))
        .catch(() => setPlatformBiometricAvailable(false));
    }
  }, []);

  const deriveKeyWithIterations = async (pass: string, uid: string): Promise<CryptoKey> => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    let iterations = 100000;
    
    if (userDoc.exists() && userDoc.data().pbkdf2Iterations) {
      iterations = userDoc.data().pbkdf2Iterations;
    } else {
      const creationTimeStr = auth.currentUser?.metadata?.creationTime;
      const creationTime = creationTimeStr ? new Date(creationTimeStr).getTime() : Date.now();
      const CUTOFF = new Date("2026-07-02T21:00:00Z").getTime();
      if (creationTime >= CUTOFF) {
        iterations = 600000;
      } else {
        iterations = 100000;
      }
      await setDoc(userDocRef, { pbkdf2Iterations: iterations }, { merge: true });
    }
    return await deriveKey(pass, uid, iterations);
  };

  const handleBiometricUnlock = async () => {
    setLoading(true);
    setError(null);
    try {
      const credentialIdStr = localStorage.getItem("biometrics_credential_id");
      if (!credentialIdStr) throw new Error(t('password.credentialsNotFoundError'));

      const credentialId = Uint8Array.from(atob(credentialIdStr), c => c.charCodeAt(0));

      // Use a proper random challenge
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            id: credentialId,
            type: "public-key"
          }],
          userVerification: "required",
          timeout: 60000
        }
      });

      if (assertion) {
        const savedPass = localStorage.getItem("saved_vault_password");
        if (savedPass && auth.currentUser) {
          const cryptoKey = await deriveKeyWithIterations(savedPass, auth.currentUser.uid);
          onKeyDerived(cryptoKey);
        }
      }
    } catch (err: any) {
      console.error(err);
      // If biometric fails or is cancelled, show the password form as fallback
      setError(t('password.biometricFailed'));
      setShowPasswordForm(true);
    } finally {
      setLoading(false);
    }
  };

  const setupBiometrics = async (pass: string): Promise<void> => {
    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userId = window.crypto.getRandomValues(new Uint8Array(16));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "I Miei Pensieri",
            id: window.location.hostname
          },
          user: {
            id: userId,
            name: auth.currentUser?.email || "user",
            displayName: auth.currentUser?.displayName || "Utente"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },   // ES256
            { alg: -257, type: "public-key" }  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Force local authenticator (Face ID / Touch ID)
            userVerification: "required",
            residentKey: "preferred"
          },
          timeout: 60000,
          // Exclude cross-device options
          excludeCredentials: []
        }
      }) as PublicKeyCredential;

      if (credential) {
        const credIdBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(credential.rawId))));
        localStorage.setItem("biometrics_credential_id", credIdBase64);
        localStorage.setItem("biometrics_enabled", "true");
        localStorage.setItem("saved_vault_password", pass);
      }
    } catch (err: any) {
      console.error("Errore setup biometrico:", err);
      // Silently fail — user just won't have biometrics
      setEnableBiometrics(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);
    setError(null);
    try {
      // If user wants biometrics AND the device supports it, set it up first
      if (enableBiometrics && platformBiometricAvailable) {
        await setupBiometrics(trimmedPassword);
      }

      const salt = auth.currentUser.uid;
      const cryptoKey = await deriveKeyWithIterations(trimmedPassword, salt);
      onKeyDerived(cryptoKey);
    } catch (err: any) {
      console.error(err);
      setError(`Errore: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[var(--bg-base)] transition-colors duration-200">
      <div className="bg-[var(--bg-primary)] p-8 rounded-3xl shadow-sm border border-[var(--border-color)] max-w-sm w-full flex flex-col gap-6 items-center">

        {/* Icon */}
        <div className="w-16 h-16 bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] rounded-2xl flex items-center justify-center relative">
          <Lock size={32} />
          <KeyRound size={16} className="absolute bottom-2 right-2 text-[var(--accent-warm)] bg-[var(--bg-primary)] rounded-full" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-outfit mb-2">{t('password.vault')}</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            {hasBiometricsSetup && !showPasswordForm
              ? t('password.useBiometricsPrompt')
              : t('password.usePasswordPrompt')}
          </p>
        </div>

        {/* Biometric unlock (only if already set up) */}
        {hasBiometricsSetup && !showPasswordForm && (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={handleBiometricUnlock}
              disabled={loading}
              className="w-full bg-[var(--accent-warm)] hover:opacity-90 text-white py-4 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-[var(--accent-warm)]/20 active:scale-95"
            >
              {loading
                ? <Loader2 size={24} className="animate-spin" />
                : <Fingerprint size={24} />
              }
              <span className="text-lg">{t('password.unlockWithFaceId')}</span>
            </button>

            {error && (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm w-full text-left">
                {error}
              </div>
            )}

            <button
              onClick={() => { setShowPasswordForm(true); setError(null); }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2"
            >
              {t('password.usePasswordBtn')}
            </button>
          </div>
        )}

        {/* Password form */}
        {showPasswordForm && (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Back to biometric if it was set up */}
            {hasBiometricsSetup && (
              <button
                type="button"
                onClick={() => { setShowPasswordForm(false); setError(null); }}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2 text-left"
              >
                {t('password.useFaceIdBtn')}
              </button>
            )}

            {/* Password input with show/hide toggle */}
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

            {/* Biometric setup option (only if not yet set up, and device actually supports it) */}
            {!hasBiometricsSetup && platformBiometricAvailable && (
              <label className="flex items-center gap-3 cursor-pointer text-left p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <input
                  type="checkbox"
                  checked={enableBiometrics}
                  onChange={(e) => setEnableBiometrics(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-300 accent-[var(--accent-warm)]"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1">
                    <Fingerprint size={14} /> {t('password.enableBiometrics')}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{t('password.noMorePassword')}</span>
                </div>
              </label>
            )}

            {error && (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm w-full text-left">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-[var(--accent-warm)] disabled:opacity-50 hover:opacity-90 text-white py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : t('password.unlockData')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
