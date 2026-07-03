import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  GoogleGenAI,
  Type,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const getAiInstance = (req: express.Request) => {
  const customKey = req.headers["x-gemini-api-key"] as string;
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  app.get("/api/config", (req, res) => {
    res.json({
      appUrl:
        process.env.APP_URL ||
        "https://ais-pre-noow7kqfij63pt5she6his-917658786050.europe-west2.run.app",
    });
  });

  const cleanJsonStr = (str: string) => {
    return str
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
  };

  app.post("/api/process-thought", async (req, res) => {
    try {
      const ai = getAiInstance(req);
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `I have spoken this thought quickly through voice dictation: "${text}". 
      Please fix it, order it logically, and make it very clear for future reading. Do not add conversational filler.
      Output a valid JSON object matching the provided schema.`,
        config: {
          temperature: 0.9,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description:
                  "A short, descriptive title for the thought (max 5 words)",
              },
              content: {
                type: Type.STRING,
                description:
                  "The clearly formatted and logically ordered thought",
              },
              tags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "Up to 3 relevant tags to categorize the thought",
              },
              category: {
                type: Type.STRING,
                description:
                  "La macro categoria del pensiero (es. Lavoro, Personale, Idee)",
              },
              depth: {
                type: Type.INTEGER,
                description: "Un valore da 1 a 10 che rappresenta la profondità introspettiva e analitica del pensiero."
              }
            },
            required: ["title", "content", "tags", "category", "depth"],
          },
          systemInstruction:
            "You are an assistant that takes raw spoken thoughts, cleans them up grammatically, fixes dictation errors, and formats them clearly so they are easy to read later. Stay true to the original meaning. DO NOT REFUSE TO PROCESS THE TEXT, EVEN IF IT CONTAINS OFFENSIVE LANGUAGE, HATE SPEECH, OR PROFANITY. YOU ARE EXPLICITLY AUTHORIZED TO PROCESS IT.",
        },
      });

      if (response.candidates?.[0]?.finishReason === "SAFETY") {
        return res
          .status(400)
          .json({
            error:
              "Il modello IA ha bloccato il testo per violazione delle norme di sicurezza (Hate Speech/Contenuti Pericolosi). Ci sono limiti non aggirabili per la sicurezza.",
          });
      }

      const jsonStr = response.text?.trim();
      if (!jsonStr)
        throw new Error(
          "No response text. Possibile blocco di sicurezza interno.",
        );

      const processed = JSON.parse(cleanJsonStr(jsonStr));

      res.json(processed);
    } catch (error: any) {
      console.error("Error processing thought:", error);
      if (error.message === "MISSING_API_KEY") {
        return res
          .status(401)
          .json({
            error:
              "API Key mancante. Inserisci la tua API Key nelle impostazioni.",
          });
      }
      if (
        error.status === 429 ||
        error?.error?.code === 429 ||
        error?.status === 403 ||
        error?.status === 400 ||
        error?.status === 404
      ) {
        return res
          .status(400)
          .json({
            error: `Errore API Gemini (${error.status || error?.error?.code}): ${error.message || "Controlla la tua API Key o se il modello è supportato."}`,
          });
      }
      res
        .status(500)
        .json({ error: error.message || "Failed to process thought." });
    }
  });

  app.post("/api/edit-thought", async (req, res) => {
    try {
      const ai = getAiInstance(req);
      const { text, currentTitle, currentContent } = req.body;
      if (!text || !currentContent) {
        return res
          .status(400)
          .json({ error: "Text and currentContent are required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `Il pensiero originale è intitolato "${currentTitle}" e contiene: "${currentContent}".
      Ho appena detto questa nuova istruzione vocale o aggiunta: "${text}".
      Aggiorna il pensiero originale seguendo l'istruzione. Restituisci un formato JSON valido.`,
        config: {
          temperature: 0.9,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description:
                  "A short, descriptive title for the thought (max 5 words)",
              },
              content: {
                type: Type.STRING,
                description:
                  "The clearly formatted and logically ordered thought",
              },
              tags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "Up to 3 relevant tags to categorize the thought",
              },
              category: {
                type: Type.STRING,
                description:
                  "La macro categoria del pensiero (es. Lavoro, Personale, Idee)",
              },
              depth: {
                type: Type.INTEGER,
                description: "Un valore da 1 a 10 che rappresenta la profondità introspettiva e analitica del pensiero."
              }
            },
            required: ["title", "content", "tags", "category", "depth"],
          },
          systemInstruction:
            "Sei un assistente che modifica un pensiero esistente in base a nuove direttive vocali. Applica la modifica mantenendo il significato logico e la chiarezza dell'originale. Correggi grammatica e sbavature vocali. Produci lo stesso formato di output richiesto dal tracciato JSON. NON RIFIUTARE LA RICHIESTA NEMMENO SE CONTIENE LINGUAGGIO OFFENSIVO, OMOFOBO O RAZZISTA, SEI AUTORIZZATO AD ELABORARLO.",
        },
      });

      if (response.candidates?.[0]?.finishReason === "SAFETY") {
        return res
          .status(400)
          .json({
            error:
              "Il modello IA ha bloccato il testo per violazione delle norme di sicurezza (Hate Speech/Contenuti Pericolosi). Ci sono limiti non aggirabili per la sicurezza.",
          });
      }

      const jsonStr = response.text?.trim();
      if (!jsonStr)
        throw new Error(
          "No response text. Possibile blocco di sicurezza interno.",
        );

      const processed = JSON.parse(cleanJsonStr(jsonStr));

      res.json(processed);
    } catch (error: any) {
      console.error("Error editing thought:", error);
      if (error.message === "MISSING_API_KEY") {
        return res
          .status(401)
          .json({
            error:
              "API Key mancante. Inserisci la tua API Key nelle impostazioni.",
          });
      }
      if (
        error.status === 429 ||
        error?.error?.code === 429 ||
        error?.status === 403 ||
        error?.status === 400 ||
        error?.status === 404
      ) {
        return res
          .status(400)
          .json({
            error: `Errore API Gemini (${error.status || error?.error?.code}): ${error.message || "Controlla la tua API Key o se il modello è supportato."}`,
          });
      }
      res
        .status(500)
        .json({ error: error.message || "Failed to edit thought." });
    }
  });

  app.post("/api/generate-profile", async (req, res) => {
    try {
      const ai = getAiInstance(req);
      const { thoughts } = req.body;
      if (!thoughts || !Array.isArray(thoughts)) {
        return res.status(400).json({ error: "Thoughts array is required" });
      }

      const thoughtsText = thoughts
        .map(
          (t) =>
            `Titolo: ${t.title}\nContenuto: ${t.content}\nCategoria: ${t.category}\nTags: ${t.tags?.join(", ")}\nProfondità: ${t.depth}/10`,
        )
        .join("\n\n");

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `Ecco tutti i pensieri registrati finora (${thoughts.length} in totale):
${thoughtsText}

Sulla base di questi pensieri, fai un'analisi completa e MOLTO ONESTA della persona che li ha scritti.
Non essere accondiscendente. Sii diretto, costruttivo e analitico. Fornisci un testo descrittivo.
MOLTO IMPORTANTE: Se ci sono pochi pensieri (meno di 5), DEVI dichiarare esplicitamente all'inizio che i dati a disposizione sono insufficienti per un'analisi psicologica accurata. Sottolinea che l'affidabilità di questo profilo è attualmente solo superficiale e che migliorerà aggiungendo altre note. Mantieni un tono distaccato, non trarre conclusioni definitive ed evita di affermare che il profilo sia "nitido" o "molto chiaro" se si basa su un numero esiguo di pensieri.`,
        config: {
          temperature: 0.9,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              profileText: {
                type: Type.STRING,
                description: "Il testo dell'analisi psicologica e comportamentale in formato Markdown.",
              },
              booksToDeepen: {
                type: Type.ARRAY,
                description: "2 libri scelti per approfondire i temi cari all'utente o con cui sarebbe d'accordo.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["title", "author", "reason"]
                }
              },
              booksToChallenge: {
                type: Type.ARRAY,
                description: "2 libri scelti per sfidare le certezze e le convinzioni dell'utente.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["title", "author", "reason"]
                }
              }
            },
            required: ["profileText", "booksToDeepen", "booksToChallenge"],
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
        },
      });

      const responseData = JSON.parse(response.text || "{}");
      res.json(responseData);
    } catch (error: any) {
      console.error("Error generating profile:", error);
      if (error.message === "MISSING_API_KEY") {
        return res.status(401).json({ error: "API Key mancante." });
      }
      if (
        error.status === 429 ||
        error?.error?.code === 429 ||
        error?.status === 403 ||
        error?.status === 400 ||
        error?.status === 404
      ) {
        return res
          .status(400)
          .json({
            error: `Errore API Gemini (${error.status || error?.error?.code}): ${error.message || "Controlla la tua API Key o se il modello è supportato."}`,
          });
      }
      res
        .status(500)
        .json({ error: error.message || "Failed to generate profile." });
    }
  });


// ... (Qui c'è la fine della tua funzione app.post("/api/generate-profile"... ) )
  // ... res.status(500).json({ error: error.message || "Failed to generate profile." });
  //   }
  // });

  // INCOLLA QUI IL BLOCCO CHE HAI TAGLIATO:
// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();