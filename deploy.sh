#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKIP_PREVIEW="${SKIP_PREVIEW:-false}"

# ─── Colori ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   I Miei Pensieri - Deploy Pipeline          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"

# ─── 0. Backup automatico LIFO (Disabilitato temporaneamente) ─────────────────
# echo -e "\n${YELLOW}🗄️  0/3 - Backup automatico (LIFO, max 5)...${NC}"
# if command -v python3 &> /dev/null; then
#   python3 "$PROJECT_DIR/manage_backups.py"
# else
#   echo "  ⚠️  Python3 non trovato, backup saltato."
# fi

# ─── 1. Build ──────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}📦 1/3 - Build Web (Vite)...${NC}"
npm run build
echo -e "${GREEN}  ✅ Build completata.${NC}"

# ─── 2. Preview locale (a meno che SKIP_PREVIEW=true) ─────────────────────────
if [ "$SKIP_PREVIEW" != "true" ]; then
  echo -e "\n${YELLOW}🔍 2/3 - Avvio anteprima locale...${NC}"
  echo -e "${CYAN}  → Apri nel browser: http://localhost:4173${NC}"
  echo -e "${CYAN}  → Premi CTRL+C quando hai finito di controllare.${NC}"
  echo -e "${CYAN}  → Poi ti verrà chiesto se vuoi procedere con il deploy.${NC}\n"
  
  # Avvia vite preview in background
  npx vite preview --port 4173 &
  PREVIEW_PID=$!
  
  # Aspetta input utente
  echo -n "  Hai controllato? Vuoi procedere con il deploy su Firebase? [s/N] "
  read -r CONFIRM
  
  # Termina il server di preview
  kill $PREVIEW_PID 2>/dev/null || true
  wait $PREVIEW_PID 2>/dev/null || true
  echo -e "  Preview chiusa."
  
  if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "\n${RED}  ❌ Deploy annullato. Il backup è stato salvato comunque.${NC}"
    exit 0
  fi
else
  echo -e "\n${YELLOW}  (Preview saltata: SKIP_PREVIEW=true)${NC}"
fi

# ─── 3. Deploy su Firebase ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}🔥 3/3 - Deploy su Firebase...${NC}"
npx firebase-tools deploy --only hosting,firestore:rules --non-interactive
echo -e "\n${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Tutto completato con successo!           ║${NC}"
echo -e "${GREEN}║   🌍 https://i-miei-pensieri.web.app          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
