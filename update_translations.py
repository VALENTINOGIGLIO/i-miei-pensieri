import re

with open("src/lib/translations.ts", "r", encoding="utf-8") as f:
    content = f.read()

it_strings = """
    // --- Onboarding ---
    onboardingWelcome: 'Benvenuto',
    onboardingSelectLanguage: 'Scegli la tua lingua per continuare',
    onboardingTitle1: 'Il Progetto',
    onboardingP1_1: 'Viviamo in un mondo che va troppo veloce, bombardati da contenuti di pochi secondi che ci stanno distruggendo l\\'attenzione. Non c\\'è quasi più tempo per pensare. Avevo sempre sognato un\\'oasi, un luogo che ti desse un attimo di tranquillità, in cui puoi semplicemente fermarti e ascoltarti. Ma ascoltarti davvero.',
    onboardingP1_2: 'Ecco perché qui sei spinto a usare la voce. Dover parlare ti costringe a strutturare il pensiero e il linguaggio nello stesso momento. Ti allena a dare forma a quello che hai dentro.',
    onboardingP1_3: 'Qui l\\'IA non si limiterà a darti ragione: analizzerà le tue riflessioni e ti consiglierà libri affini, ma soprattutto testi oppositivi, che sfidano le tue convinzioni per aiutarti a costruire uno spirito critico indipendente, così da calibrare le misure con cui ti rapporti al mondo.',
    onboardingP1_4: 'L\\'ho costruito per me, ma la mia più grande soddisfazione è sapere che, in mezzo a tanto rumore, qualcuno come te ha deciso di usare questo spazio per riprendersi il proprio tempo.',
    onboardingTitle2: 'Privacy e Condizioni',
    onboardingP2_1: 'Questa applicazione utilizza la crittografia End-to-End. I tuoi dati sono al sicuro sul tuo dispositivo e protetti da una password.',
    onboardingP2_2: 'Per offrirti le analisi e i suggerimenti, l\\'app si avvale di Intelligenze Artificiali (come Google Gemini). I tuoi pensieri vengono inviati ai loro server esclusivamente nel momento in cui richiedi un\\'analisi e non vengono mai utilizzati per addestrare modelli pubblici.',
    onboardingP2_3_1: 'Per utilizzare appieno l\\'app devi accettare i nostri ',
    onboardingP2_3_TOS: 'Termini di Servizio',
    onboardingP2_3_2: ' e l\\'',
    onboardingP2_3_PRIVACY: 'Informativa sulla Privacy',
    onboardingP2_3_3: '. Puoi anche saltare questo passaggio e accettare in seguito solo quando userai le singole funzionalità.',
    onboardingAgeLabel: 'Dichiaro di avere almeno 16 anni di età, come richiesto dalle normative sulla privacy (GDPR).',
    onboardingNext: 'Avanti',
    onboardingSkip: 'Salta per ora',
    onboardingAccept: 'Accetto Tutto',

    // --- Legal Modal ---
    legalPrivacyTitle: 'Informativa sulla Privacy',
    legalTosTitle: 'Termini di Servizio',
    legalUnderstand: 'Ho compreso',
    legalRejectAiGps: 'Rifiuta IA e GPS',
    
    legalPrivacy1Title: '1. Architettura "Zero-Knowledge" (E2EE)',
    legalPrivacy1Text: '"I miei Pensieri" è costruita con il principio della Privacy by Design. Tutti i tuoi dati (testi, registrazioni vocali, API key) vengono crittografati in locale sul tuo dispositivo utilizzando lo standard AES-GCM a 256 bit. La chiave di cifratura è derivata univocamente dalla tua password (tramite PBKDF2). Questo significa che nessuno, nemmeno noi sviluppatori, ha la possibilità tecnica di decifrare o leggere i tuoi pensieri. Su Firestore salviamo solo stringhe incomprensibili.',
    legalPrivacy2Title: '2. Integrazione AI e Dati Sensibili',
    legalPrivacy2Text: 'Se scegli di attivare le funzioni IA (come "Frasi Ispiratrici" o "Analisi Psicologica"), i tuoi pensieri verranno decifrati temporaneamente sul tuo dispositivo e inviati alle API di Google Gemini tramite HTTPS. Google processa i dati per generare la risposta ma non li utilizza per addestrare i propri modelli pubblici (come da policy di Google Cloud Enterprise/AI Studio).',
    legalPrivacy2WarningLabel: 'Avvertenza per il traduttore gratuito:',
    legalPrivacy2WarningText: ' Se utilizzi l\\'opzione "Usa Traduttore Gratuito", la crittografia E2EE decade. I testi verranno inviati in chiaro all\\'API di MyMemory.',
    legalPrivacy3Title: '3. Geolocalizzazione',
    legalPrivacy3Text: 'Se attivi la geolocalizzazione, le coordinate GPS verranno associate ai tuoi pensieri e anch\\'esse verranno crittografate localmente prima del salvataggio. Non teniamo traccia degli spostamenti in tempo reale.',
    
    legalTos1Title: '1. Accettazione dei Termini',
    legalTos1Text: 'L\\'accesso e l\\'utilizzo dell\\'applicazione comportano l\\'accettazione incondizionata dei presenti Termini. Se non sei d\\'accordo, sei invitato a non utilizzare il servizio.',
    legalTos2Title: '2. Limitazione di Responsabilità',
    legalTos2Text: 'IL SERVIZIO È FORNITO "COSÌ COM\\'È", SENZA GARANZIE DI ALCUN TIPO, ESPLICITE O IMPLICITE. In nessun caso il creatore dell\\'applicazione sarà ritenuto responsabile per qualsiasi reclamo, danno, perdita di Dati (dovuta allo smarrimento della "Password Cassaforte"), furto o uso abusivo della tua API Key di Google AI Studio (in caso di password debole o dispositivo compromesso).',
    legalTos3Title: '3. Sicurezza e Password',
    legalTos3Text: 'Essendo un\\'architettura Zero-Knowledge, sei l\\'unico responsabile della custodia e della memorizzazione della tua "Password Cassaforte". Non esistono procedure di recupero: lo smarrimento della password comporta la perdita definitiva dei Dati.',
    legalTos4Title: '4. Chiave API di Terze Parti (Modello BYOK)',
    legalTos4Text: 'L\\'applicazione permette l\\'inserimento opzionale di una chiave API gratuita fornita da Google (Google AI Studio) per le funzionalità di intelligenza artificiale. Inserendo questa chiave (Bring Your Own Key), sei tenuto a rispettare i Termini di Servizio di Google. Sei l\\'unico responsabile per il superamento delle quote, la fatturazione, eventuali addebiti generati e la protezione della tua chiave. L\\'applicazione crittografa la chiave API (con crittografia Zero-Knowledge) e la memorizza sui database cloud in modo inaccessibile allo sviluppatore.',
    legalTos5Title: '5. Utilizzo del Microfono',
    legalTos5Text: 'Il servizio di trascrizione vocale avviene tramite l\\'API Web Speech del tuo browser e sistema operativo. Nessun dato audio viene memorizzato dai nostri server.',
    legalTos6Title: '6. Contatti',
    legalTos6Text: 'Per qualsiasi domanda o contestazione relativa ai presenti Termini, contattaci a:',
"""

en_strings = """
    // --- Onboarding ---
    onboardingWelcome: 'Welcome',
    onboardingSelectLanguage: 'Choose your language to continue',
    onboardingTitle1: 'The Project',
    onboardingP1_1: 'We live in a world that moves too fast, bombarded by seconds-long content that is destroying our attention span. There is hardly any time left to think. I always dreamed of an oasis, a place that gives you a moment of tranquility, where you can simply stop and listen to yourself. But truly listen.',
    onboardingP1_2: 'That is why here you are encouraged to use your voice. Having to speak forces you to structure thought and language at the same time. It trains you to give shape to what you hold inside.',
    onboardingP1_3: 'Here, AI will not just agree with you: it will analyze your reflections and recommend similar books, but above all opposing texts, which challenge your beliefs to help you build independent critical thinking, so you can calibrate the measures with which you relate to the world.',
    onboardingP1_4: 'I built it for myself, but my greatest satisfaction is knowing that, amidst so much noise, someone like you decided to use this space to take back their time.',
    onboardingTitle2: 'Privacy and Terms',
    onboardingP2_1: 'This application uses End-to-End encryption. Your data is safe on your device and protected by a password.',
    onboardingP2_2: 'To offer you analysis and suggestions, the app uses Artificial Intelligence (like Google Gemini). Your thoughts are sent to their servers exclusively when you request an analysis and are never used to train public models.',
    onboardingP2_3_1: 'To fully use the app you must accept our ',
    onboardingP2_3_TOS: 'Terms of Service',
    onboardingP2_3_2: ' and the ',
    onboardingP2_3_PRIVACY: 'Privacy Policy',
    onboardingP2_3_3: '. You can also skip this step and accept later only when using individual features.',
    onboardingAgeLabel: 'I declare that I am at least 16 years old, as required by privacy regulations (GDPR).',
    onboardingNext: 'Next',
    onboardingSkip: 'Skip for now',
    onboardingAccept: 'Accept All',

    // --- Legal Modal ---
    legalPrivacyTitle: 'Privacy Policy',
    legalTosTitle: 'Terms of Service',
    legalUnderstand: 'I understand',
    legalRejectAiGps: 'Reject AI & GPS',
    
    legalPrivacy1Title: '1. "Zero-Knowledge" Architecture (E2EE)',
    legalPrivacy1Text: '"My Thoughts" is built on the Privacy by Design principle. All your data (texts, voice recordings, API keys) is encrypted locally on your device using the 256-bit AES-GCM standard. The encryption key is uniquely derived from your password (via PBKDF2). This means that no one, not even us developers, has the technical ability to decrypt or read your thoughts. We only save incomprehensible strings on Firestore.',
    legalPrivacy2Title: '2. AI Integration and Sensitive Data',
    legalPrivacy2Text: 'If you choose to activate AI functions (like "Inspiring Phrases" or "Psychological Analysis"), your thoughts will be temporarily decrypted on your device and sent to Google Gemini APIs via HTTPS. Google processes the data to generate the response but does not use it to train its public models (as per Google Cloud Enterprise/AI Studio policy).',
    legalPrivacy2WarningLabel: 'Warning for the free translator:',
    legalPrivacy2WarningText: ' If you use the "Use Free Translator" option, E2EE encryption is voided. Texts will be sent in plain text to the MyMemory API.',
    legalPrivacy3Title: '3. Geolocation',
    legalPrivacy3Text: 'If you enable geolocation, GPS coordinates will be associated with your thoughts and they will also be encrypted locally before saving. We do not track your real-time movements.',
    
    legalTos1Title: '1. Acceptance of Terms',
    legalTos1Text: 'Accessing and using the application implies unconditional acceptance of these Terms. If you do not agree, you are invited not to use the service.',
    legalTos2Title: '2. Limitation of Liability',
    legalTos2Text: 'THE SERVICE IS PROVIDED "AS IS", WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. In no event shall the creator of the application be held liable for any claim, damage, loss of Data (due to the loss of the "Vault Password"), theft, or abusive use of your Google AI Studio API Key (in case of a weak password or compromised device).',
    legalTos3Title: '3. Security and Password',
    legalTos3Text: 'As a Zero-Knowledge architecture, you are solely responsible for keeping and storing your "Vault Password". There are no recovery procedures: losing the password results in the permanent loss of Data.',
    legalTos4Title: '4. Third-Party API Key (BYOK Model)',
    legalTos4Text: 'The application allows the optional insertion of a free API key provided by Google (Google AI Studio) for artificial intelligence features. By inserting this key (Bring Your Own Key), you are bound to comply with Google\\'s Terms of Service. You are solely responsible for exceeding quotas, billing, any charges generated, and protecting your key. The application encrypts the API key (with Zero-Knowledge encryption) and stores it on cloud databases in a way that is inaccessible to the developer.',
    legalTos5Title: '5. Use of Microphone',
    legalTos5Text: 'The voice transcription service occurs via the Web Speech API of your browser and operating system. No audio data is stored by our servers.',
    legalTos6Title: '6. Contacts',
    legalTos6Text: 'For any questions or disputes regarding these Terms, contact us at:',
"""

content = re.sub(r'(languageEn: \'English\',)', r'\1\n' + it_strings, content, count=1)
content = re.sub(r'(languageEn: \'English\',\s*})', r'\1\n' + en_strings, content, count=1)

with open("src/lib/translations.ts", "w", encoding="utf-8") as f:
    f.write(content)
