export interface ProcessedThought {
  id: string;
  timestamp: number;
  rawText: string;       // IMMUTABILE: testo grezzo originale dettato dall'utente
  title: string;         // Titolo generato da IA (in lingua originale)
  content: string;       // Contenuto processato da IA (in lingua originale)
  pensiero_originale_grezzo?: string; // Doppia verità: testo originale grezzo
  pensiero_rielaborato_ia?: string;   // Doppia verità: rielaborazione IA
  spunti_maieutici?: string[];        // Domande maieutiche generate da IA
  tags: string[];
  category?: string;
  depth?: number;
  mood?: string;
  unlockDate?: number;   // timestamp in milliseconds
  location?: { lat: number; lng: number };
  originalAudio?: string;
  /**
   * Traduzioni separate: NON sovrascrivono mai rawText/content.
   * Struttura: { "en": { title: "...", content: "..." }, ... }
   */
  translations?: {
    [lang: string]: {
      title: string;
      content: string;
    };
  };
}
