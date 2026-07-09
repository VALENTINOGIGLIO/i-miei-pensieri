import { useState, useEffect } from "react";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Info from "lucide-react/dist/esm/icons/info";

interface Spunto {
  id: number;
  titolo: string;
  testo: string;
  approfondimento_lettura: string;
}

const TESTI_BASE: Spunto[] = [
  {
    id: 1,
    titolo: "Il peso dello specchio",
    testo: "Spesso cerchiamo nel pensiero un rifugio, una pacifica conferma delle nostre convinzioni. Eppure, la vera indagine filosofica non offre riparo, ma esposizione. La sua utilità più profonda è farti sentire intimamente giudicato. Non distogliere lo sguardo e non sfuggire a questa sensazione di inadeguatezza correndo verso la prossima distrazione. Accogli il giudizio, sostieni il peso della tua ignoranza e sfrutta questo istante di vuoto per capire quale parte delle tue certezze deve essere distrutta per permetterti di evolvere.",
    approfondimento_lettura: "Al di là del bene e del male di F. Nietzsche"
  },
  {
    id: 2,
    titolo: "Non sei tu che leggi",
    testo: "Siamo abituati a pensare all'atto della lettura come a un dominio attivo. Ma di fronte ai grandi pensieri, accade l'esatto opposto. Non sei tu che leggi il libro, è il libro che legge te. Ogni riga si trasforma in una superficie riflettente, uno strumento clinico in grado di decifrare la tua interiorità. Devi procedere con una lentezza sacrale affinché l'opera possa perquisirti l'anima, costringendoti a farti scoprire chi sei diventato.",
    approfondimento_lettura: "Come leggere un libro di M. Adler / Opere di M. Proust"
  },
  {
    id: 3,
    titolo: "L'estinzione del presente",
    testo: "Il mondo contemporaneo ci ha convinti che il valore di un individuo si misuri dalla rapidità con cui processa le informazioni. Ci muoviamo scivolando in superficie, terrorizzati dall'idea di dover rimanere soli. Rifiutiamo la profondità perché richiede tempo, e il tempo ci spaventa. Ma chi consuma il proprio tempo esclusivamente per reagire al rumore del mondo, smette di esistere come soggetto e diventa un simple ingranaggio di reazione. Riprendere il controllo significa arrestare la macchina.",
    approfondimento_lettura: "La società della stanchezza di Byung-Chul Han"
  },
  {
    id: 4,
    titolo: "L'alchimia della comprensione",
    testo: "Crediamo che scorrere rapidamente una nozione significhi averla compresa, ma l'informazione è solo materia inerte. La vera conoscenza richiede un processo alchemico, uno sforzo cognitivo lento e faticoso che ristruttura fisicamente le connessioni del tuo cervello. La comprensione esige attrito. Questo tempo non è un ostacolo, ma la fornace necessaria per trasformare ciò che leggi in ciò che sei.",
    approfondimento_lettura: "Pensieri lenti e veloci di D. Kahneman"
  },
  {
    id: 5,
    titolo: "Il terrore del vuoto",
    testo: "Perché fuggiamo costantemente verso il prossimo stimolo visivo? Perché l'assenza di distrazioni ci terrorizza. La noia e il senso di vuoto non sono difetti da curare con scorrimenti compulsivi; sono la soglia esatta del tuo autentico io. Ogni volta che cedi all'urgenza di riempire un momento di pausa, stai fuggendo dal tuo baricentro. Sostieni la vertigine di questa immobilità e abbi il coraggio di incontrare te stesso.",
    approfondimento_lettura: "Pensieri di B. Pascal - Il concetto di divertissement"
  },
  {
    id: 6,
    titolo: "Il conforto del gregge",
    testo: "La società ci fornisce opinioni pre-confezionate per risparmiarci il costo energetico del pensiero critico. Quando navighi nel mondo a grande velocità, non hai il tempo di analizzare: finisci inevitabilmente per assorbire e adottare i pensieri della massa. La rapidità è il veicolo perfetto per il conformismo. Questo blocco è un atto di ribellione intellettuale. Rifiuta la comodità della reazione istantanea.",
    approfondimento_lettura: "Sulla libertà di J.S. Mill / 'Massa e Potere' di E. Canetti"
  },
  {
    id: 7,
    titolo: "Il coraggio del dubbio",
    testo: "Costruiamo fortezze fatte di dogmi e pregiudizi per difenderci dall'angoscia di non sapere. Ci aggrappiamo alle nostre idee non perché siano vere, ma perché ci fanno sentire al sicuro. Eppure, la vera intelligenza non risiede in ciò che sei pronto a difendere, ma in ciò che sei disposto a demolire. Lascia che il dubbio si insinui e crepi il muro delle tue certezze.",
    approfondimento_lettura: "Meditazioni metafisiche di R. Descartes"
  },
  {
    id: 8,
    titolo: "L'eresia dell'inutilità",
    testo: "Sei stato addestrato a considerare il tempo come una valuta economica: se non lo stai spendendo per produrre qualcosa, ti senti in colpa. Ma una mente ridotta a un semplice registro contabile non può creare nulla di originale. Il tempo passato a fissare uno schermo spento, a lasciare che i pensieri si sciolgano senza uno scopo immediato, è la più alta forma di resistenza. Reclama il tuo diritto all'inutilità riflessiva.",
    approfondimento_lettura: "L'utilità dell'inutile di N. Ordine"
  },
  {
    id: 9,
    titolo: "L'anestesia dell'istante",
    testo: "Abbiamo l'ossessione di catturare e archiviare ogni singolo istante per paura di perderlo. Ma trasformando la vita in un archivio da scorrere velocemente, smettiamo di abitarla. Lo schermo agisce come un'anestesia potente contro l'intensità cruda del presente. Smetti di prepararti a vivere. Fermati. Lascia che il peso schiacciante di essere esattamente qui annienti la tua urgenza di passare ad altro.",
    approfondimento_lettura: "L'Essere e il Nulla di J.P. Sartre"
  },
  {
    id: 10,
    titolo: "L'atrofia della volontà",
    testo: "Gli algoritmi moderni prevedono i tuoi desideri. In questa esistenza priva di attriti, stai lentamente perdendo il muscolo decisionale. Delegare le tue scelte alla fluidità di un'interfaccia significa delegare la responsabilità della tua identità. Essere umani significa fare fatica e sopportare il peso di una scelta ponderata. In questo vuoto artificiale, riprenditi la responsabilità di essere l'unico autore della tua esistenza.",
    approfondimento_lettura: "L'esistenzialismo è un umanismo di J.P. Sartre"
  }
];

interface SpuntiRiflessioneProps {
  apiKey?: string;
}

export function SpuntiRiflessione({ apiKey }: SpuntiRiflessioneProps) {
  const [currentSpunto, setCurrentSpunto] = useState<Spunto | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshesLeft, setRefreshesLeft] = useState(4);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);

  // Caricamento iniziale dei limiti e dello spunto corrente
  useEffect(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("spunti_last_date");
    
    let count = 4;
    if (lastDate === today) {
      const savedCount = localStorage.getItem("spunti_refreshes_left");
      if (savedCount !== null) {
        count = parseInt(savedCount, 10);
      }
    } else {
      localStorage.setItem("spunti_last_date", today);
      localStorage.setItem("spunti_refreshes_left", "4");
    }
    setRefreshesLeft(count);

    // Carica l'ultimo spunto visualizzato o pescane uno
    const savedSpunto = localStorage.getItem("current_spunto");
    if (savedSpunto) {
      try {
        setCurrentSpunto(JSON.parse(savedSpunto));
      } catch (e) {
        pescaSpuntoIniziale();
      }
    } else {
      pescaSpuntoIniziale();
    }
  }, []);

  const pescaSpuntoIniziale = () => {
    // Pesca uno spunto a caso dai base
    const visti = JSON.parse(localStorage.getItem("vistiSpuntiIds") || "[]") as number[];
    const nonVisti = TESTI_BASE.filter(t => !visti.includes(t.id));
    const targetList = nonVisti.length > 0 ? nonVisti : TESTI_BASE;
    const randomSpunto = targetList[Math.floor(Math.random() * targetList.length)];
    
    if (nonVisti.length > 0 && !visti.includes(randomSpunto.id)) {
      visti.push(randomSpunto.id);
      localStorage.setItem("vistiSpuntiIds", JSON.stringify(visti));
    }
    
    setCurrentSpunto(randomSpunto);
    localStorage.setItem("current_spunto", JSON.stringify(randomSpunto));
  };

  const handleRefresh = async () => {
    if (refreshesLeft <= 0) {
      // Controlla se possiamo dare il Bonus iniziale
      const hasUsedBonus = localStorage.getItem("hasUsedBonus") === "true";
      if (!hasUsedBonus) {
        setBonusMessage(
          "Ti sei nutrito di molte parole oggi. D'ora in poi avrai a disposizione solo 4 spunti al giorno, per abituarti alla lentezza e dare il giusto peso a ciò che leggi. Per questa volta, ecco un ultimo bonus."
        );
        localStorage.setItem("hasUsedBonus", "true");
        localStorage.setItem("spunti_refreshes_left", "4");
        setRefreshesLeft(4);
        return;
      }
      return;
    }

    setLoading(true);
    setBonusMessage(null);
    try {
      const visti = JSON.parse(localStorage.getItem("vistiSpuntiIds") || "[]") as number[];
      
      // Se tutti i 10 base sono stati visti, usiamo Gemini API (se presente l'apiKey)
      if (visti.length >= TESTI_BASE.length && apiKey) {
        const preferenze = localStorage.getItem("preferenze_lettura") || "";
        const prefText = preferenze.trim()
          ? `\nL'utente ha queste preferenze di lettura: "${preferenze}". Calibra il tono e la spiegazione dell'approfondimento in base ad esse per renderlo invitante e consono all'utente, senza però ridurre l'alto spessore filosofico e la caratura classica dell'opera raccomandata.`
          : "";
        const sysPrompt = `Agisci come un filosofo rigoroso. Genera un breve monologo interiore (max 150 parole) su una debolezza o illusione esistenziale/sociale contemporanea (la fretta, i bias, la superficialità). Capovolgi la prospettiva dell'utente con una verità scomoda. Tono inesorabile, letterario, crudo, focalizzato sul realismo. Alla fine del testo, fornisci sempre un singolo 'Spunto di approfondimento', suggerendo un saggio o un'opera filosofica/letteraria classica reale e attinente al tema appena trattato. Nessun saluto.${prefText}`;
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: sysPrompt },
                { text: `Genera uno spunto originale. Non ripetere questi temi trattati in precedenza: ${TESTI_BASE.map(b => b.titolo).join(", ")}. Restituisci SOLO un JSON con questo formato:\n{"titolo": "Titolo dello spunto", "testo": "Testo dello spunto...", "approfondimento_lettura": "Libro consigliato di Autore"}` }
              ]
            }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
          })
        });

        if (!res.ok) throw new Error("API Gemini Fallita");
        const data = await res.json();
        const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResp) {
          const generated = JSON.parse(textResp) as Spunto;
          generated.id = Date.now(); // ID temporaneo
          setCurrentSpunto(generated);
          localStorage.setItem("current_spunto", JSON.stringify(generated));
        }
      } else {
        // Altrimenti pesca tra i rimanenti dei base
        const nonVisti = TESTI_BASE.filter(t => !visti.includes(t.id));
        const targetList = nonVisti.length > 0 ? nonVisti : TESTI_BASE;
        const randomSpunto = targetList[Math.floor(Math.random() * targetList.length)];
        
        if (nonVisti.length > 0 && !visti.includes(randomSpunto.id)) {
          visti.push(randomSpunto.id);
          localStorage.setItem("vistiSpuntiIds", JSON.stringify(visti));
        }
        
        setCurrentSpunto(randomSpunto);
        localStorage.setItem("current_spunto", JSON.stringify(randomSpunto));
      }

      // Aggiorna refresh
      const nextRefreshes = refreshesLeft - 1;
      setRefreshesLeft(nextRefreshes);
      localStorage.setItem("spunti_refreshes_left", String(nextRefreshes));
    } catch (e) {
      console.error(e);
      // Fallback a pesca casuale locale in caso di errore di rete/API
      pescaSpuntoIniziale();
    } finally {
      setLoading(false);
    }
  };

  if (!currentSpunto) return null;

  const isDepleted = refreshesLeft <= 0;

  return (
    <div className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col gap-6 shadow-sm animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--accent-warm)]">
          <BookOpen size={20} />
          <h3 className="font-bold font-display text-base text-[var(--text-primary)]">Qualche Spunto</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)]">
          {refreshesLeft} refresh rimasti oggi
        </span>
      </div>

      {/* Testo Spunto */}
      <div className="flex flex-col gap-4 font-serif">
        <h4 className="text-lg font-semibold text-[var(--text-primary)] font-display leading-snug">
          {currentSpunto.titolo}
        </h4>
        <p className="text-base text-[var(--text-secondary)] leading-relaxed italic">
          &ldquo;{currentSpunto.testo}&rdquo;
        </p>
      </div>

      {/* Approfondimento */}
      <div className="border-t border-[var(--border-color)] pt-4 flex flex-col gap-1.5 bg-[var(--bg-secondary)] p-4 rounded-2xl border">
        <span className="text-[10px] font-sans font-bold text-[var(--accent-warm)] uppercase tracking-wider">
          Spunto di approfondimento consigliato
        </span>
        <span className="text-sm font-sans font-medium text-[var(--text-primary)]">
          {currentSpunto.approfondimento_lettura}
        </span>
      </div>

      {/* Errori / Avvisi di Bonus */}
      {bonusMessage && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl flex gap-3 text-xs leading-relaxed font-sans">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>{bonusMessage}</span>
        </div>
      )}

      {/* Bottone Refresh */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleRefresh}
          disabled={loading || (isDepleted && localStorage.getItem("hasUsedBonus") === "true")}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isDepleted && localStorage.getItem("hasUsedBonus") === "true"
              ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed"
              : "bg-[var(--accent-warm)] text-white hover:opacity-90 shadow-sm"
          }`}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <RefreshCw size={16} />
              {isDepleted ? "Richiedi Bonus di Lettura" : "Cambia spunto"}
            </>
          )}
        </button>

        {isDepleted && localStorage.getItem("hasUsedBonus") === "true" && (
          <p className="text-[11px] text-center text-[var(--text-muted)] italic leading-relaxed px-4">
            Hai esaurito gli spunti di oggi. Fermati, non consumare. Torna domani per riflettere ancora.
          </p>
        )}
      </div>

    </div>
  );
}
