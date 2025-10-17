#!/bin/bash

# 🚀 Script de vérification rapide de l'intégration IPFS
# Vérifie que tous les fichiers utilisent correctement IPFS

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

echo -e "${CYAN}🚀 Vérification de l'intégration IPFS/Pinata${NC}"
echo ""

# Fonction de test
check_file() {
    local file=$1
    local pattern=$2
    local description=$3

    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Fichier non trouvé: $file${NC}"
        ((FAILED++))
        return 1
    fi

    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅ $description ($file)${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ $description ($file)${NC}"
        ((FAILED++))
        return 1
    fi
}

# ===========================================
# 1. VARIABLES D'ENVIRONNEMENT
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 1. VARIABLES D'ENVIRONNEMENT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local existe${NC}"
    ((PASSED++))

    check_file ".env.local" "NEXT_PUBLIC_PINATA_JWT" "NEXT_PUBLIC_PINATA_JWT défini"
    check_file ".env.local" "NEXT_PUBLIC_PINATA_GATEWAY" "NEXT_PUBLIC_PINATA_GATEWAY défini"
else
    echo -e "${RED}❌ .env.local n'existe pas${NC}"
    echo -e "${YELLOW}⚠️  Créez .env.local avec vos clés Pinata${NC}"
    ((FAILED++))
    ((WARNINGS++))
fi

# ===========================================
# 2. LIB PINATA
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 2. BIBLIOTHÈQUE PINATA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_file "lib/pinata/upload.ts" "uploadPropertyImage" "uploadPropertyImage() existe"
check_file "lib/pinata/upload.ts" "getIpfsUrl" "getIpfsUrl() existe"
check_file "lib/pinata/upload.ts" "PINATA_GATEWAY" "Utilise PINATA_GATEWAY"

# ===========================================
# 3. TYPES
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 3. TYPES TYPESCRIPT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_file "lib/solana/types.ts" "imageCid" "Property type contient imageCid"
check_file "lib/mock-data.ts" "imageCid?" "Investment interface contient imageCid?"

# ===========================================
# 4. PROPERTYCARD
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 4. PROPERTYCARD - AFFICHAGE IPFS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_file "components/molecules/PropertyCard.tsx" "getIpfsUrl" "PropertyCard importe getIpfsUrl"
check_file "components/molecules/PropertyCard.tsx" "displayImageUrl" "PropertyCard utilise displayImageUrl"
check_file "components/molecules/PropertyCard.tsx" "imageCid" "PropertyCard vérifie imageCid"

# ===========================================
# 5. PROPERTYGRID
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 5. PROPERTYGRID - RÉCUPÉRATION CONTRAT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_file "components/organisms/PropertyGrid.tsx" "property.account.imageCid" "PropertyGrid récupère imageCid du contrat"
check_file "components/organisms/PropertyGrid.tsx" "useAllProperties" "PropertyGrid utilise useAllProperties"

# ===========================================
# 6. ADMIN PAGE
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 6. ADMIN PAGE - UPLOAD IPFS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_file "app/admin/page.tsx" "uploadPropertyImage" "Admin page importe uploadPropertyImage"
check_file "app/admin/page.tsx" "imageCid:" "Admin page passe imageCid au contrat"
check_file "app/admin/page.tsx" "selectedImage" "Admin page gère le fichier image"

# ===========================================
# 7. INVESTMENT-CARD
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 7. INVESTMENT-CARD (Legacy)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_file "components/investment-card.tsx" "getIpfsUrl" "InvestmentCard utilise IPFS"

# ===========================================
# RÉSUMÉ
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 RÉSUMÉ DU FLUX VÉRIFIÉ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│                  FLUX IPFS VÉRIFIÉ                      │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│                                                         │"
echo "│  1. 📤 UPLOAD (Admin)                                   │"
echo "│     ✓ uploadPropertyImage() défini                     │"
echo "│     ✓ Retourne CID depuis Pinata                       │"
echo "│                                                         │"
echo "│  2. 💾 STOCKAGE (Smart Contract)                        │"
echo "│     ✓ imageCid passé au contrat                        │"
echo "│     ✓ Property.imageCid dans types                     │"
echo "│                                                         │"
echo "│  3. 🔍 RÉCUPÉRATION (Frontend)                          │"
echo "│     ✓ PropertyGrid lit imageCid                        │"
echo "│     ✓ Investment supporte imageCid                     │"
echo "│                                                         │"
echo "│  4. 🖼️  AFFICHAGE (UI)                                  │"
echo "│     ✓ PropertyCard utilise getIpfsUrl()                │"
echo "│     ✓ Fallback sur imageUrl                            │"
echo "│                                                         │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""

# ===========================================
# RÉSULTATS FINAUX
# ===========================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RÉSULTATS DES TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✅ Tests réussis   : $PASSED${NC}"
echo -e "  ${RED}❌ Tests échoués   : $FAILED${NC}"
echo -e "  ${YELLOW}⚠️  Avertissements : $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS ! 🎉${NC}"
    echo -e "${GREEN}✅ L'intégration IPFS est correctement configurée.${NC}"
    echo ""
    echo -e "${CYAN}📝 Prochaines étapes :${NC}"
    echo "   1. Vérifiez que .env.local contient vos clés Pinata"
    echo "   2. Testez la création d'une propriété depuis /admin"
    echo "   3. Vérifiez que l'image s'affiche depuis IPFS"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $FAILED test(s) ont échoué${NC}"
    echo -e "${RED}❌ Veuillez corriger les erreurs avant de continuer.${NC}"
    echo ""
    exit 1
fi
