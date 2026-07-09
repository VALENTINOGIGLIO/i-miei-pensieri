# 🕹️ Centro di Comando - Gestione Moduli ed Interruttori ("Per Me")

Questo pannello di controllo ti permette di attivare o disattivare in totale autonomia le funzionalità dell'applicazione.

## 1. Come disattivare/attivare le funzioni manualmente
Puoi configurare le funzionalità modificando direttamente il file degli interruttori centralizzato:
👉 [featureFlags.ts](file:///Users/gi/Documents/i-miei-pensieri/src/lib/featureFlags.ts)

Imposta su `true` per abilitare o su `false` per disabilitare ciascuna funzione:
- **`microphone`**: Gestisce il microfono, il visualizzatore d'onda e la trascrizione vocale.
- **`thoughtList`**: Gestisce l'elenco e le schede dei pensieri scritti o registrati.
- **`analysis`**: Gestisce il profilo e l'analisi filosofica nella schermata dedicata.
- **`readingAdvice`**: Gestisce gli spunti di riflessione e consigli di lettura.

## 2. Come disattivare/attivare le funzioni tramite riga di comando
È disponibile uno script per automatizzare l'accensione/spegnimento dei moduli senza aprire il file di codice. Esegui dal terminale nella directory principale dell'app:

```bash
# Esempi di de-integrazione dei moduli (Undeploy):
node src/per-me/toggle.js microphone false
node src/per-me/toggle.js analysis false

# Esempi di ri-attivazione dei moduli (Deploy):
node src/per-me/toggle.js microphone true
node src/per-me/toggle.js analysis true
```

## 3. Comportamento Fail-Safe e Sicurezza
- **Isolamento del Core E2EE**: Disattivando qualsiasi interruttore, l'infrastruttura di base (routing in `App.tsx`, database Firebase, crittografia locale Zero-Knowledge PBKDF2/AES-GCM) rimarrà completamente isolata, intatta e protetta.
- **Rendering Condizionale**: La disattivazione di un modulo escluderà il rendering del componente in modo fluido dall'interfaccia utente (compresi i tab di navigazione), senza generare eccezioni o errori di compilazione/build.
