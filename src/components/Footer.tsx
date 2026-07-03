export function Footer() {
  return (
    <footer className="w-full py-8 text-center mt-auto border-t border-zinc-100">
      <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-400 mb-4">
        {/* Usiamo target="_blank" per evitare che l'app provi a caricarli internamente */}
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors">Privacy Policy</a>
        <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors">Termini e Condizioni</a>
        <a href="/cookies.html" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors">Cookie & Storage</a>
      </div>
      <p className="text-[10px] text-zinc-300 uppercase tracking-widest">
        © 2026 I Miei Pensieri - Architettura Zero-Knowledge
      </p>
    </footer>
  );
}