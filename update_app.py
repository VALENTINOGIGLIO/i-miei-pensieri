import os

filepath = "src/App.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure we import useLanguage at the top
if "useLanguage" not in content:
    content = "import { useLanguage } from './contexts/LanguageContext';\n" + content

# Since App is a functional component, we can destructure t inside it
if "const { t: tr, langPref, setLangPref } = useLanguage();" in content:
    # Already there, just make sure we also export `t` if needed, but it has `tr`. Let's just change it to `t`.
    content = content.replace("const { t: tr, langPref, setLangPref } = useLanguage();", "const { t, langPref, setLangPref } = useLanguage();")
else:
    # Let's see if we can find it
    content = content.replace("const { t: tr, langPref, setLangPref } = useLanguage();", "const { t, langPref, setLangPref } = useLanguage();")

# Now we replace the strings
replacements = [
    # Top bar
    (">Sblocca<", ">{t('app.unlock')}<"),
    (">Esci<", ">{t('app.logout')}<"),
    ("Avvio dell\\'ambiente sicuro...", "{t('app.booting')}"),

    # Tabs and settings
    (">Impostazioni<", ">{t('app.settings')}<"),
    (">Tema<", ">{t('app.theme')}<"),
    ("Chiaro", "{t('app.light')}"),
    ("Scuro", "{t('app.dark')}"),
    (">Lingua<", ">{t('app.language')}<"),
    (">Automatica<", ">{t('app.autoLanguage')}<"),
    (">Funzioni Aggiuntive<", ">{t('app.additionalFeatures')}<"),
    ("Personalizza la tua esperienza IA", "{t('app.customizeExperience')}"),
    (">Chiave API Gemini<", ">{t('app.apiKey')}<"),
    ("Configurata", "{t('app.configured')}"),
    ("Non configurata", "{t('app.notConfigured')}"),
    (">Sicurezza e Account<", ">{t('app.securityAndAccount')}<"),
    ("Gestisci dati e protezione", "{t('app.manageData')}"),
    (">Esporta Pensieri<", ">{t('app.exportThoughts')}<"),
    ("Scarica un backup locale dei tuoi dati decifrati", "{t('app.downloadBackup')}"),
    ("Zona Pericolosa", "{t('app.dangerZone')}"),
    ("Azioni irreversibili sull\\'account.", "{t('app.irreversibleActions')}"),
    ("Elimina Account e Tutti i Dati", "{t('app.deleteAccountBtn')}"),
    ("Ai sensi del GDPR Art. 17 (diritto all\\'oblio), puoi richiedere la cancellazione completa e irreversibile di tutti i tuoi dati. L\\'operazione è permanente.", "{t('app.gdprNotice')}"),
    
    # Pensieri tab
    (">La tua Mente<", ">{t('app.yourMind')}<"),
    ("title=\"Modalità Panico\"", "title={t('app.panicMode')}"),
    (">Analisi...<", ">{t('app.analyzing')}<"),
    (">Cambia<", ">{t('app.change')}<"),
    ("Non ci sono ancora pensieri registrati. Usa il microfono per iniziare.", "{t('app.noThoughts')}"),
    ("Pergamena a tempo", "{t('app.timeCapsule')}"),

    # Legal warnings
    ("Funzionalità Limitate", "{t('app.limitedFeatures')}"),
    ("Hai rifiutato l\\'Informativa sulla Privacy, pertanto le funzionalità di analisi IA sono state disabilitate.", "{t('app.privacyRejected')}"),
    ("Per riattivarle, devi prima accettare i termini.", "{t('app.acceptTermsToReactivate')}"),
    (">Mostra Termini<", ">{t('app.showTerms')}<"),

    # Translate modal
    ("Traduzione in corso...", "{t('app.translating')}"),
    ("Attendere prego, non chiudere l\\'applicazione.", "{t('app.pleaseWait')}"),
    ("Traduzione Pensieri", "{t('app.translateThoughtsTitle')}"),
    ("Hai cambiato la lingua dell\\'interfaccia. Vuoi tradurre anche tutti i tuoi pensieri passati nella nuova lingua?", "{t('app.translateThoughtsDesc')}"),
    ("Usa Intelligenza Artificiale", "{t('app.useAi')}"),
    ("(Consigliato) Traduzione eccellente. I pensieri verranno inviati temporaneamente a Google Gemini. Richiede l\\'accettazione della Privacy.", "{t('app.useAiDesc')}"),
    ("Usa Traduttore Gratuito", "{t('app.useFreeTranslator')}"),
    ("ATTENZIONE: Si perde la crittografia Zero-Knowledge. I dati verranno inviati a un server di terze parti (MyMemory) per essere tradotti.", "{t('app.useFreeTranslatorDesc')}"),
    ("Lascia in Lingua Originale", "{t('app.leaveOriginal')}"),
    ("I pensieri passati rimarranno invariati.", "{t('app.leaveOriginalDesc')}"),

    # Alerts (we must use backticks or similar for t())
    ("alert(\"Link copiato negli appunti! L\\'app è pronta per essere condivisa.\");", "alert(t('app.linkCopied'));"),
    ("alert(\"Traduzione pensieri completata!\");", "alert(t('app.translationCompleted'));"),
    ("alert(\"Si è verificato un errore durante la traduzione dei pensieri.\");", "alert(t('app.translationError'));"),
]

for old, new in replacements:
    content = content.replace(old, new)

# Special case for template literals
content = content.replace(
    "`Errore durante l'eliminazione: ${err.message}. Se l'errore persiste, esegui di nuovo il login e riprova.`",
    "t('app.deleteError').replace('{{message}}', err.message)"
)

# And fix 'tr' if we renamed it
content = content.replace("tr(", "t(")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated App.tsx")
