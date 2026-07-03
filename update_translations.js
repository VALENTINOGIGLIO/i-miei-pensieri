const fs = require('fs');

const data = fs.readFileSync('src/lib/translations.ts', 'utf8');

// We'll replace `en: {}` with a copy of the italian keys but roughly translated or at least duplicated so they don't break
let itMatch = data.match(/it:\s*\{([\s\S]*?)\},\s*en:\s*\{/);
if (itMatch) {
  let itContent = itMatch[1];
  // Simple regex replacements for EN
  let enContent = itContent
    .replace(/"app.booting":.*/g, '"app.booting": "Starting secure environment...",')
    .replace(/"app.unlock":.*/g, '"app.unlock": "Unlock",')
    .replace(/"app.logout":.*/g, '"app.logout": "Logout",')
    .replace(/"app.yourMind":.*/g, '"app.yourMind": "Your Mind",')
    .replace(/"app.panicMode":.*/g, '"app.panicMode": "Panic Mode",')
    .replace(/"app.analyzing":.*/g, '"app.analyzing": "Analyzing...",')
    .replace(/"app.change":.*/g, '"app.change": "Change",')
    .replace(/"app.noThoughts":.*/g, '"app.noThoughts": "No thoughts recorded yet. Use the microphone to start.",')
    .replace(/"app.settings":.*/g, '"app.settings": "Settings",')
    .replace(/"app.language":.*/g, '"app.language": "Language",')
    .replace(/"app.theme":.*/g, '"app.theme": "Theme",')
    .replace(/"features.aiAnalysis":.*/g, '"features.aiAnalysis": "AI Psychological Analysis",')
    .replace(/"password.vault":.*/g, '"password.vault": "Vault",');
    
  const newData = data.replace(/en:\s*\{[^}]*\}/, `en: {\n${enContent}\n  }`);
  fs.writeFileSync('src/lib/translations.ts', newData);
  console.log("Translations updated");
}
