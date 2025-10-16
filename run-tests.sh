#!/bin/bash

# 🧪 Script de Test BrickChain
# Ce script lance automatiquement tous les tests Solana

echo "🚀 BrickChain - Test Suite"
echo "=========================="
echo ""

# Ajouter Solana au PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Vérifier que les tools sont disponibles
echo "📋 Vérification des outils..."
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI introuvable"
    echo "Installez Solana : https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor introuvable"
    echo "Installez Anchor : https://www.anchor-lang.com/docs/installation"
    exit 1
fi

echo "✅ Solana CLI $(solana --version)"
echo "✅ Anchor $(anchor --version)"
echo ""

# Build si nécessaire
if [ ! -f "target/deploy/real_estate_factory.so" ]; then
    echo "🔨 Build des contrats..."
    anchor build
    echo ""
fi

# Lancer les tests
echo "🧪 Lancement des tests..."
echo "⏳ Cela peut prendre 2-3 minutes (démarrage du validateur + tests)"
echo ""

anchor test

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ========================================="
    echo "✅  TOUS LES TESTS ONT RÉUSSI !"
    echo "✅ ========================================="
    echo ""
    echo "🎉 Ton contrat est 100% fonctionnel !"
    echo ""
    echo "📝 Prochaines étapes :"
    echo "   1. Déployer sur Devnet : anchor deploy --provider.cluster devnet"
    echo "   2. Tester avec le frontend"
    echo "   3. Déployer sur Mainnet quand prêt"
    echo ""
else
    echo ""
    echo "❌ ========================================="
    echo "❌  CERTAINS TESTS ONT ÉCHOUÉ"
    echo "❌ ========================================="
    echo ""
    echo "📝 Consulte les erreurs ci-dessus"
    echo "💡 Besoin d'aide ? Consulte GUIDE_TESTS.md"
    echo ""
    exit 1
fi
