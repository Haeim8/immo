#!/bin/bash

# Script de génération du rapport PDF professionnel

echo "📄 Génération du rapport PDF professionnel USCI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier si pandoc est installé
if ! command -v pandoc &> /dev/null; then
    echo "⚠️  Pandoc n'est pas installé. Installation..."
    echo ""
    echo "Sur macOS, installez avec:"
    echo "  brew install pandoc"
    echo ""
    echo "Sur Linux:"
    echo "  sudo apt-get install pandoc"
    echo ""
    exit 1
fi

# Vérifier si wkhtmltopdf est installé (pour PDF)
if ! command -v wkhtmltopdf &> /dev/null; then
    echo "⚠️  wkhtmltopdf n'est pas installé. Installation..."
    echo ""
    echo "Sur macOS:"
    echo "  brew install --cask wkhtmltopdf"
    echo ""
    echo "Sur Linux:"
    echo "  sudo apt-get install wkhtmltopdf"
    echo ""
    exit 1
fi

# Créer le répertoire reports s'il n'existe pas
mkdir -p reports

# Date du rapport
DATE=$(date +"%Y-%m-%d")

# Générer le PDF
echo "📝 Génération du PDF..."
pandoc SECURITY_AUDIT.md \
    -o "reports/USCI_Security_Audit_${DATE}.pdf" \
    --pdf-engine=wkhtmltopdf \
    --metadata title="USCI Security Audit Report" \
    --metadata author="USCI Team" \
    --metadata date="${DATE}" \
    --toc \
    --toc-depth=2 \
    -V geometry:margin=1in \
    -V fontsize=11pt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rapport PDF généré avec succès !"
    echo "📍 Emplacement: reports/USCI_Security_Audit_${DATE}.pdf"
    echo ""

    # Ouvrir le PDF
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "reports/USCI_Security_Audit_${DATE}.pdf"
    else
        xdg-open "reports/USCI_Security_Audit_${DATE}.pdf" 2>/dev/null
    fi
else
    echo ""
    echo "❌ Erreur lors de la génération du PDF"
    echo ""
    echo "💡 Solution alternative: Utiliser un convertisseur en ligne"
    echo "   1. Ouvrez SECURITY_AUDIT.md"
    echo "   2. Allez sur https://www.markdowntopdf.com/"
    echo "   3. Collez le contenu et téléchargez le PDF"
    echo ""
fi
