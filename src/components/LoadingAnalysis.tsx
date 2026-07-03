import { useState, useEffect } from "react";

const PHRASES = [
  "Decostruzione logica in corso...",
  "Ricerca di testi oppositivi...",
  "Calibrazione dell'analisi...",
  "Sintesi del pensiero..."
];

export function LoadingAnalysis() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // trigger fade out
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PHRASES.length);
        setFade(true); // trigger fade in
      }, 500); // 500ms transition time
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center py-4 w-full">
      <span
        className={`text-sm font-sans text-[var(--text-muted)] transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-30"
        }`}
      >
        {PHRASES[index]}
      </span>
    </div>
  );
}
