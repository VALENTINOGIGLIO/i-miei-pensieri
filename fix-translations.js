const fs = require('fs');

const file = fs.readFileSync('src/lib/translations.ts', 'utf-8');
// To fix the file we need to format it properly.
