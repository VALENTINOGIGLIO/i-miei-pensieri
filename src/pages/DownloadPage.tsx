import React, { useState } from 'react';
import Download from "lucide-react/dist/esm/icons/download";
import Globe from "lucide-react/dist/esm/icons/globe";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Lock from "lucide-react/dist/esm/icons/lock";
import { motion, AnimatePresence } from 'motion/react';

const AppleLogo = () => (
  <svg viewBox="0 0 384 512" fill="currentColor" width="24" height="24">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

const AndroidLogo = () => (
  <svg viewBox="0 0 576 512" fill="currentColor" width="24" height="24">
    <path d="M420.2 92.2l43-74.4c3.4-5.9 1.4-13.4-4.5-16.8-5.9-3.4-13.4-1.4-16.8 4.5l-44.5 76.9C353 60 302.2 48 248 48s-105 12-149.3 34.3L54.2 5.5c-3.4-5.9-10.9-7.9-16.8-4.5-5.9 3.4-7.9 10.9-4.5 16.8l43 74.4C30.6 137.9 0 205.7 0 282.7h496c0-77-30.6-144.8-75.8-190.5zM128 224c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm240 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/>
  </svg>
);

export default function DownloadPage() {
  const [openIosGuide, setOpenIosGuide] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans overflow-x-hidden selection:bg-blue-500/30 relative">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center items-center z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-organic"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-organic" style={{ animationDelay: '1s' }}></div>
      </div>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-zinc-800 to-black dark:from-zinc-100 dark:to-zinc-300 rounded-3xl flex items-center justify-center shadow-2xl mb-8 border border-zinc-200/20"
          >
            <Lock className="text-white dark:text-zinc-900" size={40} strokeWidth={1.5} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 pb-2"
          >
            I Miei Pensieri
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            La cassaforte digitale definitiva per le tue idee. <br/> Scegli la tua piattaforma e inizia subito.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          
          {/* Web App Card */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group flex flex-col bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe size={24} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Web App</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 flex-1 leading-relaxed">
              Il metodo più facile e immediato. Aggiungi il sito alla schermata Home per avere l'app completa gratis sul tuo telefono.
            </p>
            <a 
              href="/"
              className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl text-center transition-colors shadow-sm"
            >
              Apri Web App
            </a>
          </motion.div>

          {/* iOS Card */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group flex flex-col bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <AppleLogo />
            </div>
            <h3 className="text-2xl font-bold mb-2">iOS</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 flex-1 leading-relaxed">
              Scarica il file .ipa ufficiale per installare l'app nativa sul tuo iPhone (sideloading).
            </p>
            <a 
              href="/downloads/IMieiPensieri.ipa"
              download
              className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-2 mb-4 shadow-sm"
            >
              <Download size={18} /> Scarica .ipa
            </a>
            <button 
              onClick={() => setOpenIosGuide(!openIosGuide)}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center gap-1 transition-colors"
            >
              Come installare {openIosGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </motion.div>

          {/* Android Card */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="group flex flex-col bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <AndroidLogo />
            </div>
            <h3 className="text-2xl font-bold mb-2">Android</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 flex-1 leading-relaxed">
              Scarica il file APK per installare direttamente l'app nativa sul tuo smartphone Android.
            </p>
            <a 
              href="/downloads/IMieiPensieri.apk"
              download
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download size={18} /> Scarica .apk
            </a>
          </motion.div>

        </div>

        {/* Expandable iOS Guide */}
        <AnimatePresence>
          {openIosGuide && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 32 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="w-full max-w-4xl overflow-hidden"
            >
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-8 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 shadow-xl">
                <h4 className="font-bold text-xl text-zinc-900 dark:text-white mb-6">Guida all'installazione (Sideloading)</h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. Preparazione</h5>
                    <p className="text-sm leading-relaxed">
                      Assicurati di avere un software di sideloading (es. AltServer) configurato sul tuo computer e la relativa app (es. AltStore) sul tuo iPhone. I due dispositivi devono essere connessi alla stessa rete Wi-Fi.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. Download</h5>
                    <p className="text-sm leading-relaxed">
                      Scarica il file <code>IMieiPensieri.ipa</code> premendo il bottone qui sopra. Scegli di salvare il file all'interno dell'app <strong>File</strong> del tuo iPhone (nella cartella Download).
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. Installazione</h5>
                    <p className="text-sm leading-relaxed">
                      Apri l'app di sideloading (es. AltStore) sull'iPhone. Vai nella scheda <strong>My Apps</strong> e tocca il pulsante <strong>+</strong>. Seleziona il file <code>IMieiPensieri.ipa</code> scaricato in precedenza.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-2">
                      <span className="text-lg">💡</span> Promemoria importante
                    </h5>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                      L'app scadrà ogni 7 giorni. Ricordati di aprire il tuo store alternativo sull'iPhone una volta a settimana (mentre il computer è acceso e collegato al Wi-Fi) per rinnovare il certificato di sviluppo!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Legal Disclaimers (Inattaccabile) */}
        <div className="w-full max-w-4xl mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h4 className="text-zinc-800 dark:text-zinc-300 font-semibold mb-4 text-sm uppercase tracking-wider">Note Legali e Termini di Utilizzo</h4>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 space-y-4 font-serif leading-relaxed text-justify">
            <p>
              <strong>Indipendenza del Progetto:</strong> "I Miei Pensieri" è un progetto software indipendente sviluppato a scopo personale e reso disponibile "così com'è" (as-is). Questa applicazione non è affiliata, associata, autorizzata, supportata, né in alcun modo collegata ufficialmente a Apple Inc., Google LLC, o a una qualsiasi delle loro consociate o affiliate.
            </p>
            <p>
              <strong>Marchi Registrati:</strong> "Apple", "iPhone", "iOS", "Mac" e il logo Apple sono marchi registrati di Apple Inc., registrati negli Stati Uniti e in altri Paesi. "Android" e il logo Android sono marchi registrati di Google LLC. L'utilizzo di tali marchi in questa pagina ha puro scopo descrittivo e informativo, nel rispetto delle normative sul fair use, per indicare la compatibilità del software.
            </p>
            <p>
              <strong>Limitazione di Responsabilità (Sideloading):</strong> Il download e l'installazione di applicazioni al di fuori degli store ufficiali (App Store per iOS, Google Play Store per Android), procedura comunemente nota come "Sideloading", comporta l'utilizzo di certificati di sviluppo o store di terze parti (es. AltStore). Lo sviluppatore di questa applicazione declina ogni responsabilità per eventuali danni al dispositivo, perdita di dati, violazioni di sicurezza, malfunzionamenti o potenziale invalidazione della garanzia derivanti dall'installazione manuale dei file <code>.ipa</code> o <code>.apk</code>. L'utente si assume il rischio integrale di tale operazione.
            </p>
            <p>
              <strong>Privacy e Sicurezza:</strong> L'applicazione utilizza tecnologie di crittografia End-to-End in locale sul dispositivo dell'utente. Lo sviluppatore non ha in alcun caso accesso alle chiavi di decrittazione, né può in alcun modo recuperare i dati dell'utente in caso di smarrimento della password.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center text-zinc-400 dark:text-zinc-500 text-sm font-medium">
        <p>&copy; {new Date().getFullYear()} I Miei Pensieri. Progetto Indipendente.</p>
      </footer>
    </div>
  );
}
