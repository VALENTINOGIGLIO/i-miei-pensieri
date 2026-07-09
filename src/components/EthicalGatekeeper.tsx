import { useState, useEffect } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Info from "lucide-react/dist/esm/icons/info";

interface EthicalGatekeeperProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function EthicalGatekeeper({ onClose, onSuccess }: EthicalGatekeeperProps) {
  const alreadyRead = localStorage.getItem("hasReadEthicalChoices") === "true";
  const [secondsLeft, setSecondsLeft] = useState(alreadyRead ? 0 : 12);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleContinue = () => {
    localStorage.setItem("hasReadEthicalChoices", "true");
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2 text-[var(--accent-warm)]">
            <Info size={20} />
            <h3 className="font-bold text-lg font-display text-[var(--text-primary)]">Scelte Etiche e di Design</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm text-[var(--text-secondary)] leading-relaxed font-serif">
          <p className="font-sans font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Approfondimento sulle scelte etiche e di design
          </p>
          <p>
            Ogni dettaglio di questa interfaccia e della tecnologia sottostante è stato progettato per sottrazione, andando controcorrente rispetto alle logiche del mercato digitale. Ecco le nostre scelte:
          </p>

          {[
            {
              title: "1. L'Input Esclusivamente Vocale",
              text: "Non puoi digitare i tuoi pensieri. Ti chiediamo di pronunciarli ad alta voce perché l'atto del parlare interrompe la pigrizia mentale. Dover tradurre un'emozione in parole parlate ti costringe a strutturare il pensiero e il linguaggio nello stesso istante, rendendoti parte attiva del processo e non consumatore passivo di uno schermo.",
            },
            {
              title: "2. L'Intelligenza Artificiale Oppositiva",
              text: "La quasi totalità degli algoritmi moderni è programmata per darti ragione e confermare le tue idee con il solo scopo di trattenerti nell'app. Qui avviene l'esatto contrario. Il sistema analizza le tue parole per indagare ciò che ancora non hai considerato. Ti proporrà letture affini, ma soprattutto testi opposti e spunti dialettici per scardinare i bias cognitivi e stimolare un senso critico orientato al realismo.",
            },
            {
              title: "3. La Crittografia a Conoscenza Zero",
              text: "I tuoi pensieri appartengono solo a te. L'applicazione è strutturalmente cieca: i testi vengono sigillati sul tuo dispositivo tramite crittografia end-to-end prima di essere salvati. Non esiste una funzione di \"recupero password\" perché noi non possediamo la tua chiave. Se la dimentichi, i tuoi dati sono persi per sempre. È il prezzo della vera sovranità sui tuoi dati.",
            },
            {
              title: "4. L'Attrito Intenzionale contro la Frenesia",
              text: "In un'epoca che premia la gratificazione istantanea, questa applicazione introduce deliberatamente l'attrito. Troverai tempi di attesa sincronizzati per le analisi e blocchi temporanei che ti costringono a rallentare. È un invito a riprenderti il tuo tempo e a dare il giusto peso a ogni riflessione.",
            },
            {
              title: "5. La Tutela del Confine Umano",
              text: "Questo spazio si occupa di esplorazione interiore e razionalità, rifiutando categoricamente qualsiasi pretesa clinica, medica o diagnostica. Esistono guardrail invalicabili: qualora il sistema rilevi un disagio profondo che supera il perimetro dell'introspezione, l'algoritmo si arresterà immediatamente, invitandoti a consultare professionisti umani e servizi di supporto.",
            },
          ].map(({ title, text }) => (
            <div key={title} className="flex flex-col gap-1 mt-2">
              <p className="font-semibold text-[var(--text-primary)] text-sm font-sans">{title}</p>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border-color)] pt-4 mt-2">
          <button
            onClick={handleContinue}
            disabled={secondsLeft > 0}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
              secondsLeft > 0
                ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed"
                : "bg-[var(--accent-warm)] text-white hover:opacity-90 shadow-sm"
            }`}
          >
            {secondsLeft > 0 ? `Prenditi un momento... (${secondsLeft}s)` : "Procedi all'invio"}
          </button>
        </div>
      </div>
    </div>
  );
}
