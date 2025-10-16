# 🧪 Guide des Tests Solana - BrickChain

## ✅ Pré-requis (Déjà installés !)

- ✅ Solana CLI 1.18.20
- ✅ Anchor 0.32.1
- ✅ Rust 1.90.0
- ✅ Build compilé (target/deploy/*.so)

---

## 🚀 OPTION 1 : Test Automatique (Recommandé)

### Dans un seul terminal :

```bash
# Ajouter le PATH Solana
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Lancer les tests (démarre automatiquement le validateur)
anchor test
```

**Durée** : ~2-3 minutes
- ⏳ Démarre le validateur local
- ⏳ Déploie les contrats
- ⏳ Lance les 11 tests
- ✅ Affiche les résultats

**Output attendu** :
```
✅ Test accounts funded
✅ Factory initialized
✅ Property created
✅ Share purchased by investor 1
✅ Share purchased by investor 2
✅ Dividends deposited
✅ Dividends claimed
...
11 passing (2m 34s)
```

---

## 🎯 OPTION 2 : Test Manuel (Contrôle Total)

### Terminal 1 - Validateur Local

```bash
# Ajouter le PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Lancer le validateur (LAISSER TOURNER)
solana-test-validator
```

Attendre ce message :
```
Listening on http://127.0.0.1:8899
```

### Terminal 2 - Tests

```bash
# Ajouter le PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Déployer les contrats
anchor deploy --provider.cluster localnet

# Lancer les tests
anchor test --skip-local-validator
```

---

## 📋 DÉTAILS DES 11 TESTS

Voici ce que fait chaque test :

### 1️⃣ **Initialize Factory**
- Crée la Factory avec admin et treasury
- Vérifie que `property_count = 0`

### 2️⃣ **Create Property**
- Crée une propriété "Test Residence Paris"
- 1000 parts à 0.1 SOL chacune
- Surface 85m², 3 chambres
- Rendement 4.5%
- Vérifie tous les champs

### 3️⃣ **Buy Share - Investor 1**
- Investisseur 1 achète 1 part
- Paie 0.1 SOL au treasury
- Reçoit un ShareNFT (token_id = 0)
- Vérifie le paiement

### 4️⃣ **Buy Share - Investor 2**
- Investisseur 2 achète 1 part
- Reçoit ShareNFT (token_id = 1)
- Vérifie `shares_sold = 2`

### 5️⃣ **Deposit Dividends**
- Admin dépose 1 SOL de dividendes
- Vérifie `total_dividends_deposited = 1 SOL`

### 6️⃣ **Claim Dividends - Investor 1**
- Investisseur 1 réclame ses dividendes
- Calcul : 1 SOL / 2 parts = 0.5 SOL
- Reçoit 0.5 SOL
- Vérifie le montant reçu

### 7️⃣ **Claim Dividends - Investor 2**
- Investisseur 2 réclame ses dividendes
- Reçoit 0.5 SOL

### 8️⃣ **Cannot Claim Twice**
- Investisseur 1 essaie de claim à nouveau
- ❌ Devrait échouer avec erreur "NoDividendsToClaim"
- Vérifie que la sécurité fonctionne

### 9️⃣ **Close Property Sale**
- Tente de fermer la vente
- ⚠️ Peut échouer si la durée n'est pas expirée (normal)

### 🔟 **Display Final Stats**
- Affiche toutes les statistiques finales :
  - Total propriétés : 1
  - Parts vendues : 2 / 1000 (0.2%)
  - Dividendes déposés : 1 SOL
  - Dividendes réclamés : 1 SOL
  - Restants : 0 SOL

---

## 🔍 VÉRIFICATIONS FAITES PAR LES TESTS

### Sécurité
- ✅ Seul l'admin peut créer des propriétés
- ✅ Seul l'admin peut déposer des dividendes
- ✅ On ne peut pas claim 2 fois
- ✅ Le paiement va bien au treasury
- ✅ Les dividendes sont calculés correctement

### Fonctionnalités
- ✅ Création de propriétés avec tous les champs
- ✅ Mint de ShareNFT à l'achat
- ✅ Incrémentation du compteur `shares_sold`
- ✅ Calcul proportionnel des dividendes
- ✅ Tracking des dividendes par NFT

### Données
- ✅ Tous les champs stockés correctement
- ✅ PDAs dérivés correctement
- ✅ Conversions lamports ↔ SOL exactes

---

## ⚠️ EN CAS DE PROBLÈME

### Erreur : "Transport endpoint is not connected"
**Solution** : Le validateur n'est pas démarré
```bash
# Terminal 1
solana-test-validator

# Terminal 2 (attendre 10 secondes)
anchor test --skip-local-validator
```

### Erreur : "Program account not found"
**Solution** : Redéployer
```bash
anchor deploy --provider.cluster localnet
```

### Erreur : "Address already in use"
**Solution** : Un validateur tourne déjà
```bash
# Trouver le process
ps aux | grep solana-test-validator

# Tuer le process
kill -9 [PID]

# Relancer
solana-test-validator
```

### Build échoue
**Solution** : Vérifier le PATH
```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
anchor build
```

---

## 📊 RÉSULTATS ATTENDUS

### ✅ Tous les tests passent
```
real_estate_factory
  ✓ Initialize Factory (1234ms)
  ✓ Create Property (5678ms)
  ✓ Buy Share - Investor 1 (2345ms)
  ✓ Buy Share - Investor 2 (2345ms)
  ✓ Deposit Dividends (1234ms)
  ✓ Claim Dividends - Investor 1 (2345ms)
  ✓ Claim Dividends - Investor 2 (2345ms)
  ✓ Cannot claim dividends twice (1000ms)
  ✓ Close Property Sale (500ms)
  ✓ Display Final Stats (500ms)

11 passing (2m 34s)
```

### Statistiques finales affichées :
```
📊 === FINAL STATISTICS ===

🏭 Factory:
   Total Properties: 1

🏠 Property:
   Name: Test Residence Paris
   Location: Paris, Île-de-France
   Total Shares: 1000
   Shares Sold: 2
   Funding: 0.20%

💰 Dividends:
   Total Deposited: 1 SOL
   Total Claimed: 1 SOL
   Remaining: 0 SOL

✅ All tests passed!
```

---

## 🎉 SI TOUS LES TESTS PASSENT

**Cela signifie que :**
- ✅ Ton contrat fonctionne parfaitement
- ✅ Toutes les fonctions sont opérationnelles
- ✅ La sécurité est correcte
- ✅ Les calculs sont exacts
- ✅ Tu peux déployer sur Devnet

**Prochaines étapes** :
1. Déployer sur Devnet (réseau de test public)
2. Tester avec de vrais wallets
3. Connecter le frontend
4. Déployer sur Mainnet

---

## 💡 COMMANDES UTILES

### Voir les logs du contrat
```bash
solana logs --url localhost
```

### Voir le solde d'un compte
```bash
solana balance <ADDRESS> --url localhost
```

### Rebuilder rapidement
```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
anchor build
```

### Nettoyer et rebuild
```bash
anchor clean
anchor build
```

---

## 🚀 LANCER LES TESTS MAINTENANT

```bash
# 1. Ouvre un terminal
cd /Users/mathieu/Desktop/immo

# 2. Configure le PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 3. Lance les tests
anchor test
```

**C'est tout !** Les tests vont tourner automatiquement pendant ~2-3 minutes.

Si tout passe ✅, ton contrat est **100% fonctionnel** et prêt pour Devnet !