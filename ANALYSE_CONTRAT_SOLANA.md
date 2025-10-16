# Analyse du Contrat Solana Real Estate Factory

## 📍 Localisation du Contrat

Le contrat est écrit en **Rust** (pas Dart!) avec le framework **Anchor** :
- **Fichier principal** : `programs/real_estate_factory/src/lib.rs`
- **Program ID** : `H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL`
- **Framework** : Anchor (Solana)

## 🏗️ Structure du Contrat

### 3 Comptes Principaux

1. **Factory** (Ligne 202+)
   - `admin`: Adresse de l'admin
   - `treasury`: Portefeuille qui reçoit les paiements
   - `property_count`: Nombre de propriétés créées
   - `bump`: Seed PDA

2. **Property** (Ligne 209+)
   - `factory`: Référence à la factory
   - `property_id`: ID unique
   - `name`, `city`, `province`: Localisation
   - `total_shares`: Nombre total de parts
   - `share_price`: Prix par part (en lamports)
   - `shares_sold`: Parts vendues
   - `sale_start`, `sale_end`: Période de vente
   - `is_active`: Statut actif/inactif
   - `surface`, `rooms`, `expected_return`: Détails
   - `property_type`, `year_built`, `description`: Métadonnées
   - `total_dividends_deposited`: Dividendes déposés
   - `total_dividends_claimed`: Dividendes réclamés
   - `bump`: Seed PDA

3. **ShareNFT** (Ligne 234+)
   - `property`: Référence à la propriété
   - `owner`: Propriétaire du NFT
   - `token_id`: ID du token (numéro de part)
   - `mint_time`: Date de création
   - `dividends_claimed`: Dividendes réclamés
   - `bump`: Seed PDA

## 🔧 Fonctions Disponibles

### 1. `initialize(admin: Pubkey)`
**Ligne 11-20**
- Initialise la factory
- Définit l'admin et le treasury
- **Appel unique** : Une seule fois par déploiement
- **Qui peut appeler** : Celui qui paie les frais (payer)

### 2. `create_property(...)`
**Ligne 23-80**
- Crée une nouvelle propriété tokenisée
- **Paramètres** :
  - `name`, `city`, `province`
  - `total_shares`: Nombre de parts
  - `share_price`: Prix en lamports
  - `sale_duration`: Durée de vente (secondes)
  - `surface`, `rooms`, `expected_return`
  - `property_type`, `year_built`, `description`
- **Qui peut appeler** : **Admin uniquement**
- **Validations** :
  - Nom ≤ 64 caractères
  - Ville ≤ 64 caractères
  - Province ≤ 64 caractères
  - Type ≤ 32 caractères
  - Description ≤ 512 caractères
  - Parts > 0, Prix > 0

### 3. `buy_share()`
**Ligne 83-119**
- Achète une part (mint un NFT)
- **Qui peut appeler** : **N'importe qui**
- **Validations** :
  - Vente pas terminée
  - Propriété active
  - Parts disponibles
- **Paiement** : Transfert automatique au treasury
- **Résultat** : Création d'un ShareNFT

### 4. `deposit_dividends(amount: u64)`
**Ligne 122-140**
- Dépose des dividendes pour une propriété
- **Qui peut appeler** : **Admin uniquement**
- **Montant** : En lamports
- **Stockage** : Dans le PDA de la propriété
- **Comptabilité** : Incrémente `total_dividends_deposited`

### 5. `claim_dividends()`
**Ligne 143-199**
- Réclame les dividendes proportionnels
- **Qui peut appeler** : **Propriétaire du ShareNFT**
- **Calcul** :
  ```
  dividends_per_share = total_dividends / shares_sold
  claimable = dividends_per_share - dividends_claimed
  ```
- **Paiement** : Du PDA Property vers le propriétaire
- **Mise à jour** : Incrémente `dividends_claimed`

## ✅ Ce qui EST Couvert par le Contrat

| Fonctionnalité Frontend | Contrat | Status |
|-------------------------|---------|--------|
| Créer une propriété | ✅ `create_property` | OK |
| Lister toutes les propriétés | ✅ Query `Property.all()` | OK |
| Acheter une part | ✅ `buy_share` | OK |
| Voir les parts possédées | ✅ Query `ShareNFT` filtrés | OK |
| Déposer des dividendes (admin) | ✅ `deposit_dividends` | OK |
| Réclamer des dividendes | ✅ `claim_dividends` | OK |
| Prix par part | ✅ `share_price` dans Property | OK |
| Progression de financement | ✅ `shares_sold / total_shares` | OK |
| ROI estimé | ✅ `expected_return` dans Property | OK |

## ❌ Ce qui MANQUE et Nécessite un Indexeur

| Fonctionnalité | Pourquoi c'est Impossible |
|----------------|---------------------------|
| **Liste des investisseurs** | Il faudrait parcourir TOUS les ShareNFTs et grouper par owner (trop coûteux en RPC) |
| **Total investi par utilisateur** | Agrégation nécessaire de plusieurs ShareNFTs |
| **Historique des distributions** | Pas d'événements historiques stockés on-chain |
| **Statistiques globales** | Agrégation de plusieurs propriétés (lent) |
| **Recherche/Filtres avancés** | Pas d'index on-chain |

### Solutions :
1. **Helius/QuickNode** : Indexeur Solana avec webhooks
2. **TheGraph** : Subgraph pour Solana
3. **Redis Cache** : Cache local des données fréquentes
4. **Backend custom** : Écouter les events et maintenir une DB

## 🧪 Tests à Faire

### 1. Test sur Devnet

```bash
# Build le contrat
anchor build

# Déployer sur devnet
anchor deploy --provider.cluster devnet

# Initialiser la factory
anchor run initialize --provider.cluster devnet
```

### 2. Fonctions à Tester

#### Test 1: Créer une Propriété
```typescript
await program.methods
  .createProperty(
    "Villa Test",
    "Paris",
    "Île-de-France",
    new BN(1000), // 1000 parts
    new BN(LAMPORTS_PER_SOL * 0.1), // 0.1 SOL par part
    new BN(30 * 24 * 60 * 60), // 30 jours
    120, // 120m²
    4, // 4 pièces
    550, // 5.50% rendement
    "Résidentiel",
    2020,
    "Belle villa moderne"
  )
  .rpc();
```

#### Test 2: Acheter une Part
```typescript
await program.methods
  .buyShare()
  .accounts({
    property: propertyPDA,
    buyer: wallet.publicKey,
    // ...
  })
  .rpc();
```

#### Test 3: Déposer des Dividendes (Admin)
```typescript
await program.methods
  .depositDividends(new BN(LAMPORTS_PER_SOL * 10)) // 10 SOL
  .accounts({
    property: propertyPDA,
    admin: adminWallet.publicKey,
    // ...
  })
  .rpc();
```

#### Test 4: Réclamer des Dividendes
```typescript
await program.methods
  .claimDividends()
  .accounts({
    shareNft: shareNftPDA,
    owner: wallet.publicKey,
    // ...
  })
  .rpc();
```

### 3. Script de Test Complet

Le fichier `tests/real_estate_factory.ts` contient déjà les tests. Lance :

```bash
anchor test --skip-deploy --provider.cluster devnet
```

## 🔐 Sécurité

### Points Forts ✅
- **Admin check** : Seul l'admin peut créer des propriétés
- **Payment atomique** : Les SOL vont directement au treasury
- **Math safe** : Utilise `checked_*` pour éviter les overflows
- **Ownership check** : Vérifie que le claimer possède le NFT

### Points d'Attention ⚠️
- **Pas de timelock** : L'admin peut déposer/retirer n'importe quand
- **Pas de multi-sig** : Un seul admin (risque de perte de clé)
- **Pas de pause** : Impossible d'arrêter les ventes en urgence
- **Dividends calculation** : Division entière (perte de précision si petits montants)

## 📊 Mapping Frontend ↔ Contrat

### Page Principale (Liste Properties)
```typescript
// Frontend
const { properties } = useAllProperties();

// Contrat
program.account.property.all()
```

### Page Property Detail
```typescript
// Frontend
const property = await fetchProperty(propertyPDA);

// Contrat
program.account.property.fetch(propertyPDA)
```

### Acheter une Part
```typescript
// Frontend
await buyPropertyShare(propertyPDA);

// Contrat
program.methods.buyShare()
  .accounts({ property, buyer, treasury, ... })
  .rpc()
```

### Portfolio Utilisateur
```typescript
// Frontend
const { shareNFTs } = useUserShareNFTs();

// Contrat
program.account.shareNft.all([
  { memcmp: { offset: 40, bytes: wallet.toBase58() }}
])
```

### Admin - Créer Propriété
```typescript
// Frontend
await createNewProperty(params);

// Contrat
program.methods.createProperty(...)
  .accounts({ factory, property, admin, ... })
  .rpc()
```

### Admin - Déposer Dividendes
```typescript
// Frontend
await depositPropertyDividends(propertyPDA, amount);

// Contrat
program.methods.depositDividends(new BN(amount))
  .accounts({ property, admin, ... })
  .rpc()
```

## 🚀 Prochaines Étapes

### 1. Déploiement Devnet
```bash
# 1. Build
anchor build

# 2. Deploy
anchor deploy --provider.cluster devnet

# 3. Copier le nouveau Program ID
# 4. Mettre à jour lib.rs ligne 4
# 5. Rebuild
anchor build

# 6. Redeploy
anchor deploy --provider.cluster devnet

# 7. Initialiser
anchor run initialize --provider.cluster devnet
```

### 2. Tests Manuels
- Créer 2-3 propriétés test
- Acheter des parts avec différents wallets
- Déposer des dividendes
- Réclamer les dividendes

### 3. Vérifier le Frontend
- Lancer `yarn dev`
- Connecter wallet Phantom (Devnet)
- Tester chaque page

### 4. Optimisations Futures
- **Indexeur Helius** : Pour les stats globales
- **Redis Cache** : Cache 5min des propriétés
- **WebSocket** : Updates en temps réel
- **IPFS** : Images des propriétés

## 📝 Commandes Utiles

```bash
# Voir les logs du contrat
solana logs <PROGRAM_ID> --url devnet

# Vérifier le solde d'un compte
solana balance <ADDRESS> --url devnet

# Voir un compte Property
anchor account property <PDA> --provider.cluster devnet

# Voir un compte ShareNFT
anchor account shareNft <PDA> --provider.cluster devnet

# Lister toutes les properties
# (Nécessite un script custom ou Helius API)
```

## 🐛 Debug Checklist

Si ça ne marche pas :

1. ✅ Le contrat est déployé sur devnet ?
2. ✅ Le Program ID correspond dans `lib.rs` et `Anchor.toml` ?
3. ✅ La factory est initialisée ?
4. ✅ Le wallet est sur Devnet (pas Mainnet) ?
5. ✅ Le wallet a des SOL Devnet ? (https://faucet.solana.com)
6. ✅ Le `.env.local` a le bon RPC endpoint ?
7. ✅ Les PDAs sont calculés correctement ?

## 💡 Résumé

**Ton contrat est COMPLET** pour les fonctionnalités principales :
- ✅ Création de propriétés
- ✅ Achat de parts (NFT)
- ✅ Distribution de dividendes
- ✅ Réclamation de dividendes

**Ce qui manque pour ton admin dashboard** :
- ❌ Liste des investisseurs (nécessite indexeur)
- ❌ Historique des transactions (nécessite indexeur)
- ❌ Stats agrégées (nécessite cache/indexeur)

**Solution immédiate** : Commence par déployer et tester les fonctions de base. Les stats avancées viendront avec un indexeur plus tard.
