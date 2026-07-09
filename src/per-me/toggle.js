const fs = require('fs');
const path = require('path');

const flagsPath = path.join(__dirname, '../lib/featureFlags.ts');
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Uso: node toggle.js <feature> <true|false>");
  console.log("Feature disponibili: microphone, thoughtList, analysis, readingAdvice");
  process.exit(1);
}

const feature = args[0];
const value = args[1] === 'true';

if (!fs.existsSync(flagsPath)) {
  console.error("Errore: featureFlags.ts non trovato.");
  process.exit(1);
}

let content = fs.readFileSync(flagsPath, 'utf8');

// regex per sostituire il flag booleano
const regex = new RegExp(`(${feature}:\\s*)(true|false)`, 'g');
if (!regex.test(content)) {
  console.error(`Errore: la feature "${feature}" non esiste in featureFlags.ts.`);
  process.exit(1);
}

content = content.replace(regex, `$1${value}`);
fs.writeFileSync(flagsPath, content, 'utf8');
console.log(`✅ Stato aggiornato: ${feature} = ${value}`);
