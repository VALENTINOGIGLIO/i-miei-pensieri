#!/bin/bash
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${RED}╔══════════════════════════════════════════════╗${NC}"
echo -e "${RED}║   I Miei Pensieri - UNDEPLOY                  ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════╝${NC}"
echo -e "\n${YELLOW}⚠️  Questo disabiliterà il sito su Firebase Hosting.${NC}"
echo -n "  Sei sicuro? [s/N] "
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
  echo -e "${GREEN}  Operazione annullata.${NC}"
  exit 0
fi
echo -e "\n${YELLOW}🔥 Disabilitazione Firebase Hosting...${NC}"
npx firebase-tools hosting:disable
echo -e "\n${RED}  ❌ Sito disabilitato su Firebase Hosting.${NC}"
echo -e "  Per riabilitarlo, esegui: ${CYAN}bash deploy.sh${NC}"
