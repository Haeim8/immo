# 🖼️ Guide de Stockage d'Images pour BrickChain

## 🎯 Objectif
Stocker les **images des propriétés** de manière **permanente et décentralisée**, avec les **métadonnées on-chain**.

---

## 📊 COMPARAISON DES OPTIONS

| Méthode | Coût | Décentralisé | Permanent | On-Chain | Recommandé |
|---------|------|--------------|-----------|----------|------------|
| **Arweave + Metaplex** | 0.01 SOL/image | ✅ Oui | ✅ Permanent | ⚠️ Métadonnées seulement | ✅ **OUI** |
| **Shadow Drive** | 0.005 SOL/MB | ✅ Solana network | ✅ Tant que payé | ❌ Non | ⚠️ Alternative |
| **Direct On-Chain** | 0.7 SOL/image | ✅ Oui | ✅ Permanent | ✅ Oui | ❌ Trop cher |
| **IPFS** | Gratuit | ⚠️ Dépend des nodes | ❌ Pas garanti | ❌ Non | ❌ Pas fiable |

---

## ✅ SOLUTION RECOMMANDÉE : Arweave + Metaplex

### Pourquoi Arweave ?
- ✅ **Permanent** : Payé une fois, stocké pour toujours
- ✅ **Décentralisé** : Réseau blockchain dédié au stockage
- ✅ **Pas cher** : ~0.01 SOL par image (vs 0.7 SOL on-chain)
- ✅ **Standard NFT** : Compatible avec Metaplex (standard Solana)
- ✅ **Rapide** : CDN intégré

### Architecture
```
┌─────────────────────────────────────────────┐
│          SOLANA BLOCKCHAIN                  │
│                                             │
│  Property Account (On-Chain)                │
│  ├── name, city, province                   │
│  ├── surface, rooms, price                  │
│  ├── description (512 chars)                │
│  └── image_uri → "ar://xyz123..."           │ ───┐
└─────────────────────────────────────────────┘    │
                                                    │
                                                    ▼
┌─────────────────────────────────────────────┐
│          ARWEAVE BLOCKCHAIN                 │
│                                             │
│  Image File (Permanent)                     │
│  ├── property_main.jpg (200 KB)             │
│  ├── property_gallery_1.jpg                 │
│  ├── property_gallery_2.jpg                 │
│  └── metadata.json                          │
└─────────────────────────────────────────────┘
```

---

## 🔧 IMPLÉMENTATION

### Étape 1 : Modifier le Contrat Solana

Ajoutons un champ `image_uri` dans la structure `Property` :

```rust
#[account]
#[derive(InitSpace)]
pub struct Property {
    pub factory: Pubkey,                  // 32
    pub property_id: u64,                 // 8
    #[max_len(64)]
    pub name: String,                     // 4 + 64
    #[max_len(64)]
    pub city: String,                     // 4 + 64
    #[max_len(64)]
    pub province: String,                 // 4 + 64
    pub total_shares: u64,                // 8
    pub share_price: u64,                 // 8
    pub shares_sold: u64,                 // 8
    pub sale_start: i64,                  // 8
    pub sale_end: i64,                    // 8
    pub is_active: bool,                  // 1
    pub surface: u32,                     // 4 (m²)
    pub rooms: u8,                        // 1
    pub expected_return: u32,             // 4 (basis points)
    #[max_len(32)]
    pub property_type: String,            // 4 + 32
    pub year_built: u16,                  // 2
    #[max_len(512)]
    pub description: String,              // 4 + 512 ← Texte on-chain
    #[max_len(200)]
    pub image_uri: String,                // 4 + 200 ← Arweave URI
    #[max_len(1000)]
    pub long_description: String,         // 4 + 1000 ← Description détaillée
    pub total_dividends_deposited: u64,   // 8
    pub total_dividends_claimed: u64,     // 8
    pub bump: u8,                         // 1
}
```

**Nouveaux champs :**
- `image_uri` : URI Arweave (ex: `ar://xyz123...` ou `https://arweave.net/xyz123`)
- `long_description` : Description longue (1000 caractères) pour les investisseurs

**Coût additionnel :**
- 200 bytes (image_uri) = 0.000696 SOL
- 1000 bytes (long_description) = 0.00348 SOL
- **Total : ~0.0042 SOL par propriété** (~$0.42)

### Étape 2 : Modifier la Fonction `create_property`

```rust
pub fn create_property(
    ctx: Context<CreateProperty>,
    name: String,
    city: String,
    province: String,
    total_shares: u64,
    share_price: u64,
    sale_duration: i64,
    surface: u32,
    rooms: u8,
    expected_return: u32,
    property_type: String,
    year_built: u16,
    description: String,
    image_uri: String,              // ← NOUVEAU
    long_description: String,       // ← NOUVEAU
) -> Result<()> {
    // Validations
    require!(name.len() <= 64, FactoryError::NameTooLong);
    require!(city.len() <= 64, FactoryError::CityTooLong);
    require!(province.len() <= 64, FactoryError::ProvinceTooLong);
    require!(property_type.len() <= 32, FactoryError::TypeTooLong);
    require!(description.len() <= 512, FactoryError::DescriptionTooLong);
    require!(image_uri.len() <= 200, FactoryError::ImageUriTooLong);           // ← NOUVEAU
    require!(long_description.len() <= 1000, FactoryError::LongDescTooLong);  // ← NOUVEAU
    require!(total_shares > 0, FactoryError::InvalidShareAmount);
    require!(share_price > 0, FactoryError::InvalidPrice);

    let factory = &mut ctx.accounts.factory;
    let property = &mut ctx.accounts.property;
    let clock = Clock::get()?;

    // Remplir tous les champs
    property.factory = factory.key();
    property.property_id = factory.property_count;
    property.name = name;
    property.city = city;
    property.province = province;
    property.total_shares = total_shares;
    property.share_price = share_price;
    property.shares_sold = 0;
    property.sale_start = clock.unix_timestamp;
    property.sale_end = clock.unix_timestamp + sale_duration;
    property.is_active = true;
    property.surface = surface;
    property.rooms = rooms;
    property.expected_return = expected_return;
    property.property_type = property_type;
    property.year_built = year_built;
    property.description = description;
    property.image_uri = image_uri;                      // ← NOUVEAU
    property.long_description = long_description;        // ← NOUVEAU
    property.total_dividends_deposited = 0;
    property.total_dividends_claimed = 0;
    property.bump = ctx.bumps.property;

    factory.property_count += 1;

    msg!("Property created with image: {}", property.image_uri);
    Ok(())
}
```

### Étape 3 : Ajouter les Erreurs

```rust
#[error_code]
pub enum FactoryError {
    // ... erreurs existantes ...
    #[msg("Image URI is too long (max 200 characters)")]
    ImageUriTooLong,
    #[msg("Long description is too long (max 1000 characters)")]
    LongDescTooLong,
}
```

---

## 📤 UPLOAD D'IMAGES SUR ARWEAVE

### Méthode 1 : Via Bundlr (Recommandé)

**Bundlr** est le moyen le plus simple d'uploader sur Arweave depuis Solana.

#### Installation
```bash
npm install @bundlr-network/client
```

#### Code TypeScript
```typescript
import Bundlr from "@bundlr-network/client";
import fs from "fs";

async function uploadImageToArweave(imagePath: string, wallet: Keypair): Promise<string> {
  // 1. Initialiser Bundlr avec Solana
  const bundlr = new Bundlr(
    "https://node1.bundlr.network",
    "solana",
    wallet.secretKey
  );

  // 2. Charger l'image
  const imageBuffer = fs.readFileSync(imagePath);

  // 3. Upload sur Arweave
  const tx = await bundlr.upload(imageBuffer, {
    tags: [
      { name: "Content-Type", value: "image/jpeg" },
      { name: "Application", value: "BrickChain" },
      { name: "Property-Type", value: "Real-Estate" },
    ],
  });

  // 4. Retourner l'URI Arweave
  const arweaveUri = `https://arweave.net/${tx.id}`;
  console.log("Image uploaded:", arweaveUri);

  return arweaveUri;
}
```

#### Utilisation
```typescript
// Upload l'image
const imageUri = await uploadImageToArweave(
  "./property_photo.jpg",
  adminWallet
);

// Créer la propriété avec l'URI
await program.methods
  .createProperty(
    "Villa Paris",
    "Paris",
    "Île-de-France",
    new BN(1000),
    new BN(0.1 * LAMPORTS_PER_SOL),
    new BN(30 * 24 * 60 * 60),
    120,
    4,
    550,
    "Résidentiel",
    2020,
    "Belle villa moderne au cœur de Paris",
    imageUri,  // ← URI Arweave
    "Description longue avec tous les détails pour les investisseurs..."
  )
  .accounts({ admin: adminWallet.publicKey })
  .rpc();
```

### Méthode 2 : Metaplex Sugar (Pour les NFTs)

Si tu veux suivre le standard Metaplex NFT :

```bash
# Installer Sugar CLI
bash <(curl -sSf https://sugar.metaplex.com/install.sh)

# Uploader des assets
sugar upload
```

---

## 💰 COÛTS DÉTAILLÉS

### Par Propriété

| Élément | Taille | Coût On-Chain | Coût Arweave | Total |
|---------|--------|---------------|--------------|-------|
| **Données on-chain** | ~1.2 KB | 0.0042 SOL | - | 0.0042 SOL |
| **Image principale** | 200 KB | - | 0.01 SOL | 0.01 SOL |
| **Galerie (3 images)** | 600 KB | - | 0.03 SOL | 0.03 SOL |
| **TOTAL** | - | 0.0042 SOL | 0.04 SOL | **0.0442 SOL** |

**À $100/SOL = ~$4.42 par propriété**

### Pour 100 Propriétés
- On-chain : 0.42 SOL (~$42)
- Arweave : 4 SOL (~$400)
- **Total : 4.42 SOL (~$442)**

---

## 🎨 EXEMPLE COMPLET : Créer une Propriété avec Image

### 1. Préparer les fichiers
```
properties/
├── villa_paris_main.jpg       # 200 KB
├── villa_paris_gallery_1.jpg  # 150 KB
├── villa_paris_gallery_2.jpg  # 150 KB
└── metadata.json
```

### 2. Upload sur Arweave
```typescript
import Bundlr from "@bundlr-network/client";

async function createPropertyWithImages(wallet: Keypair) {
  const bundlr = new Bundlr(
    "https://node1.bundlr.network",
    "solana",
    wallet.secretKey
  );

  // Upload l'image principale
  const mainImage = fs.readFileSync("./properties/villa_paris_main.jpg");
  const mainTx = await bundlr.upload(mainImage, {
    tags: [{ name: "Content-Type", value: "image/jpeg" }],
  });
  const imageUri = `https://arweave.net/${mainTx.id}`;

  // Upload la galerie (optionnel)
  const gallery1 = fs.readFileSync("./properties/villa_paris_gallery_1.jpg");
  const gallery1Tx = await bundlr.upload(gallery1, {
    tags: [{ name: "Content-Type", value: "image/jpeg" }],
  });

  const gallery2 = fs.readFileSync("./properties/villa_paris_gallery_2.jpg");
  const gallery2Tx = await bundlr.upload(gallery2, {
    tags: [{ name: "Content-Type", value: "image/jpeg" }],
  });

  // Créer la propriété on-chain
  await program.methods
    .createProperty(
      "Villa Paris 15ème",
      "Paris",
      "Île-de-France",
      new BN(1000),
      new BN(0.1 * LAMPORTS_PER_SOL),
      new BN(30 * 24 * 60 * 60),
      120,
      4,
      550,
      "Résidentiel",
      2020,
      "Belle villa au cœur de Paris",
      imageUri,  // Image principale sur Arweave
      `Description détaillée pour les investisseurs:

      Cette magnifique villa de 120m² située dans le 15ème arrondissement de Paris
      offre un cadre de vie exceptionnel. Avec ses 4 chambres spacieuses et ses
      finitions haut de gamme, c'est un investissement idéal.

      Galerie:
      - ${gallery1Tx.id}
      - ${gallery2Tx.id}

      Rendement locatif estimé: 5.5% par an
      Charges de copropriété: €150/mois
      Taxe foncière: €1,200/an`
    )
    .accounts({ admin: wallet.publicKey })
    .rpc();

  console.log("✅ Propriété créée avec image:", imageUri);
}
```

---

## 🖼️ AFFICHAGE DANS LE FRONTEND

```typescript
// Récupérer la propriété
const property = await program.account.property.fetch(propertyPDA);

// Afficher l'image
<img
  src={property.imageUri}  // https://arweave.net/xyz123
  alt={property.name}
  className="w-full h-64 object-cover"
/>

// Afficher la description longue
<div className="prose">
  <h2>{property.name}</h2>
  <p>{property.longDescription}</p>
</div>
```

---

## 🔄 ALTERNATIVE : Shadow Drive (Solana Native)

Si tu veux rester 100% dans l'écosystème Solana :

```bash
# Installer Shadow Drive CLI
npm install -g @shadow-drive/cli

# Upload une image
shdw-drive upload-file \
  --file property.jpg \
  --storage-account <STORAGE_ACCOUNT>
```

**Avantages :**
- ✅ 100% Solana
- ✅ Moins cher (~0.005 SOL/MB)
- ✅ Rapide

**Inconvénients :**
- ❌ Pas permanent (besoin de payer régulièrement)
- ❌ Moins standard que Metaplex/Arweave

---

## 📝 CHECKLIST IMPLÉMENTATION

- [ ] Modifier `Property` struct (ajouter `image_uri` + `long_description`)
- [ ] Modifier `create_property()` (nouveaux paramètres)
- [ ] Ajouter les erreurs de validation
- [ ] Rebuild le contrat (`anchor build`)
- [ ] Installer Bundlr (`npm install @bundlr-network/client`)
- [ ] Créer un script d'upload d'images
- [ ] Tester l'upload sur Devnet
- [ ] Créer une propriété avec image
- [ ] Vérifier l'affichage dans le frontend

---

## 🎯 RÉSUMÉ

✅ **Texte (descriptions)** → On-chain Solana (gratuit, ~0.004 SOL)
✅ **Images** → Arweave via Bundlr (~0.01 SOL par image, permanent)
✅ **Métadonnées** → On-chain Solana
✅ **Galerie** → Arweave (multiples images)

**Coût total par propriété : ~0.04 SOL (~$4)**
**100% décentralisé, permanent, et abordable !**

---

Tu veux que je modifie le contrat maintenant pour ajouter ces champs ?
