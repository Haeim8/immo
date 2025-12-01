# 📋 PLAN D'IMPLÉMENTATION CANTOR VAULT

**6 Contrats à créer (selon CANTOR_VAULT_ARCHITECTURE.md):**

---

## 1. `CantorProtocol.sol`

**CE QUE FAIT CantorProtocol:**

Le protocole a besoin d'un **REGISTRE CENTRAL** qui sait:
- Où sont tous les vaults (addresses sur Ethereum, Polygon, Arbitrum, etc.)
- Quels sont les paramètres globaux du protocole (combien de frais, qui est admin, etc.)
- Qui peut faire quoi (permissions: admin, pauser, treasury, etc.)

**FLUX:**

1. **team crée un vault via Factory:**
   - Factory enregistre le vault dans CantorProtocol
   - CantorProtocol stocke: vaultId → address du vault
   - CantorProtocol émet un event "VaultCreated" pour que les indexeurs le trouvent

2. **Quand on veut voir tous les vaults:**
   - Dapp appelle CantorProtocol.getVaultAddress(1), getVaultAddress(2), etc.
   - Retrouve les adresses de tous les vaults

3. **Quand admin veut changer les fees globales:**
   - Admin appelle CantorProtocol.setGlobalFee(setupFee, performanceFee)
   - Les nouveaux vaults créés héritent de ces fees

4. **Quand on déploie sur plusieurs chaînes:**
   - CantorProtocol existe sur chaque chaîne (Ethereum, Polygon, Arbitrum, etc.)
   - Les vaults sont synchronisés entre chaînes via un bridge
   - Un utilisateur peut voir ses positions sur toutes les chaînes

**EN RÉSUMÉ:** CantorProtocol = l'annuaire du protocole. Tu l'appelles pour trouver les vaults, changer les paramètres globaux, gérer les permissions.

---

## 2. `CantorHouseFactory.sol`

**CE QUE FAIT CantorHouseFactory:**

Factory = l'usine qui **CRÉE chaque vault** pour chaque bien (villa, Ferrari, immeuble, etc.)

**FLUX:**

1. **Quand team créer un nouveau vault pour un asset :**
   - Tu appelles Factory.createVault avec config:
     - Produit = House / car / boat / tools / other
     - assetName = "Villa Azur Nice"
     - creditAmount = 5M USDC
     - creditDuration = 15 ans
     - repaymentFrequency = QUARTERLY
     - baseAPY = 5%
     - borrowBaseRate = 2%
     - borrowSlope = 5%
   - Factory **DÉPLOIE** un nouveau contrat CantorVault (clone)
   - Factory **CRÉE** un CVT token unique pour cette villa (cvVault_nice)
   - Factory enregistre ce vault dans CantorProtocol
   - Factory émet event "VaultCreated"

2. **Quand les suppliers commencent à supplier USDC:**
   - Suppliers envoient USDC au vault
   - Vault mint des CVT tokens pour les suppliers
   - Les USDC s'accumulent dans le vault

3. **Quand toi tu empruntes USDC du vault pour acheter la villa:**
   - Tu appelles vault.borrow(5M)
   - Vault te donne 5M USDC
   - Tu vends 5M USDC en EUR sur CEX
   - Tu achètes la villa
   - Vault enregistre: investmentDate = aujourd'hui, phase INVESTISSEMENT commence

4. **Quand tu reçois les loyers (20k/mois):**
   - Tu convertis 20k EUR en USDC
   - Tu appelles vault.addRevenue(20k)
   - Vault distribue 20k au prorata des suppliers
   - CVT de chaque supplier augmente légèrement

5. **Quand tu dois rembourser le crédit (87k/trimestre):**
   - Tu empruntes 87k EUR auprès d'une banque
   - Tu convertis 87k EUR en USDC
   - Tu appelles vault.processRepayment(87k)
   - Vault distribue 87k au prorata des suppliers
   - totalRepaid += 87k

6. **Quand totalRepaid == creditAmount (15 ans plus tard):**
   - Vault se ferme automatiquement
   - Intérêts s'arrêtent
   - Seulement revenus RWA (loyers) continuent

7. **Fees:**
   - Setup fee = 1% de creditAmount = 50k USDC
   - Performance fee = 10% de chaque addRevenue
   - Les fees vont à FeeCollector → puis à CantorStaking

**EN RÉSUMÉ:** Factory = l'usine qui crée les vaults. Chaque vault = un bien. Les suppliers financent le bien. Tu empruntes du vault pour acheter. Les remboursements et loyers vont aux suppliers.

---

## 3. `CantorVault.sol`

**CE QUE FAIT CantorVault:**

CantorVault = le **CŒUR** du protocole. C'est là où tout l'argent circule. Un vault = UN BIEN = UN CRÉDIT de x ans.

**FLUX COMPLET D'UN VAULT:**

### PHASE 1: ACCUMULATION (avant achat du bien)

**Jour 1: Vault créé**
- investmentDate = 0 (pas encore investi)
- Suppliers peuvent maintenant supplier USDC

**Supplier A dépose 500k USDC:**
- Appelle vault.supply(500k, lockConfig)
- Vault reçoit 500k USDC
- Vault mint 500k CVT tokens pour Supplier A
- Position de Supplier A créée:
  - amount = 500k
  - cvtBalance = 500k
  - isLocked = true/false selon lockConfig
  - lockEndDate = maintenant + lockDuration
  - interestPending = 0
  - revenuePending = 0
  - capitalPending = 0

**Chaque jour qui passe (pendant ACCUMULATION):**
- Intérêts accumulés = 500k × 5% APY / 365 = ~68 USDC par jour
- Supplier A.interestPending += 68
- Supplier A ne reçoit pas l'argent automatiquement - c'est juste ACCUMULÉ
- Supplier A peut appeler claimInterests() quand il veut pour retirer les 68 USDC (ou plus)

**Supplier B dépose 500k USDC:**
- Même processus
- Maintenant totalSupplied = 1M USDC

**Supplier A emprunte 250k USDC (max 75% de 500k = 375k):**
- Appelle vault.borrow(250k)
- Vault donne 250k USDC à Supplier A
- totalBorrowed = 250k
- utilizationRate = 250k / 1M = 25%
- borrowRate = 2% (baseRate) + 5% (slope) × 25% = 3.25%
- Chaque jour: borrowInterest = 250k × 3.25% / 365 = ~22 USDC
- Ces 22 USDC vont à revenuePending de TOUS les suppliers au prorata:
  - Supplier A.revenuePending += 11 (50%)
  - Supplier B.revenuePending += 11 (50%)

**Supplier A retire 250k USDC (early withdrawal):**
- Appelle vault.withdraw(250k)
- Vault vérifie: amount - borrowedAmount = 500k - 250k = 250k (ok, peut retirer)
- Si lockConfig.canWithdrawEarly = true et lock pas terminé:
  - Vault prélève earlyWithdrawalFee (ex: 10% = 25k)
  - Supplier A reçoit 225k USDC
  - Vault brûle 225k CVT
  - Les 25k de pénalité vont à revenuePending de Supplier B

### PHASE 2: INVESTISSEMENT (après achat du bien)

**Tu achètes la villa 5M USDC:**
- Tu empruntes 5M USDC du vault (où es les suppliers)
- Tu vends 5M USDC en EUR
- Tu achètes la villa
- Tu appelles vault.setInvestmentDate(maintenant)
- investmentDate != 0 → PHASE INVESTISSEMENT commence
- Intérêts continuent comme avant MAIS maintenant les remboursements crédit arrivent

**Month 1: Tu reçois loyers 20k EUR:**
- Tu convertis 20k EUR en USDC
- Tu appelles vault.addRevenue(20k)
- Vault distribue 20k au prorata:
  - totalSupplied = 750k (Supplier A a retiré, Supplier B en a 500k)
  - Supplier B.revenuePending += 20k (100%)
- Performance fee = 10% de 20k = 2k → FeeCollector
- Vault augmente CVT de Supplier B: il reçoit +2.67 CVT supplémentaire

**Month 3 (trimestre): Tu dois rembourser 87k USDC au crédit:**
- Tu empruntes 87k EUR
- Tu convertis en USDC
- Tu appelles vault.processRepayment(87k)
- Vault distribue 87k au prorata:
  - Supplier B.capitalPending += 87k (100%)
- totalRepaid += 87k
- Intérêts continuent (5% APY)

**Month 4: Supplier B retire ses intérêts:**
- Appelle vault.claimInterests()
- Supplier B reçoit les interestPending (accumulés depuis le jour 1)
- Supplier B.interestPending = 0

**Month 5: Supplier B retire les revenus RWA:**
- Appelle vault.claimRevenue()
- Supplier B reçoit revenuePending (loyers + intérêts borrow)
- Supplier B.revenuePending = 0

**Month 6: Supplier B retire le capital remboursé:**
- Appelle vault.claimCapital()
- Supplier B reçoit capitalPending (remboursements crédit)
- Supplier B.capitalPending = 0

### PHASE 3: MATURITÉ (crédit payé)

**15 ans plus tard: totalRepaid == creditAmount (5M USDC)**
- Vault se ferme automatiquement
- Intérêts s'arrêtent (baseAPY n'existe plus)
- Seulement revenus RWA (loyers) continuent
- Supplier B continue à recevoir les loyers

**EN RÉSUMÉ CantorVault:**
- Reçoit USDC des suppliers → mint CVT
- Accumule intérêts quotidiens (pas distribué auto)
- Reçoit borrow → calcule intérêts variables dynamiques
- Reçoit loyers → distribue au prorata à revenuePending
- Reçoit remboursements crédit → distribue au prorata à capitalPending
- Suppliers peuvent claim interestPending, revenuePending, capitalPending quand ils veulent
- Durée = nombre de remboursements jusqu'à totalRepaid == creditAmount

---

## 4. `CVT (ERC20).sol`

**CE QUE FAIT CVT:**

CVT = le **TOKEN DE PARTS** du vault. Chaque vault a SON PROPRE CVT token.

**Exemple:**
- Vault Villa Azur Nice → Token: cvVault_nice
- Vault Ferrari → Token: cvVault_ferrari
- Vault Immeuble Paris → Token: cvVault_paris

**FLUX:**

**Quand Supplier A dépose 500k USDC:**
- Vault mint 500k cvVault_nice tokens
- Supplier A reçoit 500k cvVault_nice
- Le token représente sa part du vault

**Quand tu ajoutes des revenus RWA (20k loyers):**
- Les suppliers reçoivent de l'USDC distribué au prorata
- MAIS aussi, leurs CVT augmente de valeur légèrement
- Pourquoi? Parce que le vault a plus d'USDC maintenant
- Exemple: avant addRevenue, 500k CVT = 500k USDC
- Après addRevenue de 20k (Supplier B reçoit tout), CVT de Supplier B vaut plus
- En réalité, Supplier B reçoit aussi du CVT supplémentaire mint

**Quand Supplier A retire 225k USDC (early withdrawal):**
- Vault brûle 225k cvVault_nice
- Supplier A reçoit 225k USDC
- cvVault_nice total supply = 775k (500k + 500k - 225k)

**EN RÉSUMÉ CVT:**
- Mint quand supplier dépose
- Représente sa part du vault
- Augmente (reçoit CVT supplémentaire) quand revenus ajoutés
- Brûle quand supplier retire
- Un token différent par vault

**Source:** Section 243-257 de l'architecture

---

## 5. `CantorVaultInterestModel.sol`

**CE QUE FAIT CantorVaultInterestModel:**

C'est une **LIBRAIRIE DE CALCUL** pour le taux d'emprunt DYNAMIQUE.

**FLUX:**

**Situation:**
- totalSupplied = 1M USDC
- totalBorrowed = 250k USDC
- utilizationRate = 250k / 1M = 25%

**CantorVault appelle CantorVaultInterestModel.calculateBorrowRate():**
- baseRate = 2% (configuré)
- slope = 5% (configuré)
- utilization = 25%
- **borrowRate = 2% + (5% × 25%) = 2% + 1.25% = 3.25%**

**Chaque jour:**
- borrowInterest = 250k × 3.25% / 365 = ~22 USDC
- Cet intérêt va à revenuePending de tous les suppliers

**Si quelqu'un emprunte 500k USDC de plus:**
- totalBorrowed = 750k
- utilizationRate = 750k / 1M = 75%
- borrowRate = 2% + (5% × 75%) = 2% + 3.75% = **5.75%**
- Plus cher d'emprunter! C'est voulu - pour décourager l'emprunt excessif

**Si quelqu'un rembourse 250k USDC:**
- totalBorrowed = 500k
- utilizationRate = 500k / 1M = 50%
- borrowRate = 2% + (5% × 50%) = 2% + 2.5% = **4.5%**
- Moins cher maintenant

**EN RÉSUMÉ CantorVaultInterestModel:**
- Calcule borrowRate = baseRate + (slope × utilization)
- Plus l'utilization est haute, plus l'emprunt est cher
- Incite les gens à rembourser quand utilization élevée
- **Aucune restriction imposée - juste le calcul du taux**

**Source:** Section 370-378 de l'architecture

---

## 6. `CantorToken (CANTOR).sol`

**CE QUE FAIT CantorToken:**

CantorToken = le **TOKEN DU PROTOCOLE ENTIER** (pas un vault spécifique, mais le protocole CantorFi en général).

**FLUX:**

**Quand CantorFi démarre:**
- Admin mint 1M CANTOR tokens (ou autre montant initial)
- Ces tokens sont distribués aux core team, treasury, etc.

**Quand quelqu'un veut staker du CANTOR (voir CantorStaking):**
- Ils envoient CANTOR à CantorStaking
- CantorStaking brûle CANTOR et mint sCANTOR (ou un token de staking)
- Ils reçoivent une part des fees du protocole (en USDC)

**Quand il y a une gouvernance vote:**
- Holders de CANTOR peuvent voter sur des décisions du protocole
- Ex: augmenter/diminuer les fees, ajouter une nouvelle chaîne, etc.

**Multi-chaîne:**
- CantorToken existe sur Ethereum, Polygon, Arbitrum, etc.
- Tu peux bridger CANTOR d'une chaîne à une autre
- Utilise LayerZero ou Axelar pour le bridge

**Emission/Deflation:**
- Admin peut mint du CANTOR supplémentaire si besoin
- FeeCollector peut acheter CANTOR sur DEX et le brûler (deflation)
- Plus de CANTOR brûlé = plus de valeur pour les holders restants

**EN RÉSUMÉ CantorToken:**
- ERC20 standard + multi-chaîne
- Représente la propriété du protocole entier
- Donne droit à gouvernance + revenus du protocole via staking
- **Pas de restrictions - c'est juste un token**

**Source:** Section 803-813 de l'architecture

---

## 7. `FeeCollector.sol`

**CE QUE FAIT FeeCollector:**

FeeCollector = le **COFFRE-FORT** qui collecte tous les frais du protocole et les distribue.

**FLUX:**

**Quand un vault est créé:**
- Factory prélève setup fee = 1% du creditAmount
- Exemple: creditAmount = 5M → setup fee = 50k USDC
- Ces 50k arrivent directement à FeeCollector

**Chaque mois, tu ajoutes des loyers (addRevenue):**
- FeeCollector prélève performance fee = 10% des revenus
- Exemple: addRevenue(20k) → performance fee = 2k USDC
- Ces 2k arrivent à FeeCollector

**FeeCollector accumule tous les USDC:**
- De tous les vaults (setup fees + performance fees)
- Total accumulé = des milliers d'USDC chaque mois (si tu as beaucoup de vaults)

**Quand CantorStaking a besoin de récompenser les stakers:**
- Appelle FeeCollector.distributeFees(amount)
- FeeCollector envoie X USDC à CantorStaking
- CantorStaking distribue aux stakers de CANTOR

**Option: Buyback et Burn:**
- FeeCollector peut acheter CANTOR sur un DEX avec une partie des USDC
- Puis brûler ce CANTOR
- Pourquoi? Deflation = CANTOR devient plus rare = plus de valeur
- Les holders de CANTOR qui ne brûlent pas gagnent en valeur

**Multi-chaîne:**
- FeeCollector existe sur chaque chaîne
- Collecte les fees de chaque chaîne
- Envoie les fees au CantorStaking de chaque chaîne

**EN RÉSUMÉ FeeCollector:**
- Reçoit fees de TOUS les vaults (setup + performance)
- Accumule USDC
- Distribue aux stakers du protocole
- Peut buyback/burn CANTOR pour deflation
- **Point d'entrée de revenu pour les holders de CANTOR**

**Source:** Section 893-905 de l'architecture

---

## RÉSUMÉ: COMMENT L'ARGENT CIRCULE DANS LE PROTOCOLE

```
SUPPLIERS USDC
    ↓
VAULT (accumule, accumule intérêts, mint CVT)
    ↓
TOI empruntes pour acheter bien
    ↓
BIEN génère REVENUS (loyers)
    ↓
TU ajoutes revenus au vault (addRevenue)
    ↓
VAULT distribue au prorata à revenuePending
    ↓
TU rembourses crédit (processRepayment)
    ↓
VAULT distribue au prorata à capitalPending
    ↓
SUPPLIERS clament: interestPending, revenuePending, capitalPending
    ↓
FEES (setup + performance) → FeeCollector
    ↓
FeeCollector → CantorStaking
    ↓
Stakers de CANTOR reçoivent USDC

15 ANS PLUS TARD:
Crédit payé → Vault ferme
SUPPLIERS ont reçu: intérêts + revenus RWA + capital
TOI a l'asset en totalité
```

---

## Ordre d'implémentation (basé sur dépendances):

```
1. CantorProtocol.sol              (Registry - zéro dépendances)
2. CantorVaultInterestModel.sol    (Utils - zéro dépendances)
3. CantorToken.sol                 (Token - zéro dépendances)
4. CVT.sol                         (Token simple - template)
5. CantorVault.sol                 (Principal - dépend de CantorVaultInterestModel)
6. CantorHouseFactory.sol          (Factory - crée les vaults)
7. FeeCollector.sol                (Collecte et distribue fees)
```

---

## Structure finale des dossiers:

```
backend/contracts/
├── CantorProtocol.sol
├── CantorVaultInterestModel.sol
├── CantorToken.sol
├── CVT.sol
├── CantorVault.sol
├── CantorHouseFactory.sol
└── FeeCollector.sol
```

---

**MAINTENANT C'EST CLAIR? Chaque contrat a un rôle précis et l'argent circule dans un flux logique?**
