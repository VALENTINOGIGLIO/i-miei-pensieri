import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import X from "lucide-react/dist/esm/icons/x";
import { useLanguage } from '../contexts/LanguageContext';

export function Legal() {
  const { t, lang } = useLanguage();
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

                  {/* ── GDPR: Crittografia E2EE ─────────────────────────────── */}
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">
                      🔐 Crittografia End-to-End (E2EE)
                    </h3>
                    <p>
                      I tuoi pensieri vengono cifrati sul tuo dispositivo tramite algoritmo <strong>AES-GCM a 256 bit</strong> prima di essere trasmessi su Internet. La chiave di cifratura è derivata dalla tua "Password Cassaforte" tramite l'algoritmo <strong>PBKDF2 (100.000 iterazioni, SHA-256)</strong> e non lascia mai il tuo dispositivo. Il server Firebase Firestore riceve e archivia <strong>esclusivamente dati cifrati (ciphertext)</strong> ed è matematicamente impossibilitato a decrittografarli. Nemmeno i creatori dell'app possono accedere ai tuoi pensieri.
                    </p>
                    <p className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-700 dark:text-blue-300 text-xs">
                      <strong>Attenzione:</strong> Se dimentichi la Password Cassaforte, i tuoi pensieri saranno irrecuperabili. Non esiste alcun meccanismo di recupero password (nessuna backdoor).
                    </p>
                  </section>

                  {/* ── GDPR: localStorage e Chiave API Gemini ──────────────── */}
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">
                      💾 Dati locali (localStorage) e Chiave API
                    </h3>
                    <p>
                      L'app utilizza il <strong>localStorage</strong> del browser esclusivamente per archiviare <strong>preferenze UI non sensibili</strong>: tema (chiaro/scuro), lingua, abilitazione funzionalità (analisi AI, geolocalizzazione, statistiche) e i tuoi consensi GDPR. Nessun testo di pensiero, password o chiave API viene mai scritto in localStorage.
                    </p>
                    <p className="mt-2">
                      La tua <strong>chiave API Google Gemini</strong>, se fornita, viene cifrata end-to-end con la tua CryptoKey prima di essere salvata su Firestore. È accessibile in chiaro unicamente in memoria RAM durante la sessione attiva. Alla disconnessione, la chiave viene eliminata dalla memoria.
                    </p>
                    <p className="mt-2">
                      Quando utilizzi le funzionalità AI (analisi pensiero, traduzione, prompt), il testo viene inviato a <strong>Google Gemini API</strong> tramite la tua chiave personale. Tale trasferimento avviene solo previo tuo esplicito consenso e può essere disabilitato in qualsiasi momento rifiutando la presente informativa.
                    </p>
                  </section>

                  {/* ── App Check & Protection ─────────────────────────────── */}
                  <section>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2">
                      {lang === 'it' 
                        ? "🛡️ Sicurezza dell'Applicazione e Protezione dallo Spam" 
                        : "🛡️ Application Security & Abuse Protection"}
                    </h3>
                    <p>
                      {lang === 'it' 
                        ? "Sicurezza dell'Applicazione e Protezione dallo Spam (Firebase App Check & reCAPTCHA): Per proteggere l'applicazione da abusi, attacchi automatizzati (bot) e accessi non autorizzati, utilizziamo Firebase App Check con l'integrazione di Google reCAPTCHA Enterprise. Questo servizio analizza la configurazione hardware e software del dispositivo (es. indirizzo IP, risoluzione dello schermo, dati del browser) e il comportamento dell'utente (es. movimenti del mouse, durata della sessione) per determinare se la richiesta proviene da un essere umano. I dati raccolti vengono trasmessi a Google LLC negli Stati Uniti per scopi esclusivi di sicurezza e prevenzione frodi, nel rispetto dell'accordo sul trattamento dei dati. L'uso del servizio è regolato dai Termini di Servizio di Google (https://policies.google.com/terms) e dalla Privacy Policy di Google (https://policies.google.com/privacy)."
                        : "Application Security & Abuse Protection (Firebase App Check & reCAPTCHA): To protect our application infrastructure from abuse, automated attacks (bots), and unauthorized access, we use Firebase App Check powered by Google reCAPTCHA Enterprise. This service analyzes hardware and software configuration details of your device (e.g., IP address, screen resolution, browser metadata) and user behavior (e.g., mouse movements, session duration) to compute a risk score. The telemetry data is transmitted to Google LLC in the United States solely for security and fraud prevention purposes under appropriate standard contractual safeguards. Google's processing is subject to the Google Privacy Policy (https://policies.google.com/privacy) and Google Terms of Service (https://policies.google.com/terms)."}
                    </p>
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
                  </section>

                  <section className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col gap-2">
                    <p className="font-semibold text-xs text-[var(--text-primary)] uppercase tracking-wider">⚠️ Avvertenza per API Esterne</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Google si riserva il diritto di usare i dati delle API Key gratuite per addestrare i propri modelli. Accedi a Google AI Studio per disabilitare la condivisione (Data Retention Opt-out).
                    </p>
                  </section>

                  <section className="text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-color)] pt-4">
                    <p className="mb-2"><strong>Marchi Registrati:</strong> Apple, il logo Apple, iPhone e iPad sono marchi di Apple Inc., registrati negli Stati Uniti e in altri Paesi. Android e Chrome sono marchi di Google LLC. Tutti gli altri marchi appartengono ai rispettivi proprietari.</p>
                    <p>Contatti &amp; Privacy: <a href="mailto:imieipensieri.privacy@gmail.com" className="text-[var(--accent-warm)] hover:underline">imieipensieri.privacy@gmail.com</a></p>
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
