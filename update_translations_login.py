import re

with open("src/lib/translations.ts", "r", encoding="utf-8") as f:
    content = f.read()

it_strings = """
    // --- Login & Landing ---
    loginTitle: 'Accedi',
    loginDesc: 'I tuoi pensieri saranno salvati in modo sicuro e crittografato sul cloud. Nessuno, tranne te, potrà leggerli.',
    loginButton: 'Accedi con Google',
    loginErrorToken: 'Nessun ID token ricevuto da Google',
    loginError: 'Errore accesso: ',
"""

en_strings = """
    // --- Login & Landing ---
    loginTitle: 'Login',
    loginDesc: 'Your thoughts will be saved securely and encrypted in the cloud. No one but you will be able to read them.',
    loginButton: 'Sign in with Google',
    loginErrorToken: 'No ID token received from Google',
    loginError: 'Login error: ',
"""

content = re.sub(r'(languageEn: \'English\',)', r'\1\n' + it_strings, content, count=1)
content = re.sub(r'(languageEn: \'English\',\s*})', r'\1\n' + en_strings, content, count=1)

with open("src/lib/translations.ts", "w", encoding="utf-8") as f:
    f.write(content)
