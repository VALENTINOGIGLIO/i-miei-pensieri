import os
import re

files_to_update = {
    "src/components/BottomNav.tsx": [
        ("Pensieri", "{t('nav.thoughts')}"),
        ("Analisi", "{t('nav.analysis')}"),
        ("Opzioni", "{t('nav.options')}"),
        ("Impostazioni", "{t('nav.settings')}"),
    ],
    "src/components/PasswordSetup.tsx": [
        ("Cassaforte", "{t('password.vault')}"),
        ("Usa il riconoscimento biometrico per sbloccare i tuoi pensieri.", "{t('password.useBiometricsPrompt')}"),
        ("Inserisci la tua password per sbloccare i tuoi pensieri.", "{t('password.usePasswordPrompt')}"),
        ("Sblocca con Face ID", "{t('password.unlockWithFaceId')}"),
        ("Autenticazione biometrica non riuscita. Inserisci la password.", "{t('password.biometricFailed')}"),
        ("Usa la password", "{t('password.usePasswordBtn')}"),
        ("← Usa Face ID", "{t('password.useFaceIdBtn')}"),
        ("Password Cassaforte", "{t('password.passwordPlaceholder')}"),
        ("Abilita Face ID / Impronta", "{t('password.enableBiometrics')}"),
        ("Non dovrai più digitare la password", "{t('password.noMorePassword')}"),
        ("Sblocca Dati", "{t('password.unlockData')}"),
        ("Inserisci la tua password cassaforte.", "{t('password.insertPasswordError')}"),
        ("Utente non autenticato. Ricarica la pagina.", "{t('password.unauthenticatedError')}"),
        ("Credenziali biometriche non trovate.", "{t('password.credentialsNotFoundError')}"),
    ],
    "src/components/ApiKeySetup.tsx": [
        ("Benvenuto in I Miei Pensieri", "{t('apiKey.welcome')}"),
        ("Per garantire la tua privacy e nessuna limitazione, l\\'app richiede la tua API Key personale di Google AI Studio (completamente gratuita). Verrà crittografata con la tua password e salvata in modo sicuro.", "{t('apiKey.description')}"),
        ("Come ottenere la chiave:", "{t('apiKey.howToGetIt')}"),
        ("Vai su ", "{t('apiKey.goTo')}"),
        ("Accedi con il tuo account Google", "{t('apiKey.loginGoogle')}"),
        ("Crea una nuova API Key ed incollala qui sotto", "{t('apiKey.createKey')}"),
        ("Tutela della Privacy", "{t('apiKey.privacyProtection')}"),
        ("Google si riserva il diritto di usare i dati delle API Key gratuite per addestrare i propri modelli. Per garantire che i tuoi pensieri restino privati al 100%, accedi alle impostazioni del tuo account Google AI Studio e disabilita la condivisione dei dati (Data Retention/Training Opt-out).", "{t('apiKey.privacyNotice')}"),
        ("La tua API Key Gemini", "{t('apiKey.inputLabel')}"),
        ("Salva e Inizia", "{t('apiKey.saveAndStart')}"),
        ("Continua senza API Key (Usa Default)", "{t('apiKey.continueWithout')}"),
    ],
    "src/components/Stats.tsx": [
        ("Registra qualche pensiero per vedere le tue statistiche.", "{t('stats.recordSomeThoughts')}"),
        ("Le Tue Statistiche", "{t('stats.title')}"),
        ("Andamento nel tempo dei tuoi pensieri e intensità", "{t('stats.subtitle')}"),
        ("Riepilogo dell\\'Umore", "{t('stats.moodSummaryTitle')}"),
        ("Analisi degli ultimi 30 giorni", "{t('stats.moodSummaryDesc')}"),
        ("Genera Riepilogo", "{t('stats.generateSummaryBtn')}"),
        ("API Key mancante.", "{t('stats.missingApiKey')}"),
        ("Non ci sono pensieri recenti per generare un riepilogo.", "{t('stats.noRecentThoughts')}"),
        ("Errore nella generazione del riepilogo", "{t('stats.summaryError')}"),
        ("Connessione Interiore", "{t('stats.innerConnectionTitle')}"),
        ("Incrocio tra frequenza (quantità) e intensità (profondità) dei tuoi pensieri", "{t('stats.innerConnectionDesc')}"),
        ("Altissima", "{t('stats.veryHigh')}"),
        ("Buona", "{t('stats.good')}"),
        ("Da coltivare", "{t('stats.needsCultivation')}"),
        ("Frequenza dei pensieri", "{t('stats.frequencyTitle')}"),
        ("Quanti pensieri hai registrato ogni giorno", "{t('stats.frequencyDesc')}"),
        ("'Pensieri'", "t('stats.thoughtsLabel')"),
        ("Intensità Emotiva (1-10)", "{t('stats.intensityTitle')}"),
        ("La profondità analizzata dall\\'IA giorno per giorno", "{t('stats.intensityDesc')}"),
        ("'Profondità'", "t('stats.depthLabel')"),
    ],
    "src/components/Profile.tsx": [
        ("Chiave API Mancante", "{t('profile.missingApiKeyTitle')}"),
        ("Per utilizzare l\\'Analisi Psicologica devi inserire la chiave API Gemini nelle Impostazioni.", "{t('profile.missingApiKeyDesc')}"),
        ("Registra qualche pensiero in più per sbloccare l\\'analisi psicologica.", "{t('profile.recordMoreThoughts')}"),
        ("Analisi Personale", "{t('profile.title')}"),
        ("Un overview onesta basata sui tuoi pensieri.", "{t('profile.subtitle')}"),
        ("Aggiorna", "{t('profile.refresh')}"),
        ("Attenzione:", "{t('profile.warning')}"),
        ("Hai registrato solo", "{t('profile.recordedOnly')}"),
        ("pensiero", "{t('profile.thoughtSingular')}"),
        ("pensieri", "{t('profile.thoughtPlural')}"),
        ("L\\'analisi mostrata qui sotto è molto sommaria e potenzialmente non affidabile. Continua ad aggiungere pensieri (ne consigliamo almeno 5) per delineare un profilo più accurato.", "{t('profile.unreliableAnalysis')}"),
        ("Analisi in corso, la verità nuda e cruda...", "{t('profile.analyzingText')}"),
        ("Per approfondire", "{t('profile.toDeepen')}"),
        ("di", "{t('profile.byAuthor')}"),
        ("Per sfidare le certezze", "{t('profile.toChallenge')}"),
    ],
    "src/components/ThoughtCard.tsx": [
        ("Modifica con la voce", "{t('thoughtCard.editWithVoice')}"),
        ("Elimina pensiero", "{t('thoughtCard.deleteThought')}"),
        ("Vuoi davvero eliminare questo pensiero?", "{t('thoughtCard.confirmDelete')}"),
        ("Annulla", "{t('thoughtCard.cancel')}"),
        ("Elimina", "{t('thoughtCard.deleteBtn')}"),
        ("Stai dicendo:", "{t('thoughtCard.youAreSaying')}"),
        ("Pensiero sigillato nella Capsula del Tempo.", "{t('thoughtCard.sealedInCapsule')}"),
        ("Si aprirà il", "{t('thoughtCard.willOpenOn')}"),
        ("Posizione", "{t('thoughtCard.location')}"),
        ("Apri in Google Maps", "{t('thoughtCard.openInMaps')}"),
        ("Errore durante l\\'aggiornamento del pensiero.", "{t('thoughtCard.updateError')}"),
        ("Errore durante la modifica.", "{t('thoughtCard.editError')}"),
    ],
    "src/components/ConnectionIndicator.tsx": [
        ("Disconnesso", "{t('connection.disconnected')}"),
        ("In Riconnessione", "{t('connection.reconnecting')}"),
        ("Buon Allineamento", "{t('connection.goodAlignment')}"),
        ("Profonda Connessione", "{t('connection.deepConnection')}"),
        ("Analisi della Connessione", "{t('connection.analysisTitle')}"),
        ("Ultimi 7 giorni", "{t('connection.last7Days')}"),
        ("Informazioni sulla connessione", "{t('connection.infoLabel')}"),
        ("Come funziona?", "{t('connection.howItWorks')}"),
        ("Questo indicatore riflette l\\'intensità della tua connessione interiore. Non si basa solo su quanti pensieri registri, ma premia la profondità introspettiva di ciò che esprimi.", "{t('connection.description1')}"),
        ("Più rifletti autenticamente e frequentemente, più la barra si completa indicando un forte allineamento con te stesso.", "{t('connection.description2')}"),
    ],
}

def prepend_import(content):
    if "useLanguage" not in content:
        import_stmt = "import { useLanguage } from '../contexts/LanguageContext';\n"
        if "import" in content:
            content = re.sub(r'(import .*;\n)', r'\1' + import_stmt, content, count=1)
        else:
            content = import_stmt + content
    return content

def add_hook(content):
    if "const { t } =" not in content:
        content = re.sub(r'(export function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{)', r'\1\n  const { t } = useLanguage();', content)
    return content

for filepath, replacements in files_to_update.items():
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, not found.")
        continue
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    content = prepend_import(content)
    content = add_hook(content)

    for old, new in replacements:
        # replace in JSX
        content = content.replace(f">{old}<", f">{{{new.strip('{}')}}}<")
        # replace in strings
        content = content.replace(f"\"{old}\"", new.strip("{}"))
        content = content.replace(f"'{old}'", new.strip("{}"))
        # replace bare
        content = content.replace(old, new)
        
    # fix doubly wrapped {}
    content = content.replace("{{t(", "{t(")
    content = content.replace(")}}", ")}")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"Updated {filepath}")
