# 📋 ARCHITECTURE COMPLÈTE DU PROTOCOLE CANTOR VAULT

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Concepts clés](#concepts-clés)
3. [Structure des vaults](#structure-des-vaults)
4. [Timeline d'un vault](#timeline-dun-vault)
5. [Tokens et positions](#tokens-et-positions)
6. [Mécaniques de rendement](#mécaniques-de-rendement)
7. [Supply & Borrow](#supply--borrow)
8. [Configurations flexibles](#configurations-flexibles)
9. [Exemples concrets](#exemples-concrets)
10. [Smart Contracts](#smart-contracts)

---

## 🎯 Vue d'ensemble

**Cantor Vault** est un protocole décentralisé qui finance l'acquisition d'actifs réels (Real World Assets - RWA) via des crédits à long terme.

**Principle fondamental:**
- Les utilisateurs (suppliers) financent un crédit immobilier/asset de 15 ans
- Ils reçoivent des tokens CVT qui leur donnent droit aux remboursements + intérêts
- Le crédit se rembourse progressivement pendant 15 ans (ou autre durée)
- À chaque remboursement, les suppliers gagnent sur les intérêts et le capital

**Différence avec Aave/Compound:**
- Aave = Liquidité instantanée + APY fixes
- Cantor = Financement d'actifs réels avec remboursement sur X années + revenus RWA progressifs

---

## 🔑 Concepts clés

### 1. **Vault (Coffre-fort)**
Un vault = Un crédit pour acheter 1 actif réel
- 1 Immobilier = 1 Vault
- 1 Véhicule = 1 Vault
- 1 Bateau = 1 Vault
- Etc.

**Chaque vault a sa propre configuration:**
```
VaultConfig = {
  assetName: "Villa Azur Nice",
  assetType: "Real Estate",           // Real Estate, Vehicles, Marine, Equipment
  assetPrice: 500_000 USDC,           // Valeur du bien
  maxLiquidity: 5_000_000 USDC,       // 10x le prix = limite de supply
  creditDuration: 15 years,           // Durée du crédit (5/10/15/20 ans possible)
  repaymentFrequency: "QUARTERLY",    // Mensuel ou Trimestriel
  lockRequired: true,                 // Faut-il lock au départ?
  lockDuration: 2 years,              // Durée du lock si applicable
  baseAPY: 5%,                        // APY pendant phase accumulation
  borrowRate: "VARIABLE",             // Taux d'emprunt (fixe ou variable)
  admin: 0x123...                     // Qui gère ce vault
}
```

### 2. **Phases d'un Vault**

#### **PHASE 1: ACCUMULATION (0-2 ans)**
- **But:** Accumuler les fonds pour acheter l'actif réel
- **Durée:** ~2 ans (configurable)
- **Suppliers:** Déposent USDC, reçoivent CVT
- **Rendement:** APY fixe (ex: 5% par an)
- **Trésorier (Toi):**
  - Accumule les fonds
  - Prépare l'achat du bien
  - Hypothèque une partie si besoin

**Exemple:**
```
Jour 1: 10 suppliers déposent chacun 500k USDC
       Total TVL = 5M USDC
       Bien coûte 5M → Tu peux l'acheter!
       Ou tu attends et tu hypothèques pour plus de capital
```

#### **PHASE 2: INVESTISSEMENT (2+ ans)**
- **But:** Rembourser le crédit progressivement
- **Suppliers:** CVT toujours locké (ou pas selon config)
- **Rendement:**
  - APY de base (intérêts du crédit)
  - + Revenus du RWA (loyers, dividendes, etc.)
- **Trésorier (Toi):**
  - Rembourses le crédit chaque mois/trimestre
  - Ajoutes les revenus RWA au vault
  - Les deux vont aux suppliers

**Exemple:**
```
Year 2: Tu achètes la villa 5M USDC
        Tu finances avec un crédit de 15 ans
        Chaque trimestre tu rembourses ~87k USDC

        Chaque mois, la villa génère:
        - 20k USDC de loyers
        → Tout rentre dans le vault

        Suppliers reçoivent:
        - 87k USDC (remboursement trimestriel)
        - 20k USDC/mois (loyers)
        Total = Intérêts + Capital progressif
```

#### **PHASE 3: MATURITÉ (15 ans)**
- **But:** Rembourser complètement le crédit
- **Rendement:** Continue comme phase 2
- **À la fin (Year 15):**
  - Le crédit est totalement remboursé
  - Suppliers retirent leur solde complet
  - Toi tu as l'asset en totalité

---

## 🏗️ Structure des Vaults

### Vault Info (données permanentes)
```solidity
struct VaultInfo {
    uint256 vaultId;                    // ID unique
    string assetName;                   // "Villa Azur Nice"
    string assetType;                   // "Real Estate"
    string location;                    // "Nice, France"
    uint256 assetPrice;                 // 500,000 USDC
    uint256 maxLiquidity;               // 5,000,000 USDC (10x)
    uint256 creditDuration;             // 15 years (en secondes)
    RepaymentFrequency frequency;       // MONTHLY ou QUARTERLY
    bool isActive;                      // Peut-on supplier?
    uint256 createdAt;                  // Timestamp création
    uint256 investmentDate;             // Quand l'asset a été acheté
    address treasury;                   // Adresse qui gère (toi)
}
```

### Vault State (données dynamiques)
```solidity
struct VaultState {
    uint256 totalSupplied;              // Total USDC supplé
    uint256 totalBorrowed;              // Total emprunté
    uint256 availableLiquidity;         // Fonds disponibles
    uint256 utilizationRate;            // % utilisé (borrow/supply)

    // Revenus RWA
    uint256 totalRevenuesAdded;         // Total loyers/revenus ajoutés
    uint256 totalRevenuesClaimed;       // Total retiré par suppliers
    uint256 revenueRemainder;           // Arrondis/reste

    // Remboursements du crédit
    uint256 nextRepaymentAmount;        // Montant du prochain paiement
    uint256 nextRepaymentDate;          // Date du prochain paiement
    uint256 totalRepaid;                // Total remboursé jusqu'à maintenant
}
```

### Position d'un Supplier
```solidity
struct Position {
    address supplier;                   // Qui a supplé?
    uint256 amount;                     // 500k USDC
    uint256 cvtBalance;                 // Tokens reçus
    LockConfig lockConfig;              // Config du lock
    bool isLocked;                      // Actuellement locké?
    uint256 lockEndDate;                // Date fin du lock (si applicable)

    // Rendements accumulés
    uint256 interestClaimed;            // Intérêts retirés
    uint256 revenueClaimed;             // Revenus RWA retirés
    uint256 capitalClaimed;             // Capital remboursé

    // Pour savoir combien doit retirer
    uint256 interestPending;            // Intérêts non retirés
    uint256 revenuePending;             // Revenus RWA non retirés
    uint256 capitalPending;             // Capital non retiré
}
```

---

## ⏱️ Timeline d'un Vault

```
┌─────────────────────────────────────────────────────────────────┐
│                     VAULT TIMELINE (15 ans)                     │
└─────────────────────────────────────────────────────────────────┘

ANNÉE 0-2: PHASE ACCUMULATION
│
├─ Day 1: Vault ouvert
│         └─ Suppliers peuvent supply
│
├─ Month 1-24: Accumulation
│         └─ TVL monte progressivement
│         └─ Rendement: APY fixe (ex: 5%)
│         └─ Pas de remboursement crédit encore
│
├─ Month 24: Acquisition du bien
│         └─ Tu as assez d'argent
│         └─ Tu achètes l'asset
│         └─ Eventuellement tu hypothèques
│
└─ Transition vers Phase Investissement


ANNÉE 2-17: PHASE INVESTISSEMENT (15 ans de crédit)
│
├─ Month 25: Premier remboursement du crédit
│         └─ 87k USDC (exemple pour crédit 5M sur 15 ans)
│         └─ Distribué aux suppliers au prorata
│
├─ Month 25+: Revenus RWA
│         └─ Loyers immobilier: +20k/mois
│         └─ Remboursement crédit: +87k/trimestre
│         └─ Tous deux distribués aux suppliers
│
├─ Month 180 (15 ans): Dernier remboursement
│         └─ Crédit totalement remboursé
│         └─ Asset paid off = Appartient à 100% au vault
│
└─ Post-remboursement:
          └─ Suppliers continuent à recevoir revenus RWA
          └─ Intérêts s'arrêtent (crédit payé)
          └─ Seulement revenus RWA après


VIA EXEMPLE CONCRET:

Supplier A: Supply 500k USDC, Lock 5 ans
─────────────────────────────────────────
Month 1-24:    Reçoit 5% APY = ~50k USDC d'intérêts
Month 25-60:   Reçoit remboursement crédit + loyers
               APY effectif = 8% (5% + 3% RWA)
Month 61+:     Lock terminé, CVT peut être retiré
               Mais intérêts continuent si on veut rester
Year 15:       Crédit payé, supplier a reçu capital + intérêts
               Peut retirer son solde complet
```

---

## 💰 Tokens et Positions

### CVT: Cantor Vault Token

**Nature:** ERC20 standard
**Un CVT par vault:** cvVault_001, cvVault_002, etc.

```solidity
contract cvVault_001 is ERC20 {
    // Vault-specific token
    // Exemple: 1 token = droit proportionnel au vault
    //
    // Si vault TVL = 5M USDC
    // Et toi tu supplies 500k USDC
    // Tu reçois 500k cvVault_001 tokens
    // (Ou un ratio différent selon implementation)
}
```

### Config du Lock (Flexible)

```solidity
enum LockDuration {
    NO_LOCK,      // Pas de lock du tout
    LOCK_1_YEAR,
    LOCK_2_YEARS,
    LOCK_5_YEARS,
    LOCK_10_YEARS,
    LOCK_15_YEARS
}

struct LockConfig {
    bool hasLock;               // Y a-t-il un lock?
    uint256 lockDurationSeconds; // Combien de temps?
    bool canWithdrawEarly;      // Peut retirer avant? (pénalité?)
    uint256 earlyWithdrawalFee; // Si oui, combien de pénalité?
}
```

**À TOI DE DÉCIDER pour chaque vault:**
- Vault A: Lock obligatoire 2 ans, pas d'early exit
- Vault B: Pas de lock, flexibilité totale
- Vault C: Lock 5 ans avec 10% pénalité si early exit

---

## 📈 Mécaniques de Rendement

### Rendement = 3 sources

#### 1. **Intérêts du crédit (APY de base)**
```
Formule simple:
Interest Per Year = Supply Amount × Base APY

Exemple:
Supply: 500k USDC
Base APY: 5%
Year 1 Interest: 500k × 5% = 25k USDC
```

#### 2. **Revenus RWA (Loyers, dividendes, etc.)**
```
Tu ajoutes manuellement chaque mois:
"J'ajoute 20k USDC de loyers du mois"

Distribution au prorata:
Supplier A balance = 500k
Supplier B balance = 500k
Total = 1M

20k revenus → 10k à A, 10k à B (50/50)
```

#### 3. **Remboursement du crédit (Capital progressif)**
```
Crédit: 5M USDC sur 15 ans, taux 4%
Remboursement trimestriel = ~87k USDC

Composé de:
- Capital: ~50k
- Intérêts: ~37k

Distribution au prorata des suppliers
```

### Total APY = Intérêts + RWA Yield

```
Exemple réaliste:

Phase Accumulation (Year 1-2):
APY effectif = 5% (intérêts du crédit)

Phase Investissement (Year 3-15):
APY effectif = 5% (intérêts) + 3% (loyers) = 8%

Post-remboursement (Year 15+):
APY effectif = 0% (crédit payé) + 3% (loyers) = 3%
```

---

## 💼 Supply & Borrow

### Supply: Fournir de la liquidité

```
Step 1: User approve USDC
        user.approve(vault, 500_000)

Step 2: User supply
        vault.supply(500_000, LockConfig)
        ├─ 500k USDC arrive au vault
        └─ User reçoit 500k cvVault_001 tokens

Step 3: Intérêts s'accumulent
        Chaque jour: interest += balance × APY / 365

Step 4: Quand lock = done
        User peut retirer + intérêts + revenus RWA

Step 5: Pas de lock?
        User peut retirer quand il veut
```

### Borrow: Emprunter contre le vault

```
Configuration flexible:
- Borrow Rate = Variable ou Fixe
- Variable = baseRate + (slope × utilization)

Exemple:
baseRate = 2%
slope = 5%
utilization = 80%
→ borrowRate = 2% + (5% × 0.8) = 6%

Max Borrow = 75% du Supply
Si 5M de supply → max 3.75M d'emprunt possible

Les intérêts de borrow vont aux suppliers
```

---

## ⚙️ Configurations Flexibles

### Pour CHAQUE VAULT, tu choisis:

```
┌─ Asset Info ─────────────────────
│  ├─ Nom de l'asset
│  ├─ Type (Real Estate, Vehicles, etc.)
│  ├─ Prix
│  └─ Max Liquidity (10x prix ou autre)
│
├─ Crédit Parameters ──────────────
│  ├─ Durée (5/10/15/20 ans)
│  ├─ Fréquence remboursement (Monthly/Quarterly)
│  └─ Taux d'intérêt du crédit (4%, 5%, etc.)
│
├─ Lock Configuration ─────────────
│  ├─ Lock obligatoire? (OUI/NON)
│  ├─ Durée du lock si oui (1/2/5/10/15 ans)
│  ├─ Early exit possible? (OUI/NON)
│  └─ Pénalité early exit (10%, 20%, etc.)
│
├─ Borrow Parameters ──────────────
│  ├─ Borrow rate (FIXE ou VARIABLE)
│  ├─ Base rate (2%)
│  ├─ Slope rate (5%)
│  └─ Max borrow ratio (75% du supply)
│
└─ Admin Controls ─────────────────
   ├─ Qui peut ajouter des revenus RWA?
   ├─ Qui peut déclencher les remboursements?
   └─ Pause/Resume possible?
```

**Aucune règle universelle imposée! À TOI de configurer chaque vault.**

---

## 💡 Exemples Concrets

### Exemple 1: Villa Azur Nice (Lock obligatoire, 15 ans)

```
CONFIGURATION:
├─ Asset: Villa Nice, €500k
├─ Max Supply: 5M USDC
├─ Credit Duration: 15 ans
├─ Repayment: Trimestriel
├─ Lock: OUI, 2 ans obligatoire, pas early exit
├─ Base APY: 5%

TIMELINE:

Month 1: 10 suppliers déposent 500k chacun
         Total TVL = 5M USDC
         Chacun reçoit 500k cvVault_nice tokens
         Lock = locked 2 ans

Month 1-24: Phase Accumulation
            Intérêts: 5% APY = ~2.5k par mois par supplier
            Suppliers gagnent: 25k × 24 mois = 600k (exemple)

Month 25: Tu achètes la villa 5M
          Crédit: 5M sur 15 ans @ 4%
          Remboursement trimestriel: 87k USDC

Month 25-60: Phase Investissement
             Chaque trimestre:
             - 87k USDC remboursement crédit
             - 20k USDC loyers
             Total = 107k distribués

             Par supplier (500k supply):
             107k × (500k/5M) = 10.7k par trimestre
             = 43k par an (au lieu des 25k avant)

Month 24: Lock terminé
          Suppliers PEUVENT retirer leurs CVT
          Mais intérêts continuent
          (Plupart vont rester pour les loyers)

Year 15: Crédit payé
         Suppliers ont reçu:
         - Intérêts: ~90k total
         - Revenus RWA: ~360k total (20k × 12 × 15)
         - Capital: 500k (leur dépôt initial)
         Total retrait: ~950k USDC
         ROI: 90% sur 15 ans = 6% APY effectif
```

### Exemple 2: Ferrari (Pas de lock, flexible, 10 ans)

```
CONFIGURATION:
├─ Asset: Ferrari, €300k
├─ Max Supply: 3M USDC
├─ Credit Duration: 10 ans
├─ Repayment: Mensuel
├─ Lock: NON, totalement flexible
├─ Base APY: 6%

TIMELINE:

Month 1: 6 suppliers déposent 500k chacun
         Total TVL = 3M USDC
         Pas de lock = retrait possible immédiatement

Month 1-24: Phase Accumulation
            Intérêts: 6% APY (plus que villa car risque)
            Suppliers peuvent retirer quand ils veulent

Month 15: Un supplier withdraw 250k
          Plus 40k d'intérêts accumulés
          TVL devient 2.75M

Month 25: Tu achètes la Ferrari, 3M
          Crédit: 3M sur 10 ans @ 5%
          Remboursement mensuel: 31.8k USDC

Month 25+: Phase Investissement
           - Remboursement: 31.8k/mois
           - Location/dividend: 5k/mois
           - Total: 36.8k distribué

           Suppliers restants reçoivent au prorata

Year 10: Crédit payé
         Tous les revenus cessent sauf si la Ferrari
         continue à générer des revenus
```

### Exemple 3: Immeuble Parisien (Lock 5 ans, 20 ans)

```
CONFIGURATION:
├─ Asset: Immeuble Paris, €2M
├─ Max Supply: 20M USDC (10x)
├─ Credit Duration: 20 ans
├─ Repayment: Mensuel
├─ Lock: OUI, 5 ans, early exit 15% pénalité
├─ Base APY: 4% (sûr, immobilier)

TIMELINE:

Month 1-50: Phase Accumulation
            TVL monte lentement
            Borrow possible dès 100k supplé
            Max borrow = 75k (variable rate)

Month 25: TVL = 15M
          Tu achètes immeuble 20M
          Budget = 15M + hypothèque 5M
          Crédit total: 20M sur 20 ans @ 3.5%
          Remboursement mensuel: 105k

Month 25+: Phase Investissement
           - Remboursement: 105k/mois
           - Loyers: 80k/mois
           - Total: 185k distribué

           Suppliers reçoivent au prorata

Month 60: Lock 5 ans terminé
          Suppliers peuvent retirer sans pénalité
          Beaucoup resteront pour les loyers

Month 240 (20 ans): Crédit payé
                    Immeuble paid off
                    Suppliers ont eu:
                    - 5 ans à 4% APY
                    - 15 ans à ~7% APY (intérêts + loyers)
```

---

## 🛠️ Smart Contracts

### Architecture globale

```
Contracts:
├─ CANTORVaultFactory.sol
│  └─ Crée et gère les vaults
│
├─ CANTORVault.sol
│  └─ Logique supply/borrow/repayment pour 1 vault
│
├─ CVT (ERC20).sol
│  └─ Token spécifique à chaque vault (auto-généré)
│
├─ CANTORVaultInterestModel.sol
│  └─ Calcul des intérêts variables
│
└─ CANTORGovernanceToken.sol (futur)
   └─ Token CANTOR pour gouvernance
```

### Interface CANTORVault

```solidity
interface ICANTORVault {
    // ADMIN FUNCTIONS
    function addRevenue(uint256 amount) external;
    function processRepayment(uint256 amount) external;
    function pause() external;
    function unpause() external;

    // USER FUNCTIONS
    function supply(uint256 amount, LockConfig lockConfig) external;
    function withdraw(uint256 amount) external;
    function claimInterests() external;
    function claimRevenue() external;
    function claimCapital() external;

    // BORROW FUNCTIONS
    function borrow(uint256 amount) external;
    function repayBorrow(uint256 amount) external;

    // VIEW FUNCTIONS
    function getVaultInfo() external view returns (VaultInfo);
    function getVaultState() external view returns (VaultState);
    function getUserPosition(address user) external view returns (Position);
    function calculateBorrowRate() external view returns (uint256);
    function getUtilizationRate() external view returns (uint256);
}
```

---

## 📊 Résumé des données clés

| Paramètre | Flexible? | Valeurs possibles |
|-----------|-----------|------------------|
| Durée du crédit | ✅ OUI | 5/10/15/20 ans |
| Remboursement | ✅ OUI | Mensuel ou Trimestriel |
| Lock obligatoire | ✅ OUI | OUI ou NON |
| Durée du lock | ✅ OUI | 0/1/2/5/10/15 ans |
| Early exit | ✅ OUI | Possible ou non |
| Pénalité early exit | ✅ OUI | 0-50% |
| Base APY | ✅ OUI | 1-20% possible |
| Borrow rate | ✅ OUI | FIXE ou VARIABLE |
| Max borrow ratio | ✅ OUI | 50-80% possible |
| Asset type | ✅ OUI | Real Estate, Vehicles, Marine, etc. |

---

## 🎯 Prochaines étapes

1. ✅ Architecture validée
2. ⏳ Créer CANTORVaultFactory.sol
3. ⏳ Créer CANTORVault.sol
4. ⏳ Créer logique des intérêts
5. ⏳ Créer logique des revenus RWA
6. ⏳ Tests & déploiement
7. ⏳ Adapter frontend

---

**Questions ou clarifications à ajouter? À toi de dire!** 🚀


Yes 👌 on va te faire un vrai “plan de métro” de CantorFi.

Je te fais d’abord un **gros schéma ASCII** (facile à visualiser), puis je t’explique les rôles de chaque bloc + les partenaires dont tu as besoin.

---

## 1. Schéma global (vue d’ensemble)

```text
──────────────────────────────── CANTORFI V2 ────────────────────────────────

 [ INVESTISSEUR ]
      |
      | 1) EUR / CB / Crypto
      v
+-------------------+                 +-----------------------+
|  On-ramp / CEX    |<----(option)----|  Wallet de l'user     |
| (Moonpay, etc.)   |                 |  (Metamask, etc.)     |
+-------------------+                 +-----------------------+
      |                                        |
      | 2) USDC / ETH                          |
      +--------------------------+-------------+
                                 |
                                 v
                      (On-chain CantorFi RWA Layer)
                      --------------------------------
                                 |
                        +---------------------+
                        | CantorProtocol      |
                        |  (Registry)         |
                        +----------+----------+
                                   |
                      createVault  |  référence des deals
                                   v
                         +----------------------+
                         | CantorHouseFactory   |
                         +----------+-----------+
                                    |
                   déploie         | new CantorHouseVault
                                    v
                         +----------------------+
                         | CantorHouseVault #1  |  <---  un contrat par bien
                         | (asset: USDC/ETH)    |
                         +----------+-----------+
                                    |
             deposit / withdraw     |  addYield(loyers)
                                    v
                         +----------------------+
                         |  Token de parts      |
                         |  cHOUSE1 (ERC20)     |
                         +----------------------+

──────────────────────── BRIDGE OFF-CHAIN (ta société) ─────────────────────

 On-chain (vault)                                Off-chain (monde réel)
 ----------------                                -------------------------
                         managerWithdraw()
 CantorHouseVault #1  ---------------->  [ Compte CEX de ta société ]
                                              |
                                              | vente USDC → EUR
                                              v
                                       [ Banque de ta société ]
                                              |
                                              | virement / paiement
                                              v
                                      [ Vendeur du bien / Notaire ]
                                              |
                                              | achat + travaux + gestion
                                              v
                                         [ Locataires ]
                                              |
                                              | loyers (en fiat)
                                              v
                                       [ Banque de ta société ]
                                              |
                                              | conversion EUR → USDC
                                              v
                                      [ Compte CEX de ta société ]
                                              |
                                              | envoi USDC on-chain
                                              v
                                    CantorHouseVault #1 (addYield)

──────────────────────── LAYER PROTOCOLE / TOKEN CANTOR ────────────────────

                     (On-chain CantorFi Protocol Layer)
                     -----------------------------------
                                  
                      +-----------------------+
                      |     CantorToken       |
                      |       CANTOR          |
                      +-----------+-----------+
                                  |
                       stake      |  unstake
                                  v
                      +-----------------------+
                      |    CantorStaking      |
                      |     (sCANTOR)         |
                      +-----------+-----------+
                                  ^
                                  |
                   fees du proto  |  (setup fee, perf fee, etc.)
                                  |
                      +-----------+-----------+
                      |    FeeCollector       |
                      |  (contrat ou wallet)  |
                      +-----------------------+
```

---

## 2. Qui est qui (contrats + partenaires)

### 2.1. Côté **on-chain** (smart contracts)

1. **CantorProtocol**

   * C’est le **registre** de tout le protocole.
   * Il connaît :

     * la liste des `CantorHouseVault`,
     * les paramètres globaux (fees, addresses importantes).
   * Tu le pinges pour :

     * afficher tous les deals sur ta dApp,
     * trouver l’adresse d’un vault.

2. **CantorHouseFactory**

   * C’est la **usine à deals**.
   * Quand tu veux lancer un nouveau bien :

     * tu appelles `createHouseVault`,
     * elle déploie un nouveau `CantorHouseVault`,
     * et (optionnel) elle déploie aussi le `cHOUSE` de ce bien.

3. **CantorHouseVault #1 / #2 / #3…**

   * Un **vault par bien immobilier**.
   * Il reçoit :

     * les dépôts des investisseurs (USDC/ETH),
     * les loyers (en USDC) envoyés plus tard par ta société.
   * Il émet les tokens de parts (`cHOUSE1`).
   * Il autorise ton rôle **manager** à retirer le capital pour financer le bien.

4. **Token de parts `cHOUSE1`**

   * ERC20 (ou NFT) qui représente la part de l’investisseur sur ce bien.
   * Il peut être :

     * intégré dans le vault (le vault est lui-même ERC20), ou
     * une adresse de token séparée.

5. **CantorToken (CANTOR)**

   * Token de **protocole** (gouvernance, avantages, capture de valeur).
   * Ne représente pas directement un bien, mais **l’écosystème CantorFi**.

6. **CantorStaking / sCANTOR**

   * Les gens peuvent **staker** du CANTOR.
   * Ils reçoivent un token liquide (optionnel) `sCANTOR`.
   * Le protocole envoie une partie des **fees** dans ce contrat
     → ce qui récompense les stakers (USDC, CANTOR, ou les deux).

---

### 2.2. Côté **off-chain** (partenaires & infra)

Ceux-là ne sont pas des smart contracts, mais des **partenaires / services** que tu dois avoir dans ta stack :

1. **On-ramp / Off-ramp (facultatif)**

   * Exemples : MoonPay, Ramp Network, etc.
   * Permet à l’investisseur de :

     * payer en CB / virement et recevoir direct des USDC dans ton vault,
     * ou l’inverse (retirer dans sa banque).

2. **CEX (Exchange centralisé)**

   * Exemples : Binance, Kraken, Coinbase, etc.
   * Tu t’en sers pour :

     * convertir USDC/ETH ↔ EUR/USD pour ta société,
     * recevoir les USDC venant du vault,
     * renvoyer les USDC vers le vault avec les loyers.

3. **OTC Desk (optionnel, quand tu seras gros)**

   * C’est un service “gros volume”.
   * Au lieu de vendre 1M USDC sur le marché public, tu passes en **privé** via un desk :

     * ils te donnent un prix pour un bloc (par ex. 1M USDC ↔ 1M EUR),
     * ça évite de bouger les prix du marché.

4. **Banque de ta société**

   * Là où arrivent les EUR quand tu retires de l’exchange.
   * Sert à :

     * payer le vendeur, notaire, artisans, charges, etc.,
     * encaisser les loyers des locataires.

5. **Vendeur / Notaire / Agence**

   * C’est juste le “monde réel”.
   * Tu payes en fiat depuis ta banque.

6. **Locataires**

   * Payent le loyer sur ton **compte bancaire**.
   * Tous les X mois, tu transformes ces loyers en USDC et tu les renvoies à `CantorHouseVault` (fonction `addYield`).

---

## 3. Vue simplifiée du flux d’argent

### 3.1. Entrée (l’investisseur investit dans un bien)

1. Investisseur → (EUR) → on-ramp/CEX → (USDC)
2. USDC → `CantorHouseVault #1` (deposit)
3. Vault → lui donne `cHOUSE1` = parts de l’immeuble.

### 3.2. Off-chain (achat & gestion)

1. Ta société → retire via `managerWithdraw()` des USDC du vault vers ton wallet CEX.
2. CEX → vend USDC → EUR → envoie vers ta banque.
3. Banque → paie vendeur + travaux.
4. Bien loué → loyers en EUR → banque de ta société.

### 3.3. Retour vers les investisseurs (loyers)

1. Ta société → convertit une partie des loyers en USDC sur le CEX.
2. CEX → envoie USDC vers `CantorHouseVault #1`.
3. Vault :

   * soit augmente la valeur des parts `cHOUSE1`,
   * soit crédite des “rewards” à claim à chaque investisseur.

---

## 4. Vue simplifiée du flux pour le **token CANTOR**

1. Le protocole prend des **frais** (setup, performance, etc.) sur chaque deal.

2. Ces frais arrivent dans un **FeeCollector** (contrat ou wallet).

3. De là, plusieurs options :

   * envoyer des USDC vers `CantorStaking` → stakers récompensés,
   * ou utiliser les USDC pour racheter CANTOR, puis :

     * le brûler,
     * ou le redistribuer aux stakers.

4. Les holders de CANTOR peuvent :

   * participer à la gouvernance,
   * avoir des avantages d’accès/fees,
   * recevoir une partie de la valeur créée par tous les deals CantorFi.

---

## 5. Si tu veux aller plus loin

Si tu veux, au prochain message je peux :

* Te faire **un schéma centré juste sur un seul bien** (lifecycle : financement → achat → loyers → exit).
* Ou écrire une **maquette de code** pour `CantorHouseVault` en Solidity avec :

  * `deposit`,
  * `managerWithdrawCapital`,
  * `addYield`,
  * `claimRewards` / `redeem`.

Tu pourras ensuite adapter ça à ton Sepolia testnet actuel.


