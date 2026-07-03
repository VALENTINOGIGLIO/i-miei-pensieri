import { useState } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import Key from "lucide-react/dist/esm/icons/key";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";

export function ApiKeySetup({ onSave, currentKey, onClose }: { onSave: (key: string) => void, currentKey?: string, onClose?: () => void }) {
  const { t } = useLanguage();
  const [key, setKey] = useState(currentKey || "");

  const handleSave = () => {
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] md:bg-zinc-900/40 dark:md:bg-black/60 flex items-center justify-center p-4">
      {/* Contenitore principale con altezza limitata e overflow */}
      <div className="bg-[var(--bg-base)] max-w-md w-full rounded-3xl p-8 shadow-2xl md:border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* Contenitore interno scrollabile */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 -mr-2">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <Key size={24} />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-display mb-2">
              {t('apiKey.welcome')}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Per garantire la tua privacy e nessuna limitazione, l'app richiede la tua API Key personale di Google AI Studio (completamente gratuita). Verrà crittografata con la tua password e salvata in modo sicuro.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('apiKey.howToGetIt')}</h3>
            <ol className="text-sm text-[var(--text-secondary)] list-decimal list-inside space-y-2">
              <li>{t('apiKey.goTo')}<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12} /></a></li>
              <li>{t('apiKey.loginGoogle')}</li>
              <li>{t('apiKey.createKey')}</li>
            </ol>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-left">
            <h4 className="text-amber-800 dark:text-amber-400 text-sm font-semibold mb-1 flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-500">⚠️</span> {t('apiKey.privacyProtection')}
            </h4>
            <p className="text-amber-700 dark:text-amber-500 text-xs leading-relaxed">
              Google si riserva il diritto di usare i dati delle API Key gratuite per addestrare i propri modelli. 
              Per garantire che i tuoi pensieri restino privati al 100%, accedi alle impostazioni del tuo account Google AI Studio e disabilita la condivisione dei dati (Data Retention/Training Opt-out).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('apiKey.inputLabel')}</label>
            <input 
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all bg-[var(--bg-base)] text-[var(--text-primary)] font-mono"
            />
          </div>
        </div>

        {/* Bottone fuori dal contenitore scrollabile, sempre visibile in fondo */}
        <button 
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-medium transition-colors mt-6 shrink-0"
        >
          {key.trim() ? t('apiKey.saveAndStart') : t('apiKey.continueWithout')}
        </button>
      </div>
    </div>
  );
}