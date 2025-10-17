#!/bin/bash

# 🚀 Script de vérification complète de l'infrastructure USCI
# Exécute tous les tests d'un coup

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                          ║${NC}"
echo -e "${MAGENTA}║           🚀 USCI - VÉRIFICATION COMPLÈTE 🚀             ║${NC}"
echo -e "${MAGENTA}║                                                          ║${NC}"
echo -e "${MAGENTA}║      Vérification de toute l'infrastructure avant       ║${NC}"
echo -e "${MAGENTA}║            déploiement et tests sur devnet               ║${NC}"
echo -e "${MAGENTA}║                                                          ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_WARNINGS=0

# ===========================================
# 1. TEST IPFS
# ===========================================
echo -e "${CYAN}┌──────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  1/2 - Test de l'intégration IPFS/Pinata                │${NC}"
echo -e "${CYAN}└──────────────────────────────────────────────────────────┘${NC}"
echo ""

if ./scripts/verify-ipfs.sh; then
    IPFS_STATUS="${GREEN}✅ RÉUSSI${NC}"
    IPFS_TESTS=17
    TOTAL_PASSED=$((TOTAL_PASSED + IPFS_TESTS))
else
    IPFS_STATUS="${RED}❌ ÉCHEC${NC}"
    IPFS_TESTS=0
    TOTAL_FAILED=$((TOTAL_FAILED + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 17))

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# ===========================================
# 2. TEST ON-CHAIN
# ===========================================
echo -e "${CYAN}┌──────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  2/2 - Test de l'intégration on-chain Solana            │${NC}"
echo -e "${CYAN}└──────────────────────────────────────────────────────────┘${NC}"
echo ""

if ./scripts/verify-onchain.sh; then
    ONCHAIN_STATUS="${GREEN}✅ RÉUSSI${NC}"
    ONCHAIN_TESTS=31
    TOTAL_PASSED=$((TOTAL_PASSED + ONCHAIN_TESTS))
    TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
else
    ONCHAIN_STATUS="${RED}❌ ÉCHEC${NC}"
    ONCHAIN_TESTS=0
    TOTAL_FAILED=$((TOTAL_FAILED + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 31))

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# ===========================================
# RÉSUMÉ FINAL
# ===========================================
echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                   RÉSUMÉ FINAL                           ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "┌──────────────────────────────────────────────────────────┐"
echo -e "│  ${CYAN}Test IPFS/Pinata${NC}          │ $IPFS_STATUS │ $IPFS_TESTS tests      │"
echo -e "│  ${CYAN}Test on-chain Solana${NC}       │ $ONCHAIN_STATUS │ $ONCHAIN_TESTS tests     │"
echo -e "└──────────────────────────────────────────────────────────┘"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 STATISTIQUES GLOBALES${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✅ Tests réussis   : $TOTAL_PASSED / $TOTAL_TESTS${NC}"
echo -e "  ${RED}❌ Tests échoués   : $TOTAL_FAILED${NC}"
echo -e "  ${YELLOW}⚠️  Avertissements : $TOTAL_WARNINGS${NC}"
echo ""

# ===========================================
# STATUT FINAL
# ===========================================
if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}║          ✅ TOUS LES TESTS SONT PASSÉS ! 🎉              ║${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}║     L'infrastructure est prête pour le déploiement      ║${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📝 Prochaines étapes :${NC}"
    echo "   1. Vérifiez que .env.local contient vos clés"
    echo "   2. Connectez votre wallet admin"
    echo "   3. Créez une propriété depuis /admin"
    echo "   4. Vérifiez l'affichage dans PropertyGrid"
    echo "   5. Testez l'achat d'un share"
    echo ""
    echo -e "${YELLOW}💰 Économies réalisées : Tests effectués sans dépenser de SOL sur devnet${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║          ❌ CERTAINS TESTS ONT ÉCHOUÉ                    ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║     Veuillez corriger les erreurs avant de continuer    ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
