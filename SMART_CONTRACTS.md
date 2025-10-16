# BrickChain - Smart Contracts Documentation

## Architecture Overview

BrickChain utilise deux programmes Solana (smart contracts) développés avec Anchor Framework:

### 1. **real_estate_factory** - Programme Principal
Le contrat Factory est le point d'entrée principal qui gère:
- Création de biens immobiliers (properties)
- Mint on-demand des NFTs lors de l'achat
- Gestion du wallet trésorerie
- Distribution des dividendes

**Program ID**: `FACDfLX7z2HdhqrWf3imVK1Q4yQQ79UwVEvkDRRv2ifY`

### 2. **property_contract** - Fonctionnalités Avancées
Programme pour des fonctionnalités étendues:
- Transfert de NFT entre utilisateurs
- Tracking des transactions
- Statistiques par propriété
- Métadonnées extensibles

**Program ID**: `PRoTWaQKHiwWVhbU3xs8QkQpJpFExwckxqQZGMAA83U`

---

## Fonctionnalités du Factory

### 1. Initialize Factory
Initialise le contrat principal avec un wallet admin et trésorerie.

```rust
pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()>
```

**Comptes requis:**
- `factory`: PDA du factory (créé)
- `treasury`: Wallet trésorerie
- `payer`: Payeur des frais
- `system_program`: Programme système

### 2. Create Property
Crée un nouveau bien immobilier ouvert à l'investissement.

```rust
pub fn create_property(
    ctx: Context<CreateProperty>,
    name: String,              // Nom du bien (max 64 chars)
    location: String,          // Localisation (max 128 chars)
    total_shares: u64,         // Nombre total de shares
    share_price: u64,          // Prix par share en lamports
    sale_duration: i64,        // Durée de vente en secondes
) -> Result<()>
```

**Caractéristiques:**
- Chaque bien = contrat indépendant
- NFTs numérotés de 0 à (total_shares - 1)
- Durée de vente configurable
- Prix fixe par share

### 3. Buy Share
Achète un share NFT (minted on-demand lors de l'achat).

```rust
pub fn buy_share(ctx: Context<BuyShare>) -> Result<()>
```

**Processus:**
1. Vérifie que la vente est active
2. Vérifie qu'il reste des shares disponibles
3. Transfère le paiement vers la trésorerie
4. Mint le NFT avec un numéro unique
5. Incrémente le compteur de shares vendus

**NFT Tracking:**
Chaque NFT contient:
- `property`: Référence au bien
- `owner`: Propriétaire actuel
- `token_id`: Numéro unique du NFT
- `mint_time`: Timestamp du mint
- `dividends_claimed`: Dividendes déjà réclamés

### 4. Deposit Dividends
Dépose des dividendes pour une propriété spécifique (admin only).

```rust
pub fn deposit_dividends(
    ctx: Context<DepositDividends>,
    amount: u64
) -> Result<()>
```

**Fonctionnement:**
- Les dividendes sont déposés sur le PDA de la propriété
- Tracking du total déposé
- Seul l'admin peut déposer

### 5. Claim Dividends
Réclame les dividendes proportionnels au nombre de NFTs possédés.

```rust
pub fn claim_dividends(ctx: Context<ClaimDividends>) -> Result<()>
```

**Calcul:**
```
dividends_per_share = total_dividends / shares_sold
claimable = dividends_per_share - dividends_already_claimed
```

**Important:**
- Les dividendes ne sont PAS transférés automatiquement
- L'utilisateur doit les claim via l'interface
- Proportionnel au nombre de NFTs possédés
- Tracking précis par NFT

### 6. Close Property Sale
Ferme la vente d'une propriété (admin only).

```rust
pub fn close_property_sale(ctx: Context<ClosePropertySale>) -> Result<()>
```

---

## Structures de Données

### Factory
```rust
pub struct Factory {
    pub admin: Pubkey,           // Admin du protocole
    pub treasury: Pubkey,        // Wallet trésorerie
    pub property_count: u64,     // Nombre de propriétés créées
    pub bump: u8,                // Bump seed du PDA
}
```

### Property
```rust
pub struct Property {
    pub factory: Pubkey,                  // Référence au factory
    pub property_id: u64,                 // ID unique
    pub name: String,                     // Nom (max 64 chars)
    pub location: String,                 // Localisation (max 128 chars)
    pub total_shares: u64,                // Total de shares
    pub share_price: u64,                 // Prix en lamports
    pub shares_sold: u64,                 // Shares vendus
    pub sale_start: i64,                  // Début de vente
    pub sale_end: i64,                    // Fin de vente
    pub is_active: bool,                  // Statut actif
    pub total_dividends_deposited: u64,   // Total dividendes déposés
    pub total_dividends_claimed: u64,     // Total dividendes réclamés
    pub bump: u8,                         // Bump seed
}
```

### ShareNFT
```rust
pub struct ShareNFT {
    pub property: Pubkey,        // Propriété associée
    pub owner: Pubkey,           // Propriétaire actuel
    pub token_id: u64,           // Numéro unique du NFT
    pub mint_time: i64,          // Timestamp du mint
    pub dividends_claimed: u64,  // Dividendes déjà réclamés
    pub bump: u8,                // Bump seed
}
```

---

## PDAs (Program Derived Addresses)

### Factory PDA
```
seeds = [b"factory"]
```

### Property PDA
```
seeds = [
    b"property",
    factory.key().as_ref(),
    property_id.to_le_bytes()
]
```

### ShareNFT PDA
```
seeds = [
    b"share_nft",
    property.key().as_ref(),
    token_id.to_le_bytes()
]
```

---

## Utilisation Frontend

### Installation
```bash
yarn add @solana/web3.js @solana/wallet-adapter-react @coral-xyz/anchor
```

### Exemple: Acheter un Share
```typescript
import { useBrickChain } from "@/lib/solana/hooks";
import { PublicKey } from "@solana/web3.js";

function BuyShareButton({ propertyAddress }: { propertyAddress: string }) {
  const { buyPropertyShare, loading, error } = useBrickChain();

  const handleBuy = async () => {
    try {
      const result = await buyPropertyShare(
        new PublicKey(propertyAddress)
      );
      console.log("NFT minted!", result.shareNFTPDA.toBase58());
      console.log("Token ID:", result.tokenId);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <button onClick={handleBuy} disabled={loading}>
      {loading ? "Processing..." : "Buy Share"}
    </button>
  );
}
```

### Exemple: Claim Dividends
```typescript
import { useBrickChain } from "@/lib/solana/hooks";

function ClaimButton({ shareNFTAddress }: { shareNFTAddress: string }) {
  const { claimShareDividends, loading } = useBrickChain();

  const handleClaim = async () => {
    const result = await claimShareDividends(
      new PublicKey(shareNFTAddress)
    );
    console.log("Claimed:", result.amount, "lamports");
  };

  return (
    <button onClick={handleClaim} disabled={loading}>
      Claim Dividends
    </button>
  );
}
```

### Exemple: Créer une Propriété (Admin)
```typescript
import { useBrickChain } from "@/lib/solana/hooks";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

function CreatePropertyForm() {
  const { createNewProperty, loading } = useBrickChain();

  const handleCreate = async () => {
    const result = await createNewProperty({
      name: "Appartement Paris 15ème",
      location: "Paris, France",
      totalShares: 1000,
      sharePrice: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
      saleDuration: 30 * 24 * 60 * 60, // 30 jours
    });

    console.log("Property created:", result.propertyPDA.toBase58());
  };

  return <button onClick={handleCreate}>Create Property</button>;
}
```

---

## Build & Deploy

### 1. Build les programmes
```bash
anchor build
```

### 2. Déployer sur devnet
```bash
anchor deploy --provider.cluster devnet
```

### 3. Mettre à jour les program IDs
Après le déploiement, mettez à jour les IDs dans:
- `Anchor.toml`
- `programs/*/src/lib.rs` (declare_id!)
- `lib/solana/types.ts` (FACTORY_PROGRAM_ID, PROPERTY_PROGRAM_ID)

---

## Sécurité

### Vérifications Implémentées
- ✅ Vérification des droits admin
- ✅ Vérification des dates de vente
- ✅ Vérification des montants (> 0)
- ✅ Vérification des shares disponibles
- ✅ Protection contre les overflows
- ✅ Validation des tailles de string
- ✅ Tracking précis des NFTs et dividendes

### Recommandations
- Audit de sécurité avant mainnet
- Tests approfondis sur devnet
- Monitoring des transactions
- Rate limiting pour les admins
- Multi-sig pour les opérations critiques

---

## Tests

Pour tester les programmes:

```bash
# Lancer un validateur local
solana-test-validator

# Dans un autre terminal, déployer
anchor deploy --provider.cluster localnet

# Exécuter les tests
anchor test --skip-local-validator
```

---

## Roadmap

### Phase 1 (Actuelle)
- ✅ Architecture de base
- ✅ Mint on-demand des NFTs
- ✅ Système de dividendes
- ✅ Intégration frontend

### Phase 2
- [ ] Tests complets
- [ ] Audit de sécurité
- [ ] Deployment devnet
- [ ] Interface admin complète

### Phase 3
- [ ] Governance DAO
- [ ] Staking de NFTs
- [ ] Marketplace secondaire
- [ ] Deployment mainnet

---

## Support

Pour toute question ou problème:
- GitHub Issues: [lien]
- Discord: [lien]
- Documentation: [lien]
