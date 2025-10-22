# 📋 Liste des Fonctionnalités à Implémenter

## 🔴 Priorité Haute

### 1. Indicateur de Marché Secondaire pour les Investisseurs
**Problème**: Impossible de détecter si un NFT a été acheté sur OpenSea/Magic Eden
**Solution**:
- Option A: Modifier le smart contract Anchor pour ajouter `original_minter: Pubkey` dans `ShareNFT`
- Option B: Tracker les événements de transfert via les logs de transactions Solana
- Option C: Créer un mapping on-chain des premiers acheteurs

**Fichiers à modifier**:
- Smart contract Anchor: `programs/real_estate_factory/src/lib.rs`
- Frontend: `lib/solana/hooks.ts` (useAllInvestors)
- Admin panel: `app/admin/page.tsx` (InvestorsTab)

### 2. Tab Gouvernance dans Portfolio
**Problème**: Les propositions de vote n'apparaissent pas dans `/portfolio`
**Solution**: Créer un onglet "Governance" dans la page portfolio pour afficher:
- Les propositions actives pour les propriétés où l'utilisateur possède des shares
- Status des votes: En cours / Terminé / Exécuté
- Bouton pour voter (si non voté)
- Résultats du vote

**Fichiers à créer/modifier**:
- `app/portfolio/page.tsx`: Ajouter un onglet Governance
- `components/organisms/GovernanceTab.tsx`: Nouveau composant pour afficher les propositions
- `lib/solana/hooks.ts`: Créer `useUserGovernanceProposals()`

### 3. Erreur 429 CoinGecko API (Rate Limiting)
**Problème**: Trop de requêtes à l'API CoinGecko (429 Too Many Requests)
**Solution**:
- ✅ Déjà implémenté: Cache de 5 minutes + localStorage
- À améliorer: Utiliser un seul appel global plutôt que plusieurs instances
- Alternative: Utiliser l'API Jupiter/Pyth pour le prix SOL

**Fichiers à modifier**:
- `lib/solana/useSolPrice.ts`: Améliorer le système de cache global

---

## 🟡 Priorité Moyenne

### 4. Page de Détails de Propriété Complète
**Problème**: Le bouton "View Details" ouvre juste Solana Explorer
**Solution**: Créer une vraie page `/property/[id]` avec:
- Toutes les informations de la propriété
- Galerie d'images (IPFS)
- Métadonnées complètes
- Historique des dividendes distribués
- Liste des holders (avec graphique de distribution)
- Propositions de gouvernance liées
- Bouton d'achat de shares

**Fichiers à créer**:
- `app/property/[id]/page.tsx`
- `components/organisms/PropertyDetails.tsx`
- `components/molecules/PropertyGallery.tsx`
- `components/molecules/HoldersList.tsx`

### 5. Système de Notifications
**Solution**: Ajouter des notifications pour:
- Nouveau dividende disponible
- Nouvelle proposition de vote
- Propriété liquidée
- Share vendu avec succès

**Fichiers à créer**:
- `components/molecules/NotificationBell.tsx`
- `lib/notifications/useNotifications.ts`
- Backend: Service worker pour les push notifications

### 6. Dashboard Analytics Avancé
**Solution**: Ajouter dans le panel admin:
- Graphiques de croissance (Chart.js ou Recharts)
- Timeline des événements
- Export CSV des données
- ROI par propriété
- Taux de conversion investors

**Fichiers à créer**:
- `components/organisms/AnalyticsDashboard.tsx`
- `lib/analytics/calculations.ts`

---

## 🟢 Priorité Basse

### 7. Recherche et Filtres Avancés dans Admin
**Solution**: Ajouter dans toutes les tabs:
- Barre de recherche
- Filtres multiples (date, status, montant)
- Tri par colonne
- Export des résultats

### 8. Intégration Wallet Mobile (Deep Links)
**Solution**:
- ✅ `@solana-mobile/wallet-adapter-mobile` déjà ajouté
- À tester: Deep links sur mobile Safari/Chrome
- Configuration des URI schemes

### 9. Mode Multilingue Complet
**Solution**: Traduire tous les textes
- ✅ FR/EN/ES partiellement fait
- À compléter: Tous les messages d'erreur
- À compléter: Toutes les interfaces admin

### 10. Tests Automatisés
**Solution**: Ajouter des tests
- Tests unitaires: Jest
- Tests d'intégration: Anchor tests
- Tests E2E: Playwright

**Fichiers à créer**:
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

---

## 🔧 Améliorations Techniques

### 11. Optimisation des Requêtes Blockchain
**Problème**: Trop d'appels RPC
**Solution**:
- Utiliser `getProgramAccounts` avec filtres memcmp
- Implémenter un cache Redis côté serveur
- Utiliser WebSockets pour les mises à jour en temps réel

### 12. Gestion des Erreurs Améliorée
**Solution**:
- Toast notifications au lieu de simples console.error
- Retry automatique pour les transactions échouées
- Logging centralisé (Sentry)

### 13. SEO et Métadonnées
**Solution**:
- Ajouter les métadonnées OpenGraph
- Générer un sitemap.xml
- Optimiser les images (next/image)
- Ajouter structured data (JSON-LD)

### 14. Sécurité
**Solution**:
- Rate limiting sur les actions sensibles
- CSRF protection
- Content Security Policy
- Audit des smart contracts

---

## 📱 Fonctionnalités Futures (Nice to Have)

### 15. Marketplace Secondaire Intégré
- Permettre aux utilisateurs de vendre leurs shares directement sur la plateforme
- Ordre book on-chain
- Frais de transaction

### 16. Système de Staking
- Staker ses shares pour obtenir des rewards supplémentaires
- Lockup periods
- APY dynamique

### 17. Programme de Référence
- Code de parrainage
- Rewards en tokens pour les parrains
- Dashboard de tracking

### 18. DAO Complète
- Trésorerie communautaire
- Propositions de features
- Votes pondérés par shares

### 19. Support Multi-Réseaux
- Ethereum (via bridge)
- Polygon
- Arbitrum

### 20. Application Mobile Native
- React Native
- Wallet mobile intégré
- Push notifications natives

---

## 🐛 Bugs Connus à Corriger

1. ✅ ~~Erreur "Account teamMember not provided"~~ → CORRIGÉ
2. ✅ ~~Erreur "encoding overruns Buffer" lors de l'achat~~ → CORRIGÉ
3. ✅ ~~Images Pinata non autorisées~~ → CORRIGÉ
4. ✅ ~~Bouton "View Details" ne fait rien~~ → CORRIGÉ
5. ✅ ~~Distribution dividendes sans sélecteur~~ → CORRIGÉ
6. ✅ ~~Tab Investors vide~~ → CORRIGÉ
7. 🔴 Erreur 429 CoinGecko API → À OPTIMISER
8. 🔴 Governance: Propositions n'apparaissent pas dans Portfolio → À IMPLÉMENTER

---

## 📝 Notes Importantes

- Le projet utilise Next.js 15.5.6 avec App Router
- Smart contracts déployés sur Solana Devnet
- Utilise Anchor framework v0.30.1
- Pinata pour IPFS (images et métadonnées)
- Wallet Adapter pour la connexion Solana

**Dernière mise à jour**: 2025-10-22
