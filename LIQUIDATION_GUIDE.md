# 🤖 Guide de Liquidation CantorFi

Ce guide est destiné aux développeurs et teneurs de marché qui souhaitent opérer des bots de liquidation sur le protocole CantorFi.

## 🌟 Pourquoi devenir liquidateur ?

CantorFi offre un modèle de liquidation unique et hautement incitatif :
*   **Zero Capital Upfront** : Contrairement aux flashloans Aave/Compound, vous n'avez pas besoin d'emprunter des fonds pour rembourser la dette. Le Vault utilise le collatéral de l'utilisateur pour le faire.
*   **Permissionless** : N'importe qui peut appeler la fonction de liquidation.
*   **Bonus Garanti** : Vous recevez instantanément un **bonus de 5%** (ou plus selon config) sur la valeur liquidée.

---

## 🛠 Mécanique Technique

La liquidation sur CantorFi est **Intra-Vault**. Cela signifie que tout se passe à l'intérieur du contrat du Vault.

1.  **Le Déclencheur** : Vous appelez `vault.liquidate(targetUser)`.
2.  **L'Action** : Le contrat saisit le collatéral de l'utilisateur (ex: WETH).
3.  **Le Remboursement** : Une partie du collatéral est utilisée pour annuler la dette de l'utilisateur.
4.  **Le Paiement** :
    *   Le liquidateur reçoit son **Bonus** en tokens de collatéral.
    *   Le protocole prend ses intérêts en retard.
    *   Le reste (s'il y en a) est rendu à l'utilisateur.

### Conditions de Liquidation
Un utilisateur est liquidable si son **Health Factor** est inférieur à 100% (ou ratio d'emprunt > Seuil de Liquidation).

*   **Max LTV (Loan-to-Value)** : ~70% (L'utilisateur ne peut plus emprunter au-delà).
*   **Liquidation Threshold** : ~80% (Le point de rupture).

Si `Dette > (Collatéral * 80%)`, la position est insolvable.

---

## 👨‍💻 Comment construire un Bot ?

### 1. Découverte des Cibles
Vous ne pouvez pas itérer sur tous les utilisateurs (trop coûteux). Vous devez construire une liste locale d'utilisateurs actifs.

*   Écoutez l'événement `VaultCreated` sur la **Factory** pour découvrir les nouveaux marchés.
*   Sur chaque Vault, écoutez les événements `Supply`, `Borrow`, `Withdraw`, `Repay` pour identifier les utilisateurs actifs.

### 2. Surveillance (Monitoring)
Pour chaque utilisateur actif, surveillez sa santé.

```solidity
// Interface CantorVault
function isLiquidatable(address user) external view returns (bool);
function getHealthFactor(address user) external view returns (uint256);
```

*   Si `isLiquidatable(user)` renvoie `true`, **TIRER IMMEDIATEMENT !** 🔫

### 3. Exécution

```javascript
// Exemple Ethers.js v6
const vaultAbi = ["function liquidate(address user) external"];
const vault = new ethers.Contract(vaultAddress, vaultAbi, wallet);

// Estimer le gas pour éviter les échecs
try {
  const tx = await vault.liquidate(targetAddress);
  console.log(`Liquidation lancée: ${tx.hash}`);
  await tx.wait();
  console.log("💰 Profit sécurisé !");
} catch (error) {
  console.log("Échec ou déjà liquidé");
}
```

---

## 📊 Exemple de Scénario de Profit

Imaginons un Vault WETH :
1.  **Alice** dépose $10,000 de WETH.
2.  Elle emprunte $7,000 (70% LTV).
3.  Le prix de l'ETH chute ou les intérêts s'accumulent. Sa dette vaut maintenant $8,100 (81% > 80% Threshold).
4.  **Vous (Bot)** appelez `liquidate(Alice)`.
5.  Le contrat saisit $8,100 de ses WETH + le bonus.
6.  **Votre Gain** : 5% de $8,100 = **$405 de profit immédiat** (moins frais de gas).
7.  Alice conserve le reste de son collatéral (~$1,495).

---

## 📍 Adresses des Contrats (Testnet/Mainnet)

Pour démarrer, récupérez l'adresse de la `CantorAssetFactory` (voir documentation de déploiement) et écoutez les événements.

*Happy Hunting!* 🏹
