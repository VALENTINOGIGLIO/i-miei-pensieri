import { useState, useEffect } from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Info from "lucide-react/dist/esm/icons/info";

/** Versione corrente del manifesto - incrementa questo numero ogni volta che cambi il testo del manifesto per forzare la rilettura agli utenti esistenti */
export const IDEA_VERSION = "2.0";
const IDEA_VERSION_KEY = "idea_version_seen";

interface IdeaScreenProps {
  onAccept: () => void;
  enableTimer?: boolean; // true = blocca il pulsante per 12s (primo onboarding)
}

export function IdeaScreen({ onAccept, enableTimer = false }: IdeaScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(enableTimer ? 12 : 0);
  const [isEthicsOpen, setIsEthicsOpen] = useState(false);

  useEffect(() => {
    if (!enableTimer || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [enableTimer, secondsLeft]);

  const handleAccept = () => {
    localStorage.setItem(IDEA_VERSION_KEY, IDEA_VERSION);
    onAccept();
  };

  return (
    <div className="w-full flex flex-col gap-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Manifesto ─────────────────────────────────────────────────── */}
      <div className="prose prose-zinc dark:prose-invert max-w-none text-[var(--text-secondary)] leading-[1.8] text-base sm:text-lg font-serif">
        <p className="text-[var(--text-primary)] font-semibold text-xl sm:text-2xl font-display leading-tight mb-2">
          I pensieri stanno svanendo.
        </p>
        <p className="italic text-[var(--text-secondary)]">
          Rispondiamo incessantemente a stimoli nervosi, ma... <em>chi sta pensando davvero?</em>
        </p>

        <p>
          Viviamo immersi in un flusso passivo e accelerato. Bombardati da contenuti di pochi secondi che erodono la nostra attenzione, stiamo appiattendo il nostro elettroencefalogramma. Reagiamo, ma non elaboriamo. La velocità del rumore quotidiano ci ha sottratto lo spazio materiale per il pensiero profondo, lasciandoci in un ambiente che premia la distrazione e asseconda le nostre certezze. Non c'è quasi più tempo per fermarsi e guardare in faccia la realtà.
        </p>

        <p>
          Ho sempre sognato un'oasi. Non un comodo rifugio in cui nascondersi, ma un perimetro rigoroso in cui fermarsi e ascoltarsi. Ascoltarsi <em>davvero</em>. Per questo è nato 'I Miei Pensieri'.
        </p>

        <p>
          Qui sei incoraggiato a usare la voce. Parlare non ammette pigrizia mentale: ti obbliga a strutturare pensiero e linguaggio nello stesso istante. Ti allena a dare una forma tangibile a ciò che hai dentro.
        </p>

        <p>
          Questo spazio, inoltre, non è costruito per assecondarti. L'algoritmo analizzerà le tue riflessioni per spingerti oltre. Ti consiglierà letture affini, ma soprattutto indagherà ciò che ancora non hai indagato, proponendoti <strong>testi oppositivi</strong>. L'obiettivo è scardinare i bias e sfidare le tue convinzioni, allenando un senso critico indipendente orientato esclusivamente verso il realismo e la ricerca della verità.
        </p>

        <p className="text-[var(--text-primary)] italic">
          L'ho costruita per me, come antidoto al rumore. Ma la mia più grande soddisfazione è sapere che, in mezzo a tutto questo caos, qualcuno come te ha deciso di usare questo strumento per riprendersi il proprio tempo.
        </p>
      </div>

      {/* ── Accordion Scelte Etiche ─────────────────────────────────────── */}
      <div className="mt-8">
        <button
          onClick={() => setIsEthicsOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          aria-expanded={isEthicsOpen}
        >
          <div className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center group-hover:bg-[var(--bg-card)] transition-colors">
            <Info size={14} />
          </div>
          <span className="font-medium">Approfondimento sulle scelte etiche e di design</span>
          {isEthicsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {isEthicsOpen && (
          <div className="mt-4 p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="font-semibold text-[var(--text-primary)] text-sm font-display">Perché questa applicazione è diversa?</p>
            <p className="text-[var(--text-secondary)] text-sm">
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
                text: "In un'epoca che premia la gratificazione istantanea, questa applicazione introduce deliberatamente l'attrito. Troverai tempi di attesa sincronizzati per le analisi e blocchi temporanei che ti costringono a rallentare (come il timer su questa stessa pagina). È un invito a riprenderti il tuo tempo e a dare il giusto peso a ogni riflessione.",
              },
              {
                title: "5. La Tutela del Confine Umano",
                text: "Questo spazio si occupa di esplorazione interiore e razionalità, rifiutando categoricamente qualsiasi pretesa clinica, medica o diagnostica. Esistono guardrail invalicabili: qualora il sistema rilevi un disagio profondo che supera il perimetro dell'introspezione, l'algoritmo si arresterà immediatamente, invitandoti a consultare professionisti umani e servizi di supporto.",
              },
            ].map(({ title, text }) => (
              <div key={title} className="flex flex-col gap-1">
                <p className="font-semibold text-[var(--text-primary)] text-sm">{title}</p>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pulsante con Timer ──────────────────────────────────────────── */}
      <div className="mt-8">
        <button
          onClick={handleAccept}
          disabled={secondsLeft > 0}
          className={`w-full py-4 px-8 rounded-2xl font-semibold text-base transition-all active:scale-95 flex items-center justify-center gap-3 ${
            secondsLeft > 0
              ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]"
              : "bg-[var(--accent-warm)] text-white shadow-md hover:opacity-90 hover:shadow-lg"
          }`}
        >
          {secondsLeft > 0 ? (
            <>
              <div className="w-6 h-6 rounded-full border-2 border-[var(--text-muted)] flex items-center justify-center text-xs font-bold">
                {secondsLeft}
              </div>
              Prenditi un momento... ({secondsLeft}s)
            </>
          ) : (
            "Ho capito, iniziamo →"
          )}
        </button>
        {secondsLeft > 0 && (
          <p className="text-center text-xs text-[var(--text-muted)] mt-2 italic">
            Questo breve attrito è intenzionale.
          </p>
        )}
      </div>
    </div>
  );
}

/** Controlla se l'utente deve vedere "L'Idea" per aggiornamento di versione */
export function shouldShowIdeaScreen(): boolean {
  const seen = localStorage.getItem(IDEA_VERSION_KEY);
  return seen !== IDEA_VERSION;
}
