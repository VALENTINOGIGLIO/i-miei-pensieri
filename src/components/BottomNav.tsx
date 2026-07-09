import BookOpen from "lucide-react/dist/esm/icons/book-open";
import { useLanguage } from '../contexts/LanguageContext';
import User from "lucide-react/dist/esm/icons/user";
import Settings from "lucide-react/dist/esm/icons/settings";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

interface BottomNavProps {
  activeTab: "pensieri" | "spunti" | "analisi" | "impostazioni";
  onTabChange: (tab: "pensieri" | "spunti" | "analisi" | "impostazioni") => void;
  enableAnalisi?: boolean;
  enableSpunti?: boolean;
}

export function BottomNav({ activeTab, onTabChange, enableAnalisi = true, enableSpunti = true }: BottomNavProps) {
  const { t } = useLanguage();
  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[var(--bg-base)] border-t border-zinc-200 dark:border-zinc-800 sm:hidden pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            onClick={() => onTabChange("pensieri")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "pensieri" ? "text-[var(--accent-warm)]" : "text-[var(--text-muted)]"}`}
          >
            <BookOpen size={20} />
            <span className="text-[10px] font-medium">{t('nav.thoughts')}</span>
          </button>
          {enableSpunti && (
            <button
              onClick={() => onTabChange("spunti")}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "spunti" ? "text-[var(--accent-warm)]" : "text-[var(--text-muted)]"}`}
            >
              <Sparkles size={20} />
              <span className="text-[10px] font-medium">{t('nav.spunti', { defaultValue: 'Spunti' })}</span>
            </button>
          )}
          {enableAnalisi && (
            <button
              onClick={() => onTabChange("analisi")}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "analisi" ? "text-[var(--accent-warm)]" : "text-[var(--text-muted)]"}`}
            >
              <User size={20} />
              <span className="text-[10px] font-medium">{t('nav.analysis')}</span>
            </button>
          )}
          <button
            onClick={() => onTabChange("impostazioni")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "impostazioni" ? "text-[var(--accent-warm)]" : "text-[var(--text-muted)]"}`}
          >
            <Settings size={20} />
            <span className="text-[10px] font-medium">{t('nav.options')}</span>
          </button>
        </div>
      </nav>

      {/* Desktop Navigation (hidden on mobile) */}
      <div className="hidden sm:flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-8 mx-4">
        <button
          onClick={() => onTabChange("pensieri")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${activeTab === "pensieri" ? "bg-[var(--bg-base)] text-[var(--accent-warm)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
        >
          <BookOpen size={16} />
          {t('nav.thoughts')}
        </button>
        {enableSpunti && (
          <button
            onClick={() => onTabChange("spunti")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${activeTab === "spunti" ? "bg-[var(--bg-base)] text-[var(--accent-warm)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
          >
            <Sparkles size={16} />
            {t('nav.spunti', { defaultValue: 'Spunti' })}
          </button>
        )}
        {enableAnalisi && (
          <button
            onClick={() => onTabChange("analisi")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${activeTab === "analisi" ? "bg-[var(--bg-base)] text-[var(--accent-warm)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
          >
            <User size={16} />
            {t('nav.analysis')}
          </button>
        )}
        <button
          onClick={() => onTabChange("impostazioni")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${activeTab === "impostazioni" ? "bg-[var(--bg-base)] text-[var(--accent-warm)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
        >
          <Settings size={16} />
          {t('nav.settings')}
        </button>
      </div>
    </>
  );
}
