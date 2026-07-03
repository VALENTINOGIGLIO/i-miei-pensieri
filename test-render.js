import { renderToString } from 'react-dom/server';
import React from 'react';
import App from './src/App.js';
import { LanguageProvider } from './src/contexts/LanguageContext.js';

try {
  const html = renderToString(React.createElement(LanguageProvider, null, React.createElement(App)));
  console.log("RENDER SUCCESS");
} catch (e) {
  console.error("RENDER ERROR:", e);
}
