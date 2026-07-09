import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, orderBy, writeBatch } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { encryptText, decryptText } from "../lib/crypto";
import { ProcessedThought } from "../types";

export function useThoughts(user: any, vaultKey: CryptoKey | null) {
  const [thoughts, setThoughts] = useState<ProcessedThought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser?.uid || !vaultKey) {
      setThoughts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/thoughts`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const loadedThoughts: ProcessedThought[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.ciphertext && data.iv) {
            try {
              const decryptedJson = await decryptText(data.ciphertext, data.iv, vaultKey);
              const thought = JSON.parse(decryptedJson);
              loadedThoughts.push({ ...thought, id: docSnap.id, timestamp: data.timestamp });
            } catch (err) {
              console.error("Failed to decrypt thought", docSnap.id);
              // Se la decrittografia fallisce, inseriamo un "pensiero segnaposto"
              // così l'utente può vederlo nell'interfaccia ed eliminarlo dal database.
              loadedThoughts.push({
                id: docSnap.id,
                timestamp: data.timestamp || Date.now(),
                rawText: "⚠️ Errore di decrittografia",
                title: "⚠️ Errore Decrittografia",
                content: "Impossibile leggere questo pensiero. È stato salvato con una 'Password Cassaforte' diversa o i dati sono corrotti. Eliminalo tramite l'apposita icona cestino per rimettere in ordine il sistema.",
                tags: ["Errore"],
                category: "Sistema",
                depth: 0
              });
            }
          }
        }
        setThoughts(loadedThoughts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error(err);
      setError("Errore durante il caricamento dei pensieri.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, vaultKey]);

  const saveThought = async (thought: ProcessedThought) => {
    if (!auth.currentUser?.uid) throw new Error("Utente non autenticato o UID mancante al momento del salvataggio.");
    if (!vaultKey) return;
    
    let thoughtRef;
    try {
      const thoughtJson = JSON.stringify(thought);
      const { ciphertext, iv } = await encryptText(thoughtJson, vaultKey);
      
      thoughtRef = doc(db, `users/${auth.currentUser.uid}/thoughts`, thought.id);
      console.log("Tentativo di scrittura nel path:", thoughtRef.path);
      await setDoc(thoughtRef, {
        ciphertext,
        iv,
        timestamp: thought.timestamp || Date.now()
      });
    } catch (err: any) {
      console.error("Failed to save thought", err);
      if (thoughtRef) {
        throw new Error("Permessi negati sul path [" + thoughtRef.path + "]. " + err.message);
      }
      throw err;
    }
  };

  const deleteThought = async (id: string) => {
    if (!auth.currentUser?.uid) return;
    try {
      const thoughtRef = doc(db, `users/${auth.currentUser.uid}/thoughts`, id);
      await deleteDoc(thoughtRef);
    } catch (err) {
      console.error("Failed to delete thought", err);
      throw err;
    }
  };

  const updateThought = async (id: string, updatedData: any) => {
    if (!auth.currentUser?.uid || !vaultKey) return;
    try {
      // Fetch the existing thought from state to merge
      const existingThought = thoughts.find(t => t.id === id);
      if (!existingThought) throw new Error("Thought not found in state");

      // Non permettiamo di aggiornare i pensieri contrassegnati come corrotti
      if (existingThought.title === "⚠️ Errore Decrittografia") {
        throw new Error("Non puoi modificare un pensiero corrotto. Puoi solo eliminarlo.");
      }

      const mergedThought = { ...existingThought, ...updatedData };
      const thoughtJson = JSON.stringify(mergedThought);
      const { ciphertext, iv } = await encryptText(thoughtJson, vaultKey);

      const thoughtRef = doc(db, `users/${auth.currentUser.uid}/thoughts`, id);
      await updateDoc(thoughtRef, {
        ciphertext,
        iv,
        timestamp: mergedThought.timestamp
      });
    } catch (err) {
      console.error("Failed to update thought", err);
      throw err;
    }
  };

  const updateThoughtsBulk = async (thoughtsToUpdate: {id: string, updatedData: any}[]) => {
    if (!auth.currentUser?.uid || !vaultKey) return;
    try {
      const batch = writeBatch(db);
      for (const item of thoughtsToUpdate) {
        const existingThought = thoughts.find(t => t.id === item.id);
        if (!existingThought) continue;
        if (existingThought.title === "⚠️ Errore Decrittografia") continue;

        const mergedThought = { ...existingThought, ...item.updatedData };
        const thoughtJson = JSON.stringify(mergedThought);
        const { ciphertext, iv } = await encryptText(thoughtJson, vaultKey);

        const thoughtRef = doc(db, `users/${auth.currentUser.uid}/thoughts`, item.id);
        batch.update(thoughtRef, {
          ciphertext,
          iv,
          timestamp: mergedThought.timestamp
        });
      }
      await batch.commit();
    } catch (err) {
      console.error("Failed to update thoughts in bulk", err);
      throw err;
    }
  };

  return {
    thoughts,
    setThoughts,
    loading,
    error,
    saveThought,
    deleteThought,
    updateThought,
    updateThoughtsBulk
  };
}