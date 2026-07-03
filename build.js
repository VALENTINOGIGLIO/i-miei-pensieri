import fs from 'fs';
import * as esbuild from 'esbuild';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
const env = dotenv.config({ path: '.env' }).parsed || {};
const define = {};
for (const k in env) {
  define[`import.meta.env.${k}`] = JSON.stringify(env[k]);
}

// Ensure dir exists
if (!fs.existsSync('dist/assets')) {
  fs.mkdirSync('dist/assets', { recursive: true });
}

// Build with esbuild
esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/assets/index.js',
  minify: true,
  format: 'esm',
  define: define,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts'
  }
}).then(() => {
  console.log('JS Built.');
  
  // Modify and copy index.html
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace('/src/main.tsx', '/assets/index.js');
  html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/index.css">\n  </head>');
  fs.writeFileSync('dist/index.html', html);
  console.log('HTML and public assets copied.');
}).catch(() => process.exit(1));
