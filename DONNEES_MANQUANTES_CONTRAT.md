# Données Supprimées du Frontend (Codées en Dur) - À Fournir par le Contrat

## 📋 Résumé

Ce document liste TOUTES les données que j'ai supprimées du frontend qui étaient codées en dur. Ces données DOIVENT être fournies par le contrat Solana ou un système d'indexation.

---

## 🏠 Page Principale (/)

### ✅ Déjà Fourni par le Contrat
- Liste des propriétés
- Nom, ville, province
- Prix par part
- Nombre total de parts
- Parts vendues
- Progression de financement (%)
- Rendement estimé
- Surface, chambres
- Type de propriété
- Description

### ❌ RIEN de supprimé (déjà connecté au contrat)

---

## 👤 Page Portfolio (/portfolio)

### ✅ Déjà Fourni par le Contrat
- Liste des ShareNFTs de l'utilisateur
- Propriété associée à chaque NFT
- Montant investi (share_price)
- Dividendes réclamés
- Dividendes disponibles (calculé)
- ROI (calculé)

### ❌ RIEN de supprimé (déjà connecté au contrat)

---

## 🔧 Page Admin (/admin)

### ✅ Déjà Fourni par le Contrat

#### Onglet "Overview"
- ✅ Total des propriétés (property_count depuis factory)
- ✅ Valeur totale (somme des properties * share_price)
- ✅ Rendement moyen (moyenne des expected_return)
- ✅ Liste des propriétés récentes

#### Onglet "Properties"
- ✅ Liste complète des propriétés
- ✅ Prix par part
- ✅ Parts vendues / Total
- ✅ Progression de financement
- ✅ Rendement estimé
- ✅ Statut (actif/fermé)

#### Onglet "Create New"
- ✅ Formulaire connecté à create_property()

---

### ❌ DONNÉES SUPPRIMÉES (Codées en Dur)

## 1️⃣ Onglet "Investors" (InvestorsTab)

### Données Supprimées :
```javascript
const investors = [
  {
    address: "0x742d...f0bEb",
    invested: "$245,000",
    properties: 3,
    joined: "2024-01-15"
  },
  {
    address: "0x8f3C...6A063",
    invested: "$189,000",
    properties: 2,
    joined: "2024-02-20"
  },
  {
    address: "0x2791...84174",
    invested: "$145,000",
    properties: 2,
    joined: "2024-03-10"
  },
  {
    address: "0x7ceB...9f619",
    invested: "$98,000",
    properties: 1,
    joined: "2024-03-25"
  },
];
```

### Ce qui doit être fourni :
| Donnée | Source | Comment l'obtenir |
|--------|--------|-------------------|
| **address** | ShareNFT.owner | Grouper tous les ShareNFTs par owner |
| **invested** | ShareNFT + Property | Somme de tous les `share_price` pour chaque owner |
| **properties** | ShareNFT | Nombre de propriétés distinctes par owner |
| **joined** | ShareNFT.mint_time | Date du premier ShareNFT minté par owner |

### Pourquoi c'est Impossible On-Chain :
- Il faudrait parcourir **TOUS** les ShareNFTs de **TOUTES** les propriétés
- Grouper par owner (opération très coûteuse en RPC)
- Calculer des agrégations (sum, count, min)
- **Coût** : Des centaines de requêtes RPC

### Solution : Indexeur
```typescript
// Exemple avec Helius API
const investors = await helius.getInvestorStats({
  programId: FACTORY_PROGRAM_ID,
  groupBy: 'owner',
  aggregate: ['total_invested', 'property_count', 'first_investment']
});
```

---

## 2️⃣ Onglet "Dividends" (DividendsTab)

### Métriques Supprimées :

#### A. Métriques Globales
```javascript
{
  pendingDistribution: "$45,750",
  distributedThisMonth: "$124,500",
  totalDistributed: "$2.45M"
}
```

| Métrique | Source | Comment l'obtenir |
|----------|--------|-------------------|
| **Pending Distribution** | Property.total_dividends_deposited - Property.total_dividends_claimed | Somme sur toutes les propriétés |
| **Distributed This Month** | Property.total_dividends_claimed | Filtrer par timestamp du mois en cours |
| **Total Distributed** | Property.total_dividends_claimed | Somme globale sur toutes les propriétés |

### Pourquoi c'est Impossible On-Chain :
- Pas de filtrage par date on-chain
- Agrégation de plusieurs propriétés (coûteux)
- Pas d'index temporel

#### B. Historique des Distributions
```javascript
[
  {
    property: "Résidence Les Jardins",
    amount: "$8,750",
    date: "2024-11-01",
    investors: 52
  },
  {
    property: "Immeuble Commerce Lyon",
    amount: "$12,450",
    date: "2024-11-01",
    investors: 38
  },
  {
    property: "Résidence Étudiante",
    amount: "$15,600",
    date: "2024-11-01",
    investors: 45
  },
]
```

| Donnée | Source | Comment l'obtenir |
|--------|--------|-------------------|
| **property** | Property.name | Requête par PDA |
| **amount** | Événement deposit_dividends | Écouter les events/transactions |
| **date** | Transaction timestamp | Parser les transactions historiques |
| **investors** | ShareNFT count | Compter les ShareNFTs pour cette property |

### Pourquoi c'est Impossible On-Chain :
- **Pas d'historique stocké** : Les events ne sont pas stockés on-chain
- Il faudrait parser TOUTES les transactions passées
- **Coût** : Des milliers de requêtes pour l'historique complet

---

## 🔍 Données Manquantes - Tableau Complet

| Donnée | Page | Actuellement | Doit Venir De | Complexité |
|--------|------|--------------|---------------|------------|
| **Liste investisseurs** | Admin > Investors | ❌ Supprimée | Indexeur (groupBy owner) | 🔴 Élevée |
| **Total investi par user** | Admin > Investors | ❌ Supprimée | Indexeur (sum share_price) | 🔴 Élevée |
| **Nombre propriétés par user** | Admin > Investors | ❌ Supprimée | Indexeur (count distinct) | 🔴 Élevée |
| **Date inscription user** | Admin > Investors | ❌ Supprimée | Indexeur (min mint_time) | 🔴 Élevée |
| **Dividendes en attente (global)** | Admin > Dividends | ❌ Supprimée | Agrégation properties | 🟡 Moyenne |
| **Dividendes distribués (mois)** | Admin > Dividends | ❌ Supprimée | Parser transactions + filtre date | 🔴 Élevée |
| **Total dividendes distribués** | Admin > Dividends | ❌ Supprimée | Agrégation properties | 🟡 Moyenne |
| **Historique distributions** | Admin > Dividends | ❌ Supprimée | Parser toutes les transactions | 🔴 Élevée |
| **Nombre investisseurs par property** | Admin > Dividends | ❌ Supprimée | Indexeur (count per property) | 🟡 Moyenne |

---

## 💡 Solutions par Type de Donnée

### 🟢 FACILE (Directement depuis le Contrat)
**Déjà fait** : Toutes les données des propriétés individuelles

```typescript
// Exemple : Obtenir une propriété
const property = await program.account.property.fetch(propertyPDA);
```

### 🟡 MOYEN (Agrégation Simple)
**Ce qui peut être calculé** : Sommes globales sans historique

```typescript
// Exemple : Total dividendes disponibles
const properties = await program.account.property.all();
const totalPending = properties.reduce((sum, p) =>
  sum + (p.account.totalDividendsDeposited - p.account.totalDividendsClaimed), 0
);
```

**Problème** : Lent si beaucoup de propriétés (10+ requêtes)

**Solution** : Cache Redis

### 🔴 DIFFICILE (Nécessite Indexeur)
**Ce qui est impossible sans indexeur** :
- Grouper par utilisateur
- Historique des transactions
- Filtres temporels
- Statistiques complexes

---

## 🚀 Architecture Recommandée

### Phase 1 : MVP (Immédiat)
**Objectif** : Afficher les données de base

```
Frontend → RPC Solana → Contrat
```

**Données Disponibles** :
- ✅ Liste des propriétés
- ✅ Détails d'une propriété
- ✅ Parts possédées par un user
- ✅ Dividendes disponibles

**Données Manquantes** :
- ❌ Liste investisseurs
- ❌ Historique distributions
- ❌ Stats globales

### Phase 2 : Cache (Court Terme)
**Objectif** : Améliorer les performances

```
Frontend → Redis Cache → RPC Solana → Contrat
         ↓
    Update toutes les 5min
```

**Implémentation** :
```typescript
// Exemple : Cache des propriétés
const CACHE_KEY = 'properties:all';
const CACHE_TTL = 300; // 5 minutes

async function getAllProperties() {
  // 1. Check cache
  const cached = await redis.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  // 2. Fetch from chain
  const properties = await fetchAllPropertiesFromChain();

  // 3. Store in cache
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(properties));

  return properties;
}
```

**Données Disponibles en Plus** :
- ✅ Total dividendes disponibles (cached)
- ✅ Nombre total investisseurs (cached)

**Toujours Manquant** :
- ❌ Liste détaillée investisseurs
- ❌ Historique complet

### Phase 3 : Indexeur (Long Terme)
**Objectif** : Données complètes et rapides

```
                    ┌─────────────┐
                    │   Helius    │
                    │  (Indexeur) │
                    └──────┬──────┘
                           │ Webhooks
                           ↓
Frontend → API Backend → PostgreSQL
                    ↓
                   Redis Cache
```

**Flow** :
1. **Helius** écoute les transactions du contrat
2. Webhook vers ton backend à chaque event
3. Backend parse et stocke dans **PostgreSQL**
4. Cache dans **Redis** pour la rapidité
5. Frontend interroge ton API

**Toutes les Données Disponibles** :
- ✅ Liste investisseurs (avec stats)
- ✅ Historique complet des distributions
- ✅ Graphiques temporels
- ✅ Recherche/Filtres avancés
- ✅ Stats en temps réel

---

## 📊 Exemple : Implémentation Redis Cache

### Structure du Cache

```typescript
// Cache Keys
const KEYS = {
  PROPERTIES_ALL: 'properties:all',
  PROPERTY_DETAIL: (pda: string) => `property:${pda}`,
  USER_SHARES: (wallet: string) => `user:${wallet}:shares`,
  STATS_GLOBAL: 'stats:global',
};

// Cache des propriétés (5 min)
interface CachedProperty {
  pda: string;
  data: Property;
  lastUpdated: number;
}

// Stats globales (10 min)
interface GlobalStats {
  totalProperties: number;
  totalValueUSD: number;
  totalInvestors: number; // Approximation
  avgReturn: number;
  lastUpdated: number;
}
```

### API Backend avec Cache

```typescript
// GET /api/properties
app.get('/api/properties', async (req, res) => {
  try {
    // 1. Check Redis cache
    const cached = await redis.get(KEYS.PROPERTIES_ALL);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 2. Fetch from Solana RPC
    const connection = new Connection(RPC_URL);
    const provider = new AnchorProvider(connection, wallet, {});
    const program = getProgram(provider);

    const properties = await program.account.property.all();

    // 3. Transform data
    const transformed = properties.map(p => ({
      pda: p.publicKey.toBase58(),
      name: p.account.name,
      city: p.account.city,
      sharePrice: p.account.sharePrice.toNumber(),
      sharesSold: p.account.sharesSold.toNumber(),
      totalShares: p.account.totalShares.toNumber(),
      fundingProgress: (p.account.sharesSold.toNumber() / p.account.totalShares.toNumber()) * 100,
    }));

    // 4. Store in cache (5 min)
    await redis.setex(KEYS.PROPERTIES_ALL, 300, JSON.stringify(transformed));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/global
app.get('/api/stats/global', async (req, res) => {
  try {
    // 1. Check cache
    const cached = await redis.get(KEYS.STATS_GLOBAL);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 2. Calculate from chain
    const properties = await program.account.property.all();

    const stats = {
      totalProperties: properties.length,
      totalValueUSD: properties.reduce((sum, p) => {
        const lamports = p.account.totalShares.toNumber() * p.account.sharePrice.toNumber();
        return sum + (lamports / 1e9) * SOL_PRICE_USD;
      }, 0),
      totalInvestors: 0, // TODO: Nécessite indexeur
      avgReturn: properties.reduce((sum, p) => sum + p.account.expectedReturn, 0) / properties.length / 100,
      lastUpdated: Date.now(),
    };

    // 3. Cache (10 min)
    await redis.setex(KEYS.STATS_GLOBAL, 600, JSON.stringify(stats));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔥 Implémentation Helius (Indexeur)

### 1. Setup Webhook

```typescript
// Helius Webhook Configuration
const webhookConfig = {
  webhookURL: "https://ton-backend.com/api/webhooks/helius",
  transactionTypes: ["ANY"],
  accountAddresses: [FACTORY_PROGRAM_ID],
  webhookType: "enhanced",
};

// Register webhook
const response = await fetch('https://api.helius.xyz/v0/webhooks?api-key=YOUR_KEY', {
  method: 'POST',
  body: JSON.stringify(webhookConfig),
});
```

### 2. Backend Webhook Handler

```typescript
// POST /api/webhooks/helius
app.post('/api/webhooks/helius', async (req, res) => {
  const events = req.body;

  for (const event of events) {
    const { type, description, accounts, timestamp } = event;

    // Parse l'instruction
    if (description === 'buy_share') {
      await db.investors.upsert({
        wallet: accounts.buyer,
        lastPurchase: timestamp,
      });

      await db.transactions.insert({
        type: 'BUY_SHARE',
        property: accounts.property,
        buyer: accounts.buyer,
        amount: event.nativeTransfers[0].amount,
        timestamp,
      });
    }

    if (description === 'deposit_dividends') {
      await db.dividends.insert({
        property: accounts.property,
        amount: event.nativeTransfers[0].amount,
        timestamp,
      });
    }

    if (description === 'claim_dividends') {
      await db.transactions.insert({
        type: 'CLAIM_DIVIDENDS',
        property: accounts.property,
        owner: accounts.owner,
        amount: event.nativeTransfers[0].amount,
        timestamp,
      });
    }
  }

  res.status(200).send('OK');
});
```

### 3. Query API avec Data Indexée

```typescript
// GET /api/investors
app.get('/api/investors', async (req, res) => {
  const investors = await db.query(`
    SELECT
      wallet,
      COUNT(DISTINCT property) as property_count,
      SUM(amount) as total_invested,
      MIN(timestamp) as joined_date
    FROM transactions
    WHERE type = 'BUY_SHARE'
    GROUP BY wallet
    ORDER BY total_invested DESC
  `);

  res.json(investors);
});

// GET /api/dividends/history
app.get('/api/dividends/history', async (req, res) => {
  const history = await db.query(`
    SELECT
      d.property,
      p.name as property_name,
      d.amount,
      d.timestamp,
      COUNT(DISTINCT t.buyer) as investor_count
    FROM dividends d
    JOIN properties p ON p.pda = d.property
    LEFT JOIN transactions t ON t.property = d.property AND t.type = 'BUY_SHARE'
    GROUP BY d.id
    ORDER BY d.timestamp DESC
    LIMIT 10
  `);

  res.json(history);
});
```

---

## 📝 Checklist Implémentation

### Phase 1 : MVP (Maintenant)
- [x] Supprimer les données en dur
- [x] Connecter les propriétés au contrat
- [x] Connecter le portfolio au contrat
- [x] Afficher "No data" pour investors/dividends
- [ ] Déployer et tester sur Devnet

### Phase 2 : Cache Redis (1-2 semaines)
- [ ] Setup Redis (local ou Cloud)
- [ ] API Backend (Node.js/Express)
- [ ] Cache des propriétés (5 min TTL)
- [ ] Cache des stats globales (10 min TTL)
- [ ] Frontend utilise l'API au lieu du RPC direct

### Phase 3 : Indexeur Helius (1 mois)
- [ ] Compte Helius Pro
- [ ] Setup webhook
- [ ] Backend pour recevoir les events
- [ ] PostgreSQL pour stocker l'historique
- [ ] API pour les investors
- [ ] API pour l'historique des dividendes
- [ ] Dashboards complets

---

## 🎯 Résumé Final

### ✅ Ce qui Fonctionne Maintenant (Sans Indexeur)
- Créer des propriétés
- Acheter des parts
- Voir son portfolio
- Réclamer des dividendes
- Stats de base des propriétés

### ❌ Ce qui Manque (Nécessite Indexeur ou Cache)
- **Onglet Investors** : Liste complète avec stats
- **Onglet Dividends** : Historique et métriques globales

### 🚀 Prochaine Étape
**Commence par tester le MVP** : Crée une propriété, achète une part, teste les dividendes. Une fois que ça marche, on ajoute le cache Redis, puis Helius.
