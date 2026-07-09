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

        {/* Web App Options */}
        <div className="px-6 pb-16 max-w-xl mx-auto w-full">
          {/* Web App Card */}
          <div className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-2 border-[var(--accent-warm)] rounded-3xl p-8 flex flex-col items-center text-center shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-[var(--accent-warm)]"></div>
            <Chrome size={64} className="text-[var(--accent-warm)] mb-6" />
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4 font-outfit">Web App</h2>
            <p className="text-base text-[var(--text-secondary)] mb-8 flex-1">
              La versione più sicura e aggiornata. Usala direttamente dal browser o aggiungila alla schermata Home del tuo dispositivo per un'esperienza nativa.
            </p>
            <button 
              onClick={() => toggleAccordion('web-install')}
              className="w-full py-4 px-6 bg-[var(--accent-warm)] text-white text-lg rounded-2xl font-bold flex items-center justify-center gap-3 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
            >
              <Smartphone size={24} />
              Aggiungi alla Home
            </button>
          </div>
        </div>

        {/* Instructions Accordion */}
        <div className="px-6 pb-12 max-w-xl mx-auto w-full space-y-4">
          <h3 className="text-xl font-bold text-[var(--text-primary)] font-outfit mb-4 text-center">Come Installare (PWA)</h3>

          {/* Web Instructions */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl overflow-hidden">
            <button 
              onClick={() => toggleAccordion('web-install')}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="font-semibold text-[var(--text-primary)]">Istruzioni Aggiunta alla Home</span>
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
            <div className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)] block mb-1">Avvertenza Legale e Limitazione di Responsabilità</strong>
              Questa applicazione è fornita come strumento software indipendente per installazione manuale (sideloading). Lo sviluppatore declina ogni responsabilità per eventuali danni al dispositivo, perdita di dati, violazioni della garanzia hardware o malfunzionamenti derivanti dall'installazione di file .apk o .ipa al di fuori degli store ufficiali (App Store e Google Play). L'utente si assume la piena e totale responsabilità derivante dall'uso di strumenti di terze parti (come AltStore) per l'installazione. L'applicazione non include codice malevolo, ma l'installazione manuale, che aggira le verifiche ufficiali (es. Google Play Protect), è effettuata esclusivamente a rischio e pericolo dell'utente.
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
