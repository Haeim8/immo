# BrickChain - Correspondance des Données

## ✅ Données Collectées ↔ Stockées ↔ Affichées

### Vue d'ensemble

Toutes les données collectées dans l'interface admin sont maintenant stockées dans le smart contract et peuvent être affichées aux investisseurs.

---

## 📝 Tableau de Correspondance

| Collecté Admin | Stocké Contrat | Type Rust | Affiché Investisseur | Notes |
|----------------|----------------|-----------|----------------------|-------|
| **Property Name** | `name` | `String (max 64)` | ✅ Nom du bien | - |
| **City** | `city` | `String (max 64)` | ✅ Ville | Séparé de province |
| **Province/Region** | `province` | `String (max 64)` | ✅ Province | Séparé de city |
| **Surface (m²)** | `surface` | `u32` | ✅ Surface | - |
| **Rooms** | `rooms` | `u8` | ✅ Chambres | - |
| **Total Price (USD)** | - | - | ❌ Calculé | = shares × price |
| **Total Shares** | `total_shares` | `u64` | ✅ Nb shares total | - |
| **Price per Share (USD)** | `share_price` | `u64` (lamports) | ✅ Prix share | Converti USD ↔ SOL |
| **Expected Return (%)** | `expected_return` | `u32` | ✅ Rendement | Basis points (550 = 5.50%) |
| **Duration (days)** | `sale_end` | `i64` (timestamp) | ✅ Jours restants | start + duration |
| **Property Type** | `property_type` | `String (max 32)` | ✅ Type | Ex: "Résidentiel" |
| **Year Built** | `year_built` | `u16` | ✅ Année | - |
| **Description** | `description` | `String (max 512)` | ✅ Description | - |
| **Features** | ❌ Metadata | - | ✅ Features | Via `property_contract` |
| **Image URL** | ❌ Metadata | - | ✅ Image | Via `property_contract` |

---

## 🎯 Données Calculées Automatiquement

### Par le Contrat

| Donnée | Calcul | Type |
|--------|--------|------|
| `property_id` | Auto-incrémenté | `u64` |
| `shares_sold` | Incrémenté à chaque achat | `u64` |
| `sale_start` | Timestamp actuel | `i64` |
| `sale_end` | `sale_start + duration` | `i64` |
| `is_active` | `true` par défaut | `bool` |
| `total_dividends_deposited` | Incrémenté lors dépôt | `u64` |
| `total_dividends_claimed` | Incrémenté lors claim | `u64` |

### Par le Frontend

| Donnée Affichée | Calcul |
|-----------------|--------|
| **Shares Available** | `total_shares - shares_sold` |
| **Percentage Funded** | `(shares_sold / total_shares) * 100` |
| **Days Remaining** | `(sale_end - now) / 86400` |
| **Is Expired** | `now > sale_end` |
| **Total Value** | `shares_sold × share_price` |
| **Price in SOL** | `share_price / LAMPORTS_PER_SOL` |

---

## 🔄 Conversions Importantes

### 1. Prix (USD ↔ SOL ↔ Lamports)

```typescript
// Admin collecte: $500 USD per share
// Conversion nécessaire:
const priceInSOL = 500 / solanaPrice; // Ex: 500 / 100 = 5 SOL
const priceInLamports = priceInSOL * LAMPORTS_PER_SOL; // 5 * 1e9
```

**Dans le contrat** : Toujours en lamports (`u64`)
**Dans l'UI** : Afficher en SOL ou USD selon préférence

### 2. Expected Return (Percentage ↔ Basis Points)

```typescript
// Admin collecte: 5.5%
// Conversion:
const basisPoints = 5.5 * 100; // 550

// Affichage:
const percentage = basisPoints / 100; // 5.5%
```

**Pourquoi** : Les basis points permettent une précision entière (pas de float)

### 3. Duration (Days ↔ Seconds)

```typescript
// Admin collecte: 30 days
// Conversion:
const durationInSeconds = 30 * 24 * 60 * 60; // 2,592,000 seconds
```

### 4. Location (Combiné ↔ Séparé)

```typescript
// Avant: location = "Paris, Île-de-France"
// Maintenant:
const city = "Paris";
const province = "Île-de-France";
```

---

## 📦 Données Stockées via Metadata

Pour les données volumineuses ou optionnelles, on utilise `property_contract::add_property_metadata` :

### Images

```rust
add_property_metadata(
    property,
    "image_url",
    "https://images.unsplash.com/photo-123..."
)
```

### Features (Caractéristiques)

```rust
// Option 1: JSON
add_property_metadata(
    property,
    "features",
    "[\"Pool\", \"Garage\", \"Garden\"]"
)

// Option 2: Séparées
add_property_metadata(property, "feature_1", "Pool")
add_property_metadata(property, "feature_2", "Garage")
add_property_metadata(property, "feature_3", "Garden")
```

### Autres Métadonnées Possibles

- `legal_documents_url`
- `virtual_tour_url`
- `floor_plan_url`
- `energy_rating`
- `property_taxes`
- `maintenance_fees`

---

## 🎨 Exemple Complet : Admin → Contrat → UI

### 1. Admin Remplit le Formulaire

```typescript
{
  name: "Résidence Les Jardins",
  city: "Paris",
  province: "Île-de-France",
  surface: 85,
  rooms: 3,
  price: 250000,        // USD total
  shares: 500,
  pricePerShare: 500,   // USD
  expectedReturn: 4.5,  // %
  duration: 30,         // days
  propertyType: "Résidentiel",
  yearBuilt: 2020,
  description: "Appartement moderne...",
  features: "Parking, Balcon, Ascenseur"
}
```

### 2. Frontend Convertit et Envoie au Contrat

```typescript
const solPrice = 100; // $100 per SOL

await createProperty(connection, {
  name: "Résidence Les Jardins",
  city: "Paris",
  province: "Île-de-France",
  totalShares: 500,
  sharePrice: (500 / solPrice) * LAMPORTS_PER_SOL, // 5 SOL en lamports
  saleDuration: 30 * 24 * 60 * 60, // 30 jours en secondes
  surface: 85,
  rooms: 3,
  expectedReturn: 450, // 4.5% en basis points
  propertyType: "Résidentiel",
  yearBuilt: 2020,
  description: "Appartement moderne...",
}, adminPublicKey);

// Puis ajoute les features via metadata
await addPropertyMetadata(
  connection,
  propertyPDA,
  "features",
  JSON.stringify(["Parking", "Balcon", "Ascenseur"]),
  adminPublicKey
);

// Et l'image
await addPropertyMetadata(
  connection,
  propertyPDA,
  "image_url",
  "https://images.unsplash.com/photo-123...",
  adminPublicKey
);
```

### 3. Contrat Stocke les Données

```rust
Property {
    factory: <factory_pubkey>,
    property_id: 0,
    name: "Résidence Les Jardins",
    city: "Paris",
    province: "Île-de-France",
    total_shares: 500,
    share_price: 5_000_000_000, // 5 SOL en lamports
    shares_sold: 0,
    sale_start: 1699123200,
    sale_end: 1701715200, // +30 jours
    is_active: true,
    surface: 85,
    rooms: 3,
    expected_return: 450, // 4.5%
    property_type: "Résidentiel",
    year_built: 2020,
    description: "Appartement moderne...",
    total_dividends_deposited: 0,
    total_dividends_claimed: 0,
    bump: 254,
}
```

### 4. Investisseur Voit l'Affichage

```jsx
<PropertyCard>
  <h3>Résidence Les Jardins</h3>
  <p>Paris, Île-de-France</p>
  <p>85m² • 3 chambres</p>
  <p>Prix: 5 SOL (~$500 USD)</p>
  <p>Rendement: 4.5%</p>
  <p>500 shares • 0 vendus (0%)</p>
  <p>Expire dans: 30 jours</p>
  <p>Type: Résidentiel</p>
  <p>Construit: 2020</p>
  <p>Description: Appartement moderne...</p>
  <p>Features: Parking, Balcon, Ascenseur</p>
  <img src="https://images.unsplash.com/..." />
</PropertyCard>
```

---

## ⚠️ Points Importants

### 1. Taille des Comptes

La structure `Property` est maintenant **~900 bytes** :
- Coût création : ~0.0063 SOL (~$0.63 @ $100/SOL)
- Admin paie ce coût lors de la création

### 2. Validation des Données

Le contrat valide :
- ✅ Longueur des strings
- ✅ Montants > 0
- ✅ Dates cohérentes
- ✅ Droits admin

### 3. Données Manquantes

**Image URL et Features** ne sont PAS dans `Property` car :
- Trop volumineuses (coût prohibitif)
- Optionnelles
- Mieux stockées via metadata ou off-chain

**Solution** : Utiliser `property_contract::add_property_metadata`

---

## 🚀 Prochaines Étapes

1. **Mettre à jour l'interface admin** pour envoyer toutes les données
2. **Créer les fonctions helpers** pour les conversions
3. **Mettre à jour PropertyCard** pour afficher toutes les nouvelles données
4. **Implémenter le stockage des images** via metadata
5. **Tester le flow complet** : Admin → Contrat → UI

---

## 📚 Références

- Structure Property: `programs/real_estate_factory/src/lib.rs:366-392`
- Create Property Function: `programs/real_estate_factory/src/lib.rs:23-80`
- Types TypeScript: `lib/solana/types.ts:17-38`
- Form Admin: `app/admin/page.tsx:250-429`
