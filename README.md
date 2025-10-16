# USCI - Tokenized Real Estate Investment

## Description

Next.js application for tokenized real estate investment. This MVP features a modern interface to view and invest in blockchain-tokenized properties.

## Fonctionnalités

### ✅ Implémentées

- **Header avec:**
  - Nom du projet (SCPI Token)
  - Bouton Connect Wallet
  - Sélecteur de réseau blockchain (Ethereum, Polygon, BSC, Arbitrum)
  - Sélecteur de langue (FR, EN, ES)
  - Toggle mode clair/sombre
  - Bouton paramètres
  - Menu Portfolio (sidebar)

- **Hero Section avec métriques:**
  - Nombre de projets financés
  - Dividendes distribués
  - Investisseurs actifs
  - Lien vers l'explorateur blockchain

- **Cards d'investissement:**
  - Image du bien
  - Prix en USD
  - Localisation (ville, province)
  - Valeur estimée
  - Rendement attendu
  - Progression du financement
  - Modal "Voir Plus" avec toutes les informations détaillées

- **Portfolio Sidebar:**
  - Onglet Home avec résumé des investissements
  - Onglet Dividendes pour réclamer les revenus
  - Liste des investissements passés
  - Métriques du portfolio

- **Page Paramètres:**
  - Configuration de l'apparence (thème)
  - Sélection de la langue
  - Gestion des notifications
  - Paramètres email
  - Sécurité et wallet

### 🎨 Design

- **Mode Jour et Nuit** avec switch automatique
- **Couleurs:** Blanc et bleu turquoise / Noir satin et bleu turquoise
- **UI Components:** shadcn/ui pour une interface moderne et responsive
- **Inspiration:** Interface avancée type Hyperliquid

## Installation

### Prérequis

- Node.js 18+
- Yarn (npm n'est pas utilisé dans ce projet)

### Commandes

```bash
# Installer les dépendances (déjà fait)
yarn install

# Lancer le serveur de développement
yarn dev

# Build pour la production
yarn build

# Démarrer en production
yarn start
```

L'application sera accessible sur http://localhost:3000

## Structure du Projet

```
immo/
├── app/
│   ├── globals.css          # Styles globaux avec Tailwind
│   ├── layout.tsx            # Layout principal avec ThemeProvider
│   ├── page.tsx              # Page d'accueil
│   └── settings/
│       └── page.tsx          # Page paramètres
├── components/
│   ├── ui/                   # Composants UI shadcn
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── sheet.tsx
│   ├── header.tsx            # Header principal
│   ├── hero.tsx              # Section hero avec métriques
│   ├── investment-card.tsx   # Card d'investissement avec modal
│   ├── investment-grid.tsx   # Grille des investissements
│   ├── portfolio-sidebar.tsx # Sidebar du portfolio
│   ├── theme-provider.tsx    # Provider pour les thèmes
│   └── theme-toggle.tsx      # Bouton toggle thème
├── lib/
│   ├── utils.ts              # Utilitaires (cn pour Tailwind)
│   └── mock-data.ts          # Données de démonstration
└── package.json
```

## Technologies Utilisées

- **Framework:** Next.js 15 (App Router)
- **Langage:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui + Radix UI
- **Icons:** Lucide React
- **Thèmes:** next-themes
- **Package Manager:** Yarn 4

## Données de Démonstration

Le projet utilise des données mockées pour la démonstration:

- 4 propriétés d'investissement (Paris, Lyon, Nice, Bordeaux)
- Portfolio avec 2 investissements
- Métriques globales de la plateforme
- Historique de dividendes

## Prochaines Étapes

Pour transformer ce MVP en application production:

1. **Intégration Web3:**
   - Connecter un vrai wallet (MetaMask, WalletConnect)
   - Intégrer les smart contracts
   - Gestion des transactions blockchain

2. **Backend:**
   - API pour les données immobilières
   - Base de données (PostgreSQL, MongoDB)
   - Authentification utilisateur

3. **Fonctionnalités:**
   - Processus d'investissement réel
   - KYC/AML
   - Paiements fiat et crypto
   - Documents légaux

4. **Optimisations:**
   - SEO
   - Performance
   - Analytics
   - Tests (Jest, Playwright)

## License

MIT
