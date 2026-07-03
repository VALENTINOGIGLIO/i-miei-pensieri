import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import X from "lucide-react/dist/esm/icons/x";
import { useLanguage } from '../contexts/LanguageContext';

export function Legal() {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<'privacy' | 'tos' | null>(null);

  useEffect(() => {
    const handleOpenPrivacy = () => setActiveModal('privacy');
    const handleOpenTos = () => setActiveModal('tos');
    
    window.addEventListener('open_privacy_modal', handleOpenPrivacy);
    window.addEventListener('open_tos_modal', handleOpenTos);
    
    return () => {
      window.removeEventListener('open_privacy_modal', handleOpenPrivacy);
      window.removeEventListener('open_tos_modal', handleOpenTos);
    };
  }, []);

  return createPortal(
    <AnimatePresence>
      {activeModal && (
        <div 
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <m.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[var(--bg-primary)] w-full max-w-2xl max-h-[85vh] rounded-3xl flex flex-col border border-[var(--border-color)] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {activeModal === 'privacy' ? t('legalPrivacyTitle') : t('legalTosTitle')}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
              {activeModal === 'privacy' ? (
                <>
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalPrivacy1Title')}</h3>
                    <p>{t('legalPrivacy1Text')}</p>
                  </section>
                  
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalPrivacy2Title')}</h3>
                    <p>{t('legalPrivacy2Text')}</p>
                    <p className="mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                      <strong>{t('legalPrivacy2WarningLabel')}</strong>{t('legalPrivacy2WarningText')}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalPrivacy3Title')}</h3>
                    <p>{t('legalPrivacy3Text')}</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalPrivacy4Title')}</h3>
                    <p>{t('legalPrivacy4Text')}</p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalTos1Title')}</h3>
                    <p>{t('legalTos1Text')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalTos2Title')}</h3>
                    <p>{t('legalTos2Text')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalTos3Title')}</h3>
                    <p>{t('legalTos3Text')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalTos4Title')}</h3>
                    <p>{t('legalTos4Text')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalTos5Title')}</h3>
                    <p>{t('legalTos5Text')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">{t('legalTos6Title')}</h3>
                    <p>{t('legalTos6Text')}</p>
                    <p className="font-mono bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-center mt-2">
                      <a href="mailto:imieipensieri.privacy@gmail.com" className="text-[var(--accent-warm)] hover:underline">imieipensieri.privacy@gmail.com</a>
                    </p>
                  </section>
                </>
              )}
            </div>

            <div className="p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row gap-3 shrink-0">
              {activeModal === 'privacy' && (
                <button 
                  onClick={() => {
                    localStorage.setItem('privacy_accepted_v2', 'false');
                    localStorage.setItem('enableAiAnalysis', 'false');
                    localStorage.setItem('enableLocation', 'false');
                    window.dispatchEvent(new Event('storage')); // trigger updates in other components
                    setActiveModal(null);
                  }}
                  className="w-full sm:w-1/2 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] py-4 rounded-xl font-bold transition-transform active:scale-95 text-base sm:text-lg hover:bg-[var(--bg-hover)]"
                >
                  {t('legalRejectAiGps')}
                </button>
              )}
              <button 
                onClick={() => {
                  if (activeModal === 'privacy') {
                    localStorage.setItem('privacy_accepted_v2', 'true');
                  } else if (activeModal === 'tos') {
                    localStorage.setItem('tos_accepted_v1', 'true');
                  }
                  setActiveModal(null);
                }}
                className={`w-full ${activeModal === 'privacy' ? 'sm:w-1/2' : ''} bg-[var(--accent-warm)] text-white py-4 rounded-xl font-bold transition-transform active:scale-95 text-base sm:text-lg shadow-md hover:opacity-90`}
              >
                {activeModal === 'privacy' ? t('onboardingAccept') : t('legalUnderstand')}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
