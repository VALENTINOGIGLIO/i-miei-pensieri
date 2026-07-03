import { useState, useEffect } from "react";
import Info from "lucide-react/dist/esm/icons/info";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Shield from "lucide-react/dist/esm/icons/shield";
import Globe from "lucide-react/dist/esm/icons/globe";
import { useLanguage } from "../contexts/LanguageContext";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0); // Step 0 is language selection
  const [isAgeChecked, setIsAgeChecked] = useState(false);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const [isAiChecked, setIsAiChecked] = useState(false);
  const [isGpsChecked, setIsGpsChecked] = useState(false);
  const { t, setLangPref, lang } = useLanguage();

  useEffect(() => {
    // Small delay to allow CSS transitions to trigger
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleFinish = () => {
    if (!isAgeChecked) return;
    
    localStorage.setItem('tos_accepted_v1', 'true');
    
    if (isPrivacyChecked) {
      localStorage.setItem('privacy_accepted_v2', 'true');
    } else {
      localStorage.setItem('privacy_accepted_v2', 'false');
    }

    if (isAiChecked) {
      localStorage.setItem('enableAiAnalysis', 'true');
    } else {
      localStorage.setItem('enableAiAnalysis', 'false');
    }

    if (isGpsChecked) {
      localStorage.setItem('enableLocation', 'true');
    } else {
      localStorage.setItem('enableLocation', 'false');
    }
    
    // Hide old cookie banner just in case
    localStorage.setItem('legal_accepted', 'true');
    localStorage.setItem('hasSeenOnboarding', 'true');

    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-[var(--bg-base)] flex flex-col transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex flex-col items-center justify-center">
        {step === 0 ? (
          <div className="max-w-md w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col items-center gap-4 mb-2 text-center">
              <div className="w-16 h-16 bg-blue-50 text-[var(--accent-warm)] rounded-2xl flex items-center justify-center shadow-sm">
                <Globe size={32} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] font-display tracking-tight">
                {t('onboardingWelcome')}
              </h1>
              <p className="text-[var(--text-secondary)]">
                {t('onboardingSelectLanguage')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setLangPref('it'); handleNext(); }}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${lang === 'it' ? 'border-[var(--accent-warm)] bg-orange-50/50' : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'}`}
              >
                <span className="font-medium text-[var(--text-primary)]">Italiano</span>
                {lang === 'it' && <div className="w-3 h-3 rounded-full bg-[var(--accent-warm)]" />}
              </button>
              <button 
                onClick={() => { setLangPref('en'); handleNext(); }}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${lang === 'en' ? 'border-[var(--accent-warm)] bg-orange-50/50' : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'}`}
              >
                <span className="font-medium text-[var(--text-primary)]">English</span>
                {lang === 'en' && <div className="w-3 h-3 rounded-full bg-[var(--accent-warm)]" />}
              </button>
            </div>
          </div>
        ) : step === 1 ? (
        <div className="max-w-2xl w-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
          
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 text-[var(--accent-warm)] rounded-2xl flex items-center justify-center shadow-sm">
              <Info size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] font-display tracking-tight">
              {t('onboardingTitle1')}
            </h1>
          </div>
          
          <div className="prose prose-zinc prose-base sm:prose-lg leading-relaxed text-[var(--text-secondary)]">
            <p>{t('onboardingP1_1')}</p>
            <p>{t('onboardingP1_2')}</p>
            <p>{t('onboardingP1_3')}</p>
            <p>{t('onboardingP1_4')}</p>
          </div>
          
        </div>
        ) : (
        <div className="max-w-2xl w-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 text-[var(--accent-warm)] rounded-2xl flex items-center justify-center shadow-sm">
              <Shield size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] font-display tracking-tight">
              {t('onboardingTitle2')}
            </h1>
          </div>
          
          <div className="prose prose-zinc prose-base sm:prose-lg leading-relaxed text-[var(--text-secondary)]">
            <p>{t('onboardingP2_1')}</p>
            <p>{t('onboardingP2_2')}</p>
            <p>
              {t('onboardingP2_3_1')} <button onClick={() => window.dispatchEvent(new Event('open_tos_modal'))} className="underline text-[var(--accent-warm)]">{t('onboardingP2_3_TOS')}</button>{t('onboardingP2_3_2')}<button onClick={() => window.dispatchEvent(new Event('open_privacy_modal'))} className="underline text-[var(--accent-warm)]">{t('onboardingP2_3_PRIVACY')}</button>{t('onboardingP2_3_3')}
            </p>
            
            <label className="flex items-center gap-3 mt-6 p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAgeChecked} 
                onChange={(e) => setIsAgeChecked(e.target.checked)}
                className="w-5 h-5 accent-[var(--accent-warm)] shrink-0"
              />
              <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                {t('onboardingAgeLabel')}
              </span>
            </label>

            <label className="flex items-center gap-3 mt-3 p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPrivacyChecked} 
                onChange={(e) => setIsPrivacyChecked(e.target.checked)}
                className="w-5 h-5 accent-[var(--accent-warm)] shrink-0"
              />
              <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                {t('onboardingPrivacyLabel')}
              </span>
            </label>

            <label className="flex items-center gap-3 mt-3 p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAiChecked} 
                onChange={(e) => setIsAiChecked(e.target.checked)}
                className="w-5 h-5 accent-[var(--accent-warm)] shrink-0"
              />
              <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                {t('onboardingAiLabel')}
              </span>
            </label>

            <label className="flex items-center gap-3 mt-3 p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] cursor-pointer">
              <input 
                type="checkbox" 
                checked={isGpsChecked} 
                onChange={(e) => setIsGpsChecked(e.target.checked)}
                className="w-5 h-5 accent-[var(--accent-warm)] shrink-0"
              />
              <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                {t('onboardingGpsLabel')}
              </span>
            </label>
          </div>
        </div>
        )}
      </div>

      <div className="p-6 sm:p-12 flex justify-center w-full max-w-2xl mx-auto flex-col sm:flex-row gap-4">
        {step === 0 ? (
          <></>
        ) : step === 1 ? (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-3 bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-base)] py-4 px-8 rounded-2xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            {t('onboardingNext')} <ArrowRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!isAgeChecked || !isPrivacyChecked}
            className={`w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-medium transition-all active:scale-95 ${isAgeChecked && isPrivacyChecked ? 'bg-[var(--accent-warm)] hover:opacity-90 text-white shadow-md hover:shadow-lg' : 'bg-[var(--text-muted)] text-[var(--bg-base)] cursor-not-allowed opacity-50'}`}
          >
            {t('onboardingNext')} <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}