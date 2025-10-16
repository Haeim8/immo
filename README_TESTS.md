# 🎯 BrickChain - Tests & Déploiement

## 📚 Documentation Créée

Voici tous les guides pour tester et déployer ton projet :

1. **[GUIDE_TESTS.md](GUIDE_TESTS.md)**
   - Comment tester localement
   - Détails des 11 tests
   - Troubleshooting

2. **[GUIDE_DEPLOIEMENT_DEVNET.md](GUIDE_DEPLOIEMENT_DEVNET.md)**
   - Déploiement sur Devnet (réseau de test)
   - Initialisation de la Factory
   - Connexion au frontend

3. **[run-tests.sh](run-tests.sh)**
   - Script automatique pour lancer les tests
   - Usage : `./run-tests.sh`

---

## ⚡ QUICK START

### 1️⃣ Tester localement (2-3 minutes)

```bash
# Lancer le script de test automatique
./run-tests.sh
```

**OU manuellement :**

```bash
# Configurer le PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Lancer les tests
anchor test
```

**Résultat attendu** : `11 passing (2m 34s)`

---

### 2️⃣ Déployer sur Devnet (après que les tests passent)

```bash
# 1. Créer un wallet Devnet
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# 2. Configurer Solana
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/devnet-wallet.json

# 3. Airdrop de SOL gratuit
solana airdrop 2

# 4. Déployer
anchor deploy --provider.cluster devnet

# 5. Initialiser la Factory (une seule fois)
anchor run initialize --provider.cluster devnet
```

**Consulte [GUIDE_DEPLOIEMENT_DEVNET.md](GUIDE_DEPLOIEMENT_DEVNET.md) pour les détails**

---

## 🧪 TESTS INCLUS

Ton projet contient **11 tests complets** qui vérifient :

### Fonctionnalités
- ✅ Initialisation de la Factory
- ✅ Création de propriétés
- ✅ Achat de parts (NFT)
- ✅ Dépôt de dividendes (admin)
- ✅ Réclamation de dividendes (investisseurs)
- ✅ Fermeture de vente

### Sécurité
- ✅ Seul l'admin peut créer des propriétés
- ✅ Seul l'admin peut déposer des dividendes
- ✅ On ne peut pas claim 2 fois
- ✅ Paiement sécurisé vers le treasury
- ✅ Calculs de dividendes exacts

### Données
- ✅ Tous les champs stockés correctement
- ✅ PDAs dérivés sans erreur
- ✅ Conversions lamports ↔ SOL précises

---

## 📊 STRUCTURE DU PROJET

```
immo/
├── programs/
│   ├── real_estate_factory/    # Contrat principal
│   │   └── src/lib.rs          # Code Rust du contrat
│   └── property_contract/      # Contrat secondaire (features avancées)
│       └── src/lib.rs
│
├── tests/
│   └── real_estate_factory.ts  # 11 tests complets
│
├── lib/solana/
│   ├── types.ts                # Types TypeScript
│   ├── hooks.ts                # React hooks
│   ├── instructions.ts         # Fonctions d'appel
│   └── useSolPrice.ts          # Prix SOL en temps réel
│
├── Anchor.toml                 # Config Anchor
├── package.json                # Dépendances
│
├── GUIDE_TESTS.md              # 📖 Guide des tests
├── GUIDE_DEPLOIEMENT_DEVNET.md # 📖 Guide déploiement
└── run-tests.sh                # 🚀 Script auto
```

---

## 🎯 PROCHAINES ÉTAPES

### 1. **Tester localement** ✅
```bash
./run-tests.sh
```
**Temps** : 2-3 minutes
**Coût** : Gratuit

### 2. **Déployer sur Devnet** 🧪
```bash
anchor deploy --provider.cluster devnet
```
**Temps** : 5 minutes
**Coût** : Gratuit (SOL Devnet)

### 3. **Tester avec le frontend** 🌐
- Connecter Phantom/Solflare (Devnet)
- Créer une propriété via l'admin
- Acheter une part
- Réclamer des dividendes

### 4. **Déployer sur Mainnet** 💰
⚠️ **Seulement après** :
- Tous les tests passent ✅
- Devnet testé pendant plusieurs jours ✅
- Audit de sécurité effectué ✅
- Tu as ~10 SOL pour le déploiement ✅

---

## 💡 COMMANDES UTILES

### Tests
```bash
# Tests auto
./run-tests.sh

# Tests manuels
anchor test

# Tests sur Devnet
anchor test --provider.cluster devnet
```

### Build
```bash
# Build les contrats
anchor build

# Clean + rebuild
anchor clean && anchor build
```

### Déploiement
```bash
# Deploy local
anchor deploy --provider.cluster localnet

# Deploy Devnet
anchor deploy --provider.cluster devnet

# Deploy Mainnet (attention !)
anchor deploy --provider.cluster mainnet-beta
```

### Solana
```bash
# Voir la config
solana config get

# Changer de cluster
solana config set --url devnet

# Airdrop (Devnet uniquement)
solana airdrop 2

# Voir le solde
solana balance
```

---

## 🔗 LIENS UTILES

### Documentation
- **Anchor** : https://www.anchor-lang.com/docs
- **Solana** : https://docs.solana.com
- **Tests Anchor** : https://book.anchor-lang.com/anchor_in_depth/testing.html

### Explorateurs
- **Devnet** : https://explorer.solana.com/?cluster=devnet
- **Mainnet** : https://explorer.solana.com

### Outils
- **Faucet Devnet** : https://faucet.solana.com
- **Solana Playground** : https://beta.solpg.io

---

## ❓ FAQ

### Q: Les tests prennent combien de temps ?
**R:** 2-3 minutes (démarrage du validateur + 11 tests)

### Q: Ça coûte combien de tester ?
**R:** Gratuit ! Les tests locaux n'utilisent pas de vrai SOL.

### Q: Et Devnet ?
**R:** Gratuit aussi ! Le SOL Devnet est gratuit via le faucet.

### Q: Combien de SOL pour Mainnet ?
**R:** ~5-10 SOL pour déployer les 2 contrats.

### Q: Puis-je modifier le contrat après déploiement ?
**R:** Oui, si tu es l'upgrade authority. Tu peux redéployer une nouvelle version.

### Q: Que se passe-t-il si les tests échouent ?
**R:** Lis les erreurs, consulte GUIDE_TESTS.md section "En cas de problème".

---

## 🚀 LANCER LES TESTS MAINTENANT

```bash
cd /Users/mathieu/Desktop/immo
./run-tests.sh
```

**Bonne chance !** 🎉

Si tous les tests passent, ton contrat est **100% fonctionnel** et prêt pour Devnet !

---

## 📞 SUPPORT

- **Documentation** : Consulte les guides .md
- **Logs** : `solana logs <PROGRAM_ID>`
- **Explorer** : https://explorer.solana.com
- **Community** : Anchor Discord / Solana Discord
