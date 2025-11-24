# 🧩 CANTORFI - Interactive Places (Solidity)

Contrats intelligents pour tokeniser des "places" interactives basées sur des puzzles NFT, avec toutes les corrections d'audit intégrées.

## ✅ Fonctionnalités Complètes

### 🔐 Sécurité (Audit Fixes)
- ✅ **Anti-dilution dividendes** : Dépôts bloqués pendant vente active
- ✅ **Snapshot shares** : Prévention dilution après dépôt
- ✅ **Remainder tracking** : Aucun wei perdu
- ✅ **Validation durées** : sale_duration et voting_duration > 0
- ✅ **Auto-fermeture** : Ventes et votes se ferment automatiquement
- ✅ **Original minter** : Track marché primaire vs secondaire

### 🏗️ Architecture
- `CANTORFIFactory.sol` : Factory principale (création / gestion des places)
- `CANTORFI.sol` : Contrat par place (NFT puzzles ERC721)

### 💎 Fonctionnalités
1. **Puzzle NFT** (ERC721) - Chaque puzzle = 1 NFT unique
2. **Récompenses** - Distribution équitable avec anti-dilution et remainder tracking
3. **Gouvernance** - Propositions et votes (1 NFT = 1 vote)
4. **Completion** - Versement final avec burn des puzzles
5. **Team Management** - Admin + membres d'équipe autorisés
6. **Deadlines** - Auto-fermeture des ventes et votes

## 🚀 Installation

```bash
cd backend
npm install
```

## 🧪 Test Local

```bash
# Terminal 1 - Lancer node local
npx hardhat node

# Terminal 2 - Déployer
npm run deploy:local

# Compiler
npm run compile

# Tests (TODO: créer tests)
npm test
```

## 📦 Déploiement

1. Configurer `.env` :
```env
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
```

2. Modifier `hardhat.config.js` avec votre réseau

3. Déployer :
```bash
npm run deploy:testnet
```

## 📝 Différences vs Solana

| Feature | Solana (Rust) | EVM (Solidity) |
|---------|---------------|----------------|
| NFT | On-chain SVG | ERC721 standard |
| Coût | ~0.05 SOL | Varie selon réseau |
| Rapidité | Ultra rapide | Dépend du réseau |
| Bugs | Test validator cassé | Fonctionne ✅ |

## 🔗 Réseaux Supportés

Configurez dans `hardhat.config.js` :
- Polygon
- Arbitrum
- Optimism
- BSC
- Base
- Avalanche
- Ou n'importe quel réseau EVM

## ⚠️ TODO Frontend

Après déploiement, mettez à jour :
1. `lib/contracts/addresses.ts` - Adresse Factory
2. `lib/contracts/abis/` - ABIs des contrats
3. `lib/contracts/hooks.ts` - Hooks pour interactions

---

**Plus de bugs Solana !** 🎉
