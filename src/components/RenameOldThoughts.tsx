import { useState, useEffect } from "react";
import { useThoughts } from "../hooks/useThoughts";
import { User } from "firebase/auth";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

interface Props {
  user: User | null;
  cryptoKey: CryptoKey | null;
  apiKey: string;
}

export function RenameOldThoughts({ user, cryptoKey, apiKey }: Props) {
  const { thoughts, updateThoughtsBulk } = useThoughts(user, cryptoKey);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const handleRename = async () => {
    const toRename = thoughts.filter(t => t.title === "Pensiero Veloce" || t.title === "Pensiero Salvato");
    if (toRename.length === 0) return;
    
    setIsProcessing(true);
    setTotal(toRename.length);
    setProgress(0);
    
    const bulkUpdates = [];
    for (let i = 0; i < toRename.length; i++) {
      const t = toRename[i];
      let newTitle = t.content.split(' ').slice(0, 5).join(' ') + '...';
      
      if (apiKey) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Genera un titolo molto breve (massimo 5 parole) che riassuma questo pensiero. Restituisci SOLO il titolo senza virgolette:\n\n${t.content}` }] }],
              generationConfig: { temperature: 0.3 },
            })
          });
          const data = await res.json();
          const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResp) newTitle = textResp.trim();
        } catch (e) {
          console.error("Gemini failed for rename", e);
        }
      }
      
      bulkUpdates.push({ id: t.id, updatedData: { title: newTitle } });
      setProgress(i + 1);
      
      if (apiKey) {
        await new Promise(r => setTimeout(r, 500)); // rate limit
      }
    }
    
    if (bulkUpdates.length > 0) {
      await updateThoughtsBulk(bulkUpdates);
    }
    setIsProcessing(false);
  };

  const toRenameCount = thoughts.filter(t => t.title === "Pensiero Veloce" || t.title === "Pensiero Salvato").length;

  if (toRenameCount === 0) return null;

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-color)] mt-6">
      <div className="flex items-center gap-3 mb-4">
         <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
           <Sparkles size={20} />
         </div>
         <div>
           <h3 className="font-bold text-[var(--text-primary)] text-base">Rinomina Vecchi Pensieri</h3>
           <p className="text-sm text-[var(--text-secondary)]">Hai {toRenameCount} pensieri con titolo predefinito.</p>
         </div>
      </div>
      <button 
        onClick={handleRename}
        disabled={isProcessing}
        className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] py-3 rounded-xl font-bold hover:bg-[var(--bg-hover)] active:scale-95 transition-all text-sm disabled:opacity-50"
      >
        {isProcessing ? `Rinominando... (${progress}/${total})` : "Genera Titoli Personalizzati"}
      </button>
    </div>
  );
}
