#!/bin/bash
set -e

echo "🚀 Avvio build Web e Deploy su Firebase..."

echo "📦 1/2 - Build Web (Vite)..."
npm run build

echo "🔥 2/2 - Deploy su Firebase Hosting..."
npx firebase-tools deploy --only hosting

echo "✅ Tutto completato con successo!"
