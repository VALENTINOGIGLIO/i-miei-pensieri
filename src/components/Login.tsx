import { useState } from "react";
import { signInWithRedirect, signInWithCredential, GoogleAuthProvider, browserPopupRedirectResolver } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import LogIn from "lucide-react/dist/esm/icons/log-in";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from "../contexts/LanguageContext";

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleLogin = async () => {
    try {
      setLoading(true);

      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        
        const idToken = result.credential?.idToken;
        if (!idToken) throw new Error(t('loginErrorToken'));
        
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
      }
    } catch (err: any) {
      console.error(err);
      setError(t('loginError') + (err.message || ""));
      setLoading(false);
    } finally {
      // Non forziamo false in caso di successo, altrimenti scompare il loader mentre l'app sta ricaricando
      // setLoading(false); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[var(--bg-base)] transition-colors duration-200">
      <div className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-lg shadow-[var(--border-color)]/20 border border-[var(--border-color)] max-w-sm w-full flex flex-col gap-6 items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-16 h-16 bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] rounded-2xl flex items-center justify-center">
          <LogIn size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-display mb-2">{t('loginTitle')}</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {t('loginDesc')}
          </p>
        </div>
        {error && <div className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-xl text-sm w-full text-left">{error}</div>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[var(--text-primary)] hover:opacity-90 hover:shadow-md text-[var(--bg-base)] py-3.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <div className="w-6 h-6 flex-shrink-0 bg-white rounded-full flex items-center justify-center p-0.5">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-full h-full object-contain" />
            </div>
          )}
          <span>{t('loginButton')}</span>
        </button>
      </div>
    </div>
  );
}
