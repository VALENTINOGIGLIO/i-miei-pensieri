export interface ProcessedThought {
  id: string;
  timestamp: number;
  rawText: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  depth?: number;
  mood?: string;
  unlockDate?: number; // timestamp in milliseconds
  location?: { lat: number; lng: number };
  originalAudio?: string;
}
