
- Ogni volta che viene modificato il sito, l'agente deve eseguire lo script unificato (`bash ./deploy.sh`) per compilare e aggiornare la Web App, creare e zippare l'IPA (iOS), compilare l'APK (Android) e infine fare il deploy di tutto su Firebase.

- Ogni volta che viene richiesta una modifica, devi avviare un subagent Perito (per controllare la conformità legale e i rischi) e un subagent Analyst (per controllare a fondo tutti i file interessati dalla modifica nel progetto).
