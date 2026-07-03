import { useState } from 'react';
import Download from "lucide-react/dist/esm/icons/download";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Apple from "lucide-react/dist/esm/icons/apple";
import Chrome from "lucide-react/dist/esm/icons/chrome";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';

// Componente SVG per il logo Android
const AndroidLogo = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 576 512" fill="#3DDC84" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.27-10h0l-48.54,84.07a301.25,301.25,0,0,0-246.56,0L116.18,64.45a10,10,0,1,0-17.27,10h0l48,83.24C73.68,197.62,24,258.1,24,328V368H552V328c0-69.89-49.68-130.38-122.85-170.55"/>
  </svg>
);

const AppleLogo = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 384 512" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

const ChromeLogo = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#4CAF50" d="M24 8c-6.8 0-12.6 4.3-14.8 10.3L16 30l8 14c8.8 0 16-7.2 16-16 0-2.4-.5-4.7-1.4-6.8L24 8z"/>
    <path fill="#F44336" d="M24 8C15.2 8 8 15.2 8 24c0 2.4.5 4.7 1.4 6.8L16 18h23.2C37 12 31 8 24 8z"/>
    <path fill="#FFEB3B" d="M40 24c0 8.8-7.2 16-16 16l-8-14h15.2c1.8-2 2.8-4.8 2.8-8 0-1.8-.4-3.5-1.1-5L40 24z"/>
    <circle fill="#fff" cx="24" cy="24" r="9"/>
    <circle fill="#1976D2" cx="24" cy="24" r="7"/>
  </svg>
);

export function LandingPage() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-primary)] overflow-y-auto">
        {/* Header / Hero */}
        <div className="pt-16 pb-12 px-6 flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-warm)] to-orange-400 rounded-3xl shadow-xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-outfit tracking-tight">
            I miei Pensieri
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-xl">
            Il tuo spazio sicuro e privato. Scarica l'applicazione nativa o usa la versione web: i tuoi dati sono protetti da crittografia end-to-end ovunque tu sia.
          </p>
        </div>

        {/* App Options */}
        <div className="px-6 pb-16 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* iOS Card */}
            <div className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-2 border-[var(--border-color)] hover:border-[var(--text-primary)] transition-colors rounded-3xl p-6 flex flex-col items-center text-center shadow-lg group">
              <AppleLogo size={56} className="text-[var(--text-primary)] mb-4" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-outfit">iPhone & iPad</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
                Scarica l'app nativa per iPhone tramite file .ipa (sideloading via AltStore).
              </p>
              <button 
                onClick={() => toggleAccordion('ios-install')}
                className="w-full py-3 px-4 bg-[var(--text-primary)] text-[var(--bg-base)] text-sm rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <Download size={18} />
                Istruzioni iOS
              </button>
            </div>

            {/* Android Card */}
            <div className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-2 border-[var(--border-color)] hover:border-green-500 transition-colors rounded-3xl p-6 flex flex-col items-center text-center shadow-lg group">
              <AndroidLogo size={56} className="mb-4" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-outfit">Android</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
                Installa direttamente l'APK nativo sul tuo dispositivo Android.
              </p>
              <button 
                onClick={() => toggleAccordion('android-install')}
                className="w-full py-3 px-4 bg-green-500 text-white text-sm rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <Download size={18} />
                Istruzioni Android
              </button>
            </div>

            {/* Web App Card */}
            <div className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-2 border-[var(--border-color)] hover:border-[#4285F4] transition-colors rounded-3xl p-6 flex flex-col items-center text-center shadow-lg group relative">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-[#4285F4] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-[var(--bg-primary)]">
                CONSIGLIATA
              </div>
              <ChromeLogo size={56} className="mb-4" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-outfit">Web App</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
                Usa l'app via browser o aggiungila alla schermata Home.
              </p>
              <button 
                onClick={() => toggleAccordion('web-install')}
                className="w-full py-3 px-4 bg-[#4285F4] text-white text-sm rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <Smartphone size={18} />
                Aggiungi PWA
              </button>
            </div>

          </div>
        </div>

        {/* Instructions Accordion */}
        <div className="px-6 pb-12 max-w-3xl mx-auto w-full space-y-4">
          <h3 className="text-xl font-bold text-[var(--text-primary)] font-outfit mb-4 text-center">Come Installare</h3>

          {/* iOS Instructions */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            <button 
              onClick={() => toggleAccordion('ios-install')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="font-semibold text-[var(--text-primary)]">Istruzioni Sideloading iOS (.ipa)</span>
              {openAccordion === 'ios-install' ? <ChevronUp size={20} className="text-[var(--text-secondary)]" /> : <ChevronDown size={20} className="text-[var(--text-secondary)]" />}
            </button>
            <AnimatePresence>
              {openAccordion === 'ios-install' && (
                <m.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 text-[var(--text-secondary)] text-sm space-y-3 bg-[var(--bg-card)]">
                    <p>Per installare l'app nativa su iOS senza passare dall'App Store, è necessario utilizzare un tool di sideloading come <strong>AltStore</strong> o <strong>Sideloadly</strong>.</p>
                    <ul className="list-decimal pl-5 space-y-2">
                      <li>Scarica il file <strong>.ipa</strong> dell'applicazione.</li>
                      <li>Installa e configura AltStore sul tuo computer e sul tuo iPhone.</li>
                      <li>Apri AltStore sul tuo iPhone, vai in "My Apps", premi "+" e seleziona il file .ipa scaricato.</li>
                      <li>Fidati del certificato sviluppatore nelle Impostazioni &gt; Generali &gt; VPN e gestione dispositivi.</li>
                    </ul>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* Android Instructions */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            <button 
              onClick={() => toggleAccordion('android-install')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="font-semibold text-[var(--text-primary)]">Istruzioni Installazione Android (.apk)</span>
              {openAccordion === 'android-install' ? <ChevronUp size={20} className="text-[var(--text-secondary)]" /> : <ChevronDown size={20} className="text-[var(--text-secondary)]" />}
            </button>
            <AnimatePresence>
              {openAccordion === 'android-install' && (
                <m.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 text-[var(--text-secondary)] text-sm space-y-3 bg-[var(--bg-card)]">
                    <p>L'installazione su Android è molto più semplice tramite il file APK fornito.</p>
                    <ul className="list-decimal pl-5 space-y-2">
                      <li>Scarica il file <strong>.apk</strong> sul tuo dispositivo.</li>
                      <li>Apri il file scaricato. Se richiesto, autorizza il browser o il file manager a "Installare app sconosciute" nelle Impostazioni.</li>
                      <li>Procedi con l'installazione e apri l'app!</li>
                    </ul>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* Web Instructions */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            <button 
              onClick={() => toggleAccordion('web-install')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="font-semibold text-[var(--text-primary)]">Istruzioni Aggiunta alla Home (PWA)</span>
              {openAccordion === 'web-install' ? <ChevronUp size={20} className="text-[var(--text-secondary)]" /> : <ChevronDown size={20} className="text-[var(--text-secondary)]" />}
            </button>
            <AnimatePresence>
              {openAccordion === 'web-install' && (
                <m.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 text-[var(--text-secondary)] text-sm space-y-3 bg-[var(--bg-card)]">
                    <p>La Progressive Web App ti permette di avere l'icona sul telefono senza scaricare file, rimanendo sempre aggiornata all'ultima versione automaticamente.</p>
                    <ul className="list-decimal pl-5 space-y-2">
                      <li>Apri questo sito web su <strong>Safari</strong> (iOS) o <strong>Chrome</strong> (Android).</li>
                      <li>Tocca il pulsante <strong>Condividi</strong> (su iOS è in basso al centro, su Android sono i tre puntini in alto a destra).</li>
                      <li>Seleziona l'opzione <strong>"Aggiungi alla schermata Home"</strong>.</li>
                      <li>Tocca "Aggiungi". L'icona dell'app apparirà tra le tue app!</li>
                    </ul>
                    <a href="/" className="inline-block mt-4 py-3 px-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-bold hover:bg-[var(--border-color)] transition-colors text-center w-full">
                      Vai all'App
                    </a>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-auto px-6 pb-12 pt-8 max-w-4xl mx-auto w-full">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex gap-4 text-left">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
            <div className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed space-y-3">
              <div>
                <strong className="text-[var(--text-primary)] block mb-1">Avvertenza Legale e Limitazione di Responsabilità</strong>
                Questa applicazione è fornita come strumento software indipendente per installazione manuale (sideloading). Lo sviluppatore declina ogni responsabilità per eventuali danni al dispositivo, perdita di dati, violazioni della garanzia hardware o malfunzionamenti derivanti dall'installazione di file .apk o .ipa al di fuori degli store ufficiali (App Store e Google Play). L'utente si assume la piena e totale responsabilità derivante dall'uso di strumenti di terze parti (come AltStore) per l'installazione. L'applicazione non include codice malevolo, ma l'installazione manuale, che aggira le verifiche ufficiali (es. Google Play Protect), è effettuata esclusivamente a rischio e pericolo dell'utente.
              </div>
              <div className="text-[11px] opacity-80 pt-2 border-t border-red-500/20">
                <strong>Marchi Registrati:</strong> Apple, il logo Apple e iOS sono marchi registrati di Apple Inc. Google, Chrome, Android e Google Play sono marchi di Google LLC. L'uso di loghi, icone o nomi di aziende terze in questa pagina ha il solo scopo di indicare la compatibilità tecnica del software (uso nominativo) e non implica in alcun modo associazione, sponsorizzazione, certificazione o approvazione da parte dei rispettivi proprietari.
              </div>
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
