#!/bin/bash

# Script d'audit de sécurité USCI
# Utilise Slither avec les exclusions appropriées pour les patterns sécurisés

echo "🔒 Audit de sécurité USCI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Compilation
echo "📦 Compilation des contrats..."
npx hardhat compile --quiet

echo ""
echo "🔍 Analyse Slither..."
echo ""

# Lancer Slither avec exclusions des patterns sécurisés et documentés
slither . \
  --hardhat-ignore-compile \
  --filter-paths "node_modules" \
  --exclude timestamp,low-level-calls,divide-before-multiply \
  --print human-summary

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Audit terminé"
echo ""
echo "📋 Patterns exclus (sécurisés et documentés):"
echo "  • timestamp - Utilisé pour deadlines (manipulation ±15s acceptable)"
echo "  • low-level-calls - Protégés par CEI pattern + ReentrancyGuard"
echo "  • divide-before-multiply - Intentionnel pour calcul de remainder"
echo ""
