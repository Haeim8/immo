# 🚀 Guide de Déploiement sur Devnet - BrickChain

## ✅ Pré-requis

- ✅ Les tests locaux passent (`./run-tests.sh`)
- ✅ Solana CLI configuré
- ✅ Anchor installé

---

## 📍 ÉTAPE 1 : Créer un Wallet Devnet

### Option A : Créer un nouveau wallet (Recommandé)

```bash
# Générer un nouveau wallet
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Sauvegarder la seed phrase affichée !
# ⚠️ IMPORTANT : Note la seed phrase dans un endroit sûr
```

### Option B : Utiliser un wallet existant

```bash
# Si tu as déjà un wallet Phantom/Solflare
# Exporte la clé privée et mets-la dans un fichier
```

---

## 📍 ÉTAPE 2 : Configurer Solana pour Devnet

```bash
# Configurer le cluster sur Devnet
solana config set --url https://api.devnet.solana.com

# Configurer le wallet
solana config set --keypair ~/.config/solana/devnet-wallet.json

# Vérifier la config
solana config get
```

**Résultat attendu :**
```
Config File: ~/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/
Keypair Path: ~/.config/solana/devnet-wallet.json
Commitment: confirmed
```

---

## 📍 ÉTAPE 3 : Airdrop de SOL Devnet

Sur Devnet, tu peux obtenir des SOL gratuits pour tester :

```bash
# Voir ton adresse wallet
solana address

# Demander 2 SOL (gratuit sur Devnet)
solana airdrop 2

# Vérifier le solde
solana balance
```

**Tu devrais voir :** `2 SOL`

Si l'airdrop échoue (rate limiting), utilise le faucet web :
- https://faucet.solana.com
- Colle ton adresse
- Demande 2 SOL

---

## 📍 ÉTAPE 4 : Mettre à jour Anchor.toml

Édite le fichier `Anchor.toml` :

```toml
[provider]
cluster = "devnet"  # ← Changé de "localnet" à "devnet"
wallet = "~/.config/solana/devnet-wallet.json"  # ← Ton wallet
```

---

## 📍 ÉTAPE 5 : Build et Deploy

```bash
# Ajouter le PATH Solana
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Build les contrats
anchor build

# Déployer sur Devnet
anchor deploy --provider.cluster devnet
```

**Durée :** ~2-3 minutes

**Output attendu :**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: <TON_WALLET>
Deploying program "real_estate_factory"...
Program Id: H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL

Deploying program "property_contract"...
Program Id: 97eUkEnc8ycsVemeh65NEfh4P4nnPMSZReUG66fSe3Kr

Deploy success
```

---

## 📍 ÉTAPE 6 : Vérifier les Program IDs

Après déploiement, **copie les Program IDs affichés**.

Ensuite, mets-les à jour dans **3 fichiers** :

### 1. Anchor.toml

```toml
[programs.devnet]
real_estate_factory = "H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL"
property_contract = "97eUkEnc8ycsVemeh65NEfh4P4nnPMSZReUG66fSe3Kr"
```

### 2. programs/real_estate_factory/src/lib.rs

```rust
declare_id!("H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL");
```

### 3. lib/solana/types.ts

```typescript
export const FACTORY_PROGRAM_ID = new PublicKey("H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL");
export const PROPERTY_PROGRAM_ID = new PublicKey("97eUkEnc8ycsVemeh65NEfh4P4nnPMSZReUG66fSe3Kr");
```

---

## 📍 ÉTAPE 7 : Rebuild avec les nouveaux IDs

```bash
# Rebuild pour inclure les Program IDs à jour
anchor build

# Redéployer
anchor deploy --provider.cluster devnet
```

**Important :** Cette étape assure que les Program IDs dans le code correspondent à ceux déployés.

---

## 📍 ÉTAPE 8 : Initialiser la Factory

La Factory doit être initialisée **UNE SEULE FOIS** après déploiement.

Crée un script `scripts/initialize-factory.ts` :

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealEstateFactory } from "../target/types/real_estate_factory";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

async function main() {
  // Configure provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealEstateFactory as Program<RealEstateFactory>;

  // Admin = wallet qui déploie
  const admin = provider.wallet.publicKey;

  // Treasury = même wallet (peut être différent)
  const treasury = admin;

  // Derive Factory PDA
  const [factoryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("factory")],
    program.programId
  );

  console.log("🏭 Initializing Factory...");
  console.log("Admin:", admin.toBase58());
  console.log("Treasury:", treasury.toBase58());
  console.log("Factory PDA:", factoryPDA.toBase58());

  try {
    const tx = await program.methods
      .initialize(admin)
      .accounts({
        factory: factoryPDA,
        treasury: treasury,
        payer: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Factory initialized!");
    console.log("Transaction:", tx);
    console.log("View on Solana Explorer:");
    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
```

Puis lance :

```bash
# Ajouter au package.json dans "scripts":
"init-factory": "ts-node scripts/initialize-factory.ts"

# Lancer
yarn init-factory
```

**OU directement** :

```bash
anchor run initialize --provider.cluster devnet
```

(Si tu as défini le script dans `Anchor.toml`)

---

## 📍 ÉTAPE 9 : Vérifier le Déploiement

```bash
# Voir les infos du programme
solana program show <PROGRAM_ID> --url devnet

# Exemple
solana program show H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL --url devnet
```

**Résultat attendu :**
```
Program Id: H8S27aKztqdyCPZCPUvmAahSDBrTrw5ahCjQbJpzSECL
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: <DATA_ADDRESS>
Authority: <TON_WALLET>
Last Deployed In Slot: 123456789
Data Length: 308 KB
```

---

## 📍 ÉTAPE 10 : Tester sur Devnet

### Option A : Via le frontend

1. Configure le frontend pour Devnet :
   ```typescript
   // lib/solana/hooks.ts ou wallet-provider.tsx
   const network = WalletAdapterNetwork.Devnet;
   ```

2. Lance le frontend :
   ```bash
   yarn dev
   ```

3. Connecte un wallet (Phantom/Solflare) configuré sur Devnet

4. Teste les fonctions :
   - Créer une propriété
   - Acheter une part
   - Déposer des dividendes
   - Réclamer des dividendes

### Option B : Via les tests Anchor

```bash
# Lancer les tests sur Devnet
anchor test --provider.cluster devnet
```

⚠️ **Attention** : Les tests sur Devnet consomment du vrai SOL Devnet (mais gratuit)

---

## 🎯 CHECKLIST FINALE

Avant de passer à Mainnet, vérifie :

- [ ] ✅ Factory initialisée
- [ ] ✅ Création de propriété fonctionne
- [ ] ✅ Achat de parts fonctionne
- [ ] ✅ Dépôt de dividendes fonctionne
- [ ] ✅ Réclamation de dividendes fonctionne
- [ ] ✅ Frontend connecté et fonctionnel
- [ ] ✅ Toutes les transactions visibles sur Solana Explorer
- [ ] ✅ Pas d'erreurs ou de bugs
- [ ] ✅ Tests complets sur Devnet effectués
- [ ] ✅ Audit de sécurité effectué (recommandé)

---

## 🔗 LIENS UTILES

### Solana Explorer Devnet
- Ton programme : `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`
- Transactions : `https://explorer.solana.com/tx/<TX_SIGNATURE>?cluster=devnet`

### Faucet Devnet
- https://faucet.solana.com

### Documentation
- Solana : https://docs.solana.com
- Anchor : https://www.anchor-lang.com/docs

---

## 🚨 EN CAS DE PROBLÈME

### "Insufficient funds"
**Solution** : Demande plus de SOL via le faucet

### "Program failed to complete"
**Solution** : Vérifie les logs
```bash
solana logs <PROGRAM_ID> --url devnet
```

### "Account already initialized"
**Solution** : La Factory est déjà initialisée, ignore cette étape

### Program ID ne correspond pas
**Solution** : Vérifie que les 3 fichiers ont le bon Program ID et rebuild

---

## 🎉 FÉLICITATIONS !

Si tout fonctionne sur Devnet, ton contrat est **prêt pour Mainnet** !

**Mainnet = Argent réel**

Avant de déployer sur Mainnet :
1. Fais un audit de sécurité
2. Teste TOUT sur Devnet pendant plusieurs jours
3. Fais tester par d'autres personnes
4. Prépare un plan de migration
5. Aie assez de SOL pour le déploiement (~5-10 SOL)

---

## 💡 COMMANDES RAPIDES

```bash
# Deploy sur Devnet
anchor deploy --provider.cluster devnet

# Initialiser Factory
anchor run initialize --provider.cluster devnet

# Voir les logs
solana logs <PROGRAM_ID> --url devnet

# Airdrop SOL
solana airdrop 2 --url devnet

# Voir le solde
solana balance --url devnet
```

---

Prêt à déployer ? Lance :

```bash
anchor deploy --provider.cluster devnet
```

Bonne chance ! 🚀
