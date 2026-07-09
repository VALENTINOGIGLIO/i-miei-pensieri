import Mic from "lucide-react/dist/esm/icons/mic";
import Square from "lucide-react/dist/esm/icons/square";
import { useCallback } from "react";
import { useAudioVisualizer } from "../hooks/useAudioVisualizer";
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface RecordButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({ isListening, onStart, onStop, disabled }: RecordButtonProps) {
  const volume = useAudioVisualizer(isListening && !disabled);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    try {
      if (isListening) {
        Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (e) {
      // Fallback for web
      if ('vibrate' in navigator) {
        try {
          if (isListening) {
            navigator.vibrate([50, 50]);
          } else {
            navigator.vibrate([50]);
          }
        } catch (err) {}
      }
    }

    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  }, [isListening, onStart, onStop, disabled]);

  return (
    <div className="flex justify-center items-center py-4 w-full">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex justify-center items-center">
        {/* Siri-like Aura Effect */}
        {isListening && (
          <div 
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-75 ease-out bg-transparent"
            style={{
              boxShadow: `0 0 ${20 + volume * 40}px ${5 + volume * 15}px var(--accent-warm)`,
              opacity: 0.4 + (volume * 0.3),
              transform: `scale(${1 + volume * 0.8})`,
            }}
          />
        )}
        
        <button
          onClick={handleClick}
          disabled={disabled}
          style={{
            transform: isListening ? `scale(${1 + volume * 0.25})` : 'scale(1)'
          }}
          className={`relative flex items-center justify-center w-full h-full rounded-full shadow-lg transition-transform duration-75 ease-out active:scale-95 z-10
            ${disabled 
              ? "opacity-50 bg-[var(--text-muted)] text-[var(--bg-base)] cursor-not-allowed" 
              : isListening 
                ? "bg-[var(--accent-warm)] text-[var(--bg-base)]" 
                : "bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-base)] shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            }`}
        >
          {isListening ? <Square size={36} className="fill-current" /> : <Mic size={36} />}
        </button>
      </div>
    </div>
  );
}
