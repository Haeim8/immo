# SPÉCIFICATION COMPLÈTE ADMIN CANTORFI

## ARCHITECTURE DES CONTRATS

```
CantorFiProtocol (Registry central)
├── CantorAssetFactory (Crée les vaults)
│   └── CantorVault (1 vault = 1 asset RWA)
│       └── CVT (Token de parts du vault)
├── FeeCollector (Collecte les fees)
├── CantorToken (Token de gouvernance CANTORFI)
└── CantorVaultReader (Lecture pour frontend)
```

---

## 1. CRÉATION DE VAULT - TOUS LES CHAMPS

### CreateVaultParams (CantorAssetFactory.sol:109-121)

| Champ | Type Solidity | Description | Validation |
|-------|---------------|-------------|------------|
| `assetName` | string | Nom du bien (ex: "Villa Nice Côte d'Azur") | Requis |
| `assetType` | string | Type de bien | Requis |
| `location` | string | Localisation complète | Requis |
| `assetPrice` | uint256 | Prix du bien en USDC (6 decimals) | Requis |
| `maxLiquidity` | uint256 | Liquidité max acceptée en USDC | > 0 |
| `creditAmount` | uint256 | Montant du crédit en USDC | > 0 |
| `creditDuration` | uint256 | Durée en SECONDES | Requis |
| `frequency` | RepaymentFrequency | 0=MONTHLY, 1=QUARTERLY | Enum |
| `borrowBaseRate` | uint256 | Taux de base en basis points (200 = 2%) | <= 10000 |
| `borrowSlope` | uint256 | Pente du taux variable en basis points | Requis |
| `maxBorrowRatio` | uint256 | Ratio max d'emprunt (7500 = 75%) | <= 10000 |

### Types de biens suggérés
- Real Estate
- Commercial Property
- Residential
- Industrial
- Mixed Use
- Luxury Vehicle
- Art & Collectibles
- Vineyard
- Hotel

### Fréquences de remboursement
- 0 = MONTHLY (Mensuel)
- 1 = QUARTERLY (Trimestriel)

---

## 2. GESTION D'UN VAULT (CantorVault.sol)

### Informations du Vault (VaultInfo struct, ligne 42-61)

| Champ | Type | Description |
|-------|------|-------------|
| `vaultId` | uint256 | ID unique du vault |
| `assetName` | string | Nom du bien |
| `assetType` | string | Type de bien |
| `location` | string | Localisation |
| `assetPrice` | uint256 | Prix du bien |
| `maxLiquidity` | uint256 | Liquidité max |
| `creditAmount` | uint256 | Montant du crédit |
| `creditDuration` | uint256 | Durée en secondes |
| `frequency` | RepaymentFrequency | Fréquence de paiement |
| `borrowBaseRate` | uint256 | Taux de base |
| `borrowSlope` | uint256 | Pente du taux |
| `maxBorrowRatio` | uint256 | Ratio max emprunt |
| `isActive` | bool | Vault actif ou terminé |
| `createdAt` | uint256 | Timestamp création |
| `investmentDate` | uint256 | Date d'investissement (achat du bien) |
| `treasury` | address | Adresse treasury |
| `isPaused` | bool | Revenus en pause |
| `pauseReason` | string | Raison de la pause |

### État du Vault (VaultState struct, ligne 63-72)

| Champ | Type | Description |
|-------|------|-------------|
| `totalSupplied` | uint256 | Total USDC déposés |
| `totalBorrowed` | uint256 | Total USDC empruntés |
| `availableLiquidity` | uint256 | Liquidité disponible |
| `utilizationRate` | uint256 | Taux d'utilisation (basis points) |
| `totalRevenuesAdded` | uint256 | Total revenus ajoutés |
| `totalRevenuesClaimed` | uint256 | Total revenus réclamés |
| `totalRepaid` | uint256 | Total capital remboursé |
| `lastInterestUpdate` | uint256 | Dernier update des intérêts |

### LockConfig (CantorVault.sol:74-79)

| Champ | Type | Description |
|-------|------|-------------|
| `hasLock` | bool | Lock activé ou non |
| `lockDurationSeconds` | uint256 | Durée du lock en secondes |
| `canWithdrawEarly` | bool | Peut retirer avec pénalité |
| `earlyWithdrawalFee` | uint256 | Pénalité retrait anticipé (basis points) |

### Position (CantorVault.sol:81-96) - Position d'un supplier

| Champ | Type | Description |
|-------|------|-------------|
| `amount` | uint256 | Montant USDC déposé |
| `cvtBalance` | uint256 | Balance tokens CVT |
| `lockConfig` | LockConfig | Configuration du lock |
| `isLocked` | bool | Position actuellement lockée |
| `lockEndDate` | uint256 | Timestamp fin du lock |
| `interestClaimed` | uint256 | Intérêts déjà réclamés |
| `interestPending` | uint256 | Intérêts en attente |
| `revenueClaimed` | uint256 | Revenus RWA réclamés |
| `revenuePending` | uint256 | Revenus RWA en attente |
| `capitalClaimed` | uint256 | Capital remboursé réclamé |
| `capitalPending` | uint256 | Capital remboursé en attente |
| `borrowedAmount` | uint256 | Montant emprunté |
| `borrowInterestAccumulated` | uint256 | Intérêts d'emprunt accumulés |
| `lastInterestUpdate` | uint256 | Dernier update intérêts position |

### Fonctions Admin du Vault

| Fonction | Role | Paramètres | Description |
|----------|------|------------|-------------|
| `addRevenue(amount)` | MANAGER | uint256 amount | Ajouter des revenus RWA (loyers, dividendes) |
| `processRepayment(amount)` | MANAGER | uint256 amount | Traiter un remboursement du crédit |
| `setInvestmentDate()` | MANAGER | - | Marquer la date d'achat du bien |
| `pauseRevenue(reason)` | MANAGER | string reason | Mettre en pause (vacance locative, problème) |
| `resumeRevenue()` | MANAGER | - | Reprendre les versements |
| `pause()` | ADMIN | - | Pause d'urgence du vault entier |
| `unpause()` | ADMIN | - | Reprendre le vault |

### Fonctions Utilisateur du Vault

| Fonction | Paramètres | Description |
|----------|------------|-------------|
| `supply(amount, lockConfig)` | uint256, LockConfig | Déposer des USDC et recevoir des CVT |
| `withdraw(amount)` | uint256 | Retirer des USDC (brûle CVT) |
| `borrow(amount)` | uint256 | Emprunter des USDC |
| `repayBorrow(amount)` | uint256 | Rembourser un emprunt |
| `claimInterests()` | - | Réclamer les intérêts supply accumulés |
| `claimRevenue()` | - | Réclamer les revenus RWA |
| `claimCapital()` | - | Réclamer le capital remboursé |
| `liquidate(borrower)` | address | Liquider une position insolvable |

### View Functions du Vault

| Fonction | Retour | Description |
|----------|--------|-------------|
| `getVaultInfo()` | VaultInfo | Informations du vault |
| `getVaultState()` | VaultState | État actuel du vault |
| `getUserPosition(user)` | Position | Position d'un utilisateur |
| `calculateBorrowRate()` | uint256 | Taux d'emprunt actuel |
| `getUtilizationRate()` | uint256 | Taux d'utilisation |
| `getSuppliersCount()` | uint256 | Nombre de suppliers |

### Events du Vault

| Event | Paramètres | Description |
|-------|------------|-------------|
| `Supplied` | address supplier, uint256 amount, uint256 cvtMinted | Dépôt effectué |
| `Withdrawn` | address supplier, uint256 amount, uint256 cvtBurned, uint256 penalty | Retrait effectué |
| `Borrowed` | address borrower, uint256 amount | Emprunt effectué |
| `BorrowRepaid` | address borrower, uint256 amount | Remboursement emprunt |
| `InterestsClaimed` | address supplier, uint256 amount | Intérêts réclamés |
| `RevenueClaimed` | address supplier, uint256 amount | Revenus réclamés |
| `CapitalClaimed` | address supplier, uint256 amount | Capital réclamé |
| `RevenueAdded` | uint256 amount, uint256 feeAmount | Revenus ajoutés par admin |
| `RepaymentProcessed` | uint256 amount | Remboursement crédit traité |
| `Liquidated` | address liquidator, address borrower, uint256 amount | Position liquidée |
| `InvestmentDateSet` | uint256 investmentDate | Date investissement définie |

---

## 3. PROTOCOL REGISTRY (CantorFiProtocol.sol)

### État Global

| Champ | Type | Description |
|-------|------|-------------|
| `vaults` | mapping(uint256 => address) | vaultId → adresse vault |
| `vaultCount` | uint256 | Nombre total de vaults |
| `setupFee` | uint256 | Fee de création (basis points, max 1000 = 10%) |
| `performanceFee` | uint256 | Fee sur revenus (basis points, max 5000 = 50%) |
| `treasury` | address | Adresse treasury |
| `feeCollector` | address | Adresse fee collector |

### Fonctions Admin

| Fonction | Role | Paramètres | Description |
|----------|------|------------|-------------|
| `setSetupFee(newFee)` | ADMIN | uint256 newFee | Changer le setup fee (max 10%) |
| `setPerformanceFee(newFee)` | ADMIN | uint256 newFee | Changer la performance fee (max 50%) |
| `setTreasury(address)` | ADMIN | address newTreasury | Changer l'adresse treasury |
| `setFeeCollector(address)` | ADMIN | address newCollector | Changer l'adresse fee collector |
| `addFactory(address)` | ADMIN | address factory | Ajouter une factory autorisée |
| `removeFactory(address)` | ADMIN | address factory | Retirer une factory |
| `pause()` | PAUSER | - | Pause d'urgence |
| `unpause()` | ADMIN | - | Reprendre |

### View Functions du Protocol

| Fonction | Retour | Description |
|----------|--------|-------------|
| `getVaultAddress(vaultId)` | address | Adresse d'un vault |
| `vaultExists(vaultId)` | bool | Vérifie si vault existe |
| `getAllVaults(offset, limit)` | address[] | Liste des adresses vaults |

### Events du Protocol

| Event | Paramètres | Description |
|-------|------------|-------------|
| `VaultCreated` | vaultId, vaultAddress, assetName, creditAmount | Vault créé |
| `VaultRegistered` | vaultId, vaultAddress | Vault enregistré |
| `SetupFeeUpdated` | oldFee, newFee | Setup fee modifié |
| `PerformanceFeeUpdated` | oldFee, newFee | Performance fee modifié |
| `TreasuryUpdated` | oldTreasury, newTreasury | Treasury changée |
| `FeeCollectorUpdated` | oldCollector, newCollector | Fee collector changé |

---

## 4. FACTORY (CantorAssetFactory.sol)

### État

| Champ | Type | Description |
|-------|------|-------------|
| `vaultImplementation` | address | Adresse de l'implémentation vault |
| `protocol` | CantorFiProtocol | Contrat protocol |
| `usdc` | IERC20 | Contrat USDC |
| `treasury` | address | Adresse treasury |

### Fonctions Admin

| Fonction | Role | Paramètres | Description |
|----------|------|------------|-------------|
| `createVault(params)` | CREATOR | CreateVaultParams | Créer un nouveau vault |
| `setVaultImplementation(address)` | ADMIN | address newImpl | Changer l'implémentation |
| `setTreasury(address)` | ADMIN | address newTreasury | Changer la treasury |
| `addCreator(address)` | ADMIN | address creator | Ajouter un créateur |
| `removeCreator(address)` | ADMIN | address creator | Retirer un créateur |
| `pause()` | PAUSER | - | Pause d'urgence |
| `unpause()` | ADMIN | - | Reprendre |

### View Functions de la Factory

| Fonction | Retour | Description |
|----------|--------|-------------|
| `getVaultAddress(vaultId)` | address | Adresse d'un vault (via protocol) |
| `getVaultCount()` | uint256 | Nombre de vaults (via protocol) |

### Events de la Factory

| Event | Paramètres | Description |
|-------|------------|-------------|
| `VaultCreated` | vaultId, vaultAddress, assetName, creditAmount | Vault créé |
| `VaultImplementationUpdated` | oldImpl, newImpl | Implementation changée |
| `TreasuryUpdated` | oldTreasury, newTreasury | Treasury changée |

---

## 5. FEE COLLECTOR (FeeCollector.sol)

### État

| Champ | Type | Description |
|-------|------|-------------|
| `usdc` | IERC20 | Contrat USDC |
| `treasury` | address | Adresse treasury |
| `stakingContract` | address | Adresse staking (pour distribution) |
| `totalFeesCollected` | uint256 | Total fees collectés |
| `totalFeesDistributed` | uint256 | Total fees distribués |

### Fonctions Admin

| Fonction | Role | Paramètres | Description |
|----------|------|------------|-------------|
| `collectFees(amount)` | PUBLIC | uint256 amount | Collecter fees depuis un vault |
| `distributeFees(amount)` | DISTRIBUTOR | uint256 amount | Envoyer au staking contract |
| `distributeToTreasury(amount)` | DISTRIBUTOR | uint256 amount | Envoyer fees à la treasury |
| `setTreasury(address)` | ADMIN | address newTreasury | Changer la treasury |
| `setStakingContract(address)` | ADMIN | address newStaking | Définir le staking contract |
| `addDistributor(address)` | ADMIN | address distributor | Ajouter un distributeur |
| `removeDistributor(address)` | ADMIN | address distributor | Retirer un distributeur |
| `withdraw(to, amount)` | ADMIN | address to, uint256 amount | Retrait d'urgence |
| `pause()` | ADMIN | - | Pause d'urgence |
| `unpause()` | ADMIN | - | Reprendre |

### View Functions du FeeCollector

| Fonction | Retour | Description |
|----------|--------|-------------|
| `getAvailableBalance()` | uint256 | Balance USDC disponible |
| `getFeeStats()` | (collected, distributed, available) | Stats complètes des fees |

### Events du FeeCollector

| Event | Paramètres | Description |
|-------|------------|-------------|
| `FeesCollected` | from, amount | Fees reçus |
| `FeesDistributed` | to, amount | Fees distribués |
| `TreasuryUpdated` | oldTreasury, newTreasury | Treasury changée |
| `StakingContractUpdated` | oldStaking, newStaking | Staking contract changé |
| `Withdrawn` | to, amount | Retrait effectué |

---

## 6. CANTOR TOKEN - GOUVERNANCE (CantorToken.sol)

### État

| Champ | Type | Description |
|-------|------|-------------|
| `maxSupply` | uint256 | Cap maximum (0 = pas de cap) |
| `totalSupply()` | uint256 | Supply actuelle |
| `name()` | string | "CantorFi" |
| `symbol()` | string | "CANTORFI" |
| `decimals()` | uint8 | 18 |

### Fonctions Admin

| Fonction | Role | Paramètres | Description |
|----------|------|------------|-------------|
| `mint(to, amount)` | MINTER | address to, uint256 amount | Créer des tokens |
| `setMaxSupply(newMax)` | ADMIN | uint256 newMax | Modifier le cap |
| `addMinter(address)` | ADMIN | address minter | Ajouter un minter |
| `removeMinter(address)` | ADMIN | address minter | Retirer un minter |
| `pause()` | PAUSER | - | Pause d'urgence |
| `unpause()` | ADMIN | - | Reprendre |

### Fonctions Utilisateur du CantorToken

| Fonction | Paramètres | Description |
|----------|------------|-------------|
| `burn(amount)` | uint256 | Brûler ses propres tokens |
| `burnFrom(from, amount)` | address, uint256 | Brûler tokens avec allowance |
| `transfer(to, amount)` | address, uint256 | Transférer tokens |
| `approve(spender, amount)` | address, uint256 | Approuver spending |
| `transferFrom(from, to, amount)` | address, address, uint256 | Transférer avec allowance |

### Events du CantorToken

| Event | Paramètres | Description |
|-------|------------|-------------|
| `MaxSupplyUpdated` | oldMaxSupply, newMaxSupply | Cap modifié |
| `TokensMinted` | to, amount | Tokens créés |
| `TokensBurned` | from, amount | Tokens brûlés |
| `Transfer` | from, to, value | Transfert ERC20 |
| `Approval` | owner, spender, value | Approval ERC20 |

---

## 6.5 CVT - VAULT TOKEN (CVT.sol)

### Description
Chaque vault a son propre token CVT (Cantor Vault Token). Il est créé automatiquement lors de la création du vault.

### État

| Champ | Type | Description |
|-------|------|-------------|
| `name()` | string | "Cantor Vault Token - {assetName}" |
| `symbol()` | string | "cv{vaultId}" |
| `decimals()` | uint8 | 18 |
| `totalSupply()` | uint256 | Total de tokens en circulation |
| `owner()` | address | Adresse du vault (seul autorisé à mint/burn) |

### Fonctions (appelées par le Vault uniquement)

| Fonction | Paramètres | Description |
|----------|------------|-------------|
| `mint(to, amount)` | address, uint256 | Mint lors du supply |
| `burn(from, amount)` | address, uint256 | Burn lors du withdraw |

---

## 7. READER - DONNÉES DISPONIBLES (CantorVaultReader.sol)

### VaultData (getVaultData, getVaults)

| Champ | Type | Description |
|-------|------|-------------|
| `vaultId` | uint256 | ID du vault |
| `vaultAddress` | address | Adresse du contrat vault |
| `assetName` | string | Nom du bien |
| `assetType` | string | Type de bien |
| `location` | string | Localisation |
| `assetPrice` | uint256 | Prix du bien |
| `maxLiquidity` | uint256 | Liquidité max |
| `creditAmount` | uint256 | Montant du crédit |
| `creditDuration` | uint256 | Durée en secondes |
| `borrowBaseRate` | uint256 | Taux de base |
| `expectedReturn` | uint256 | APY variable calculé |
| `isActive` | bool | Vault actif |
| `createdAt` | uint256 | Timestamp création |
| `investmentDate` | uint256 | Date investissement |
| `totalSupplied` | uint256 | TVL du vault |
| `totalBorrowed` | uint256 | Total emprunté |
| `availableLiquidity` | uint256 | Liquidité dispo |
| `utilizationRate` | uint256 | Taux utilisation |
| `fundingProgress` | uint256 | % de funding |
| `totalRevenuesAdded` | uint256 | Revenus ajoutés |
| `totalRepaid` | uint256 | Capital remboursé |
| `cvtToken` | address | Adresse token CVT |
| `cvtTotalSupply` | uint256 | Supply du CVT |

### UserPositionData (getUserPosition, getUserPortfolio)

| Champ | Type | Description |
|-------|------|-------------|
| `vaultId` | uint256 | ID du vault |
| `vaultAddress` | address | Adresse du vault |
| `supplyAmount` | uint256 | Montant déposé |
| `cvtBalance` | uint256 | Balance CVT |
| `isLocked` | bool | Position verrouillée |
| `lockEndDate` | uint256 | Fin du lock |
| `interestPending` | uint256 | Intérêts en attente |
| `interestClaimed` | uint256 | Intérêts réclamés |
| `revenuePending` | uint256 | Revenus en attente |
| `revenueClaimed` | uint256 | Revenus réclamés |
| `capitalPending` | uint256 | Capital en attente |
| `capitalClaimed` | uint256 | Capital réclamé |
| `borrowedAmount` | uint256 | Montant emprunté |
| `borrowInterestAccumulated` | uint256 | Intérêts d'emprunt |
| `sharePercentage` | uint256 | % de parts |

### GlobalStats (getGlobalStats)

| Champ | Type | Description |
|-------|------|-------------|
| `totalVaults` | uint256 | Nombre de vaults |
| `totalSupplied` | uint256 | TVL total |
| `totalBorrowed` | uint256 | Total emprunté |
| `totalRevenuesDistributed` | uint256 | Revenus distribués |
| `totalCapitalRepaid` | uint256 | Capital remboursé |
| `activeVaults` | uint256 | Vaults actifs |
| `averageAPY` | uint256 | APY moyen pondéré |

### PortfolioSummary (getUserPortfolio)

| Champ | Type | Description |
|-------|------|-------------|
| `totalInvested` | uint256 | Total investi |
| `totalClaimed` | uint256 | Total réclamé (interests + revenue + capital) |
| `totalPending` | uint256 | Total en attente |
| `totalBorrowed` | uint256 | Total emprunté |
| `netValue` | uint256 | Valeur nette (invested + pending - borrowed) |
| `vaultCount` | uint256 | Nombre de vaults actifs |

### Fonctions du Reader

| Fonction | Paramètres | Retour | Description |
|----------|------------|--------|-------------|
| `getVaultData(vaultId)` | uint256 | VaultData | Données complètes d'un vault |
| `getVaults(offset, limit)` | uint256, uint256 | VaultData[] | Liste des vaults paginée |
| `getUserPosition(vaultId, user)` | uint256, address | UserPositionData | Position d'un user dans un vault |
| `getUserPortfolio(user)` | address | (UserPositionData[], PortfolioSummary) | Portfolio complet d'un user |
| `getGlobalStats()` | - | GlobalStats | Stats globales du protocole |
| `calculateCurrentAPY(vaultId)` | uint256 | uint256 | APY actuel d'un vault |
| `canWithdraw(vaultId, user, amount)` | uint256, address, uint256 | (bool, uint256, string) | Vérifie si withdraw possible |

---

## 8. ROLES ET PERMISSIONS

### CantorFiProtocol
- `ADMIN_ROLE` - Gestion complète
- `PAUSER_ROLE` - Peut mettre en pause
- `FACTORY_ROLE` - Peut enregistrer des vaults

### CantorAssetFactory
- `ADMIN_ROLE` - Gestion complète
- `CREATOR_ROLE` - Peut créer des vaults
- `PAUSER_ROLE` - Peut mettre en pause

### CantorVault
- `ADMIN_ROLE` - Gestion complète, pause
- `MANAGER_ROLE` - Ajouter revenus, remboursements, dates

### FeeCollector
- `ADMIN_ROLE` - Gestion complète
- `DISTRIBUTOR_ROLE` - Peut distribuer les fees

### CantorToken
- `ADMIN_ROLE` - Gestion complète
- `MINTER_ROLE` - Peut mint des tokens
- `PAUSER_ROLE` - Peut mettre en pause

---

## 9. CONSTANTES ET LIMITES

| Constante | Valeur | Description |
|-----------|--------|-------------|
| BASIS_POINTS | 10000 | 100% = 10000 |
| MAX_SETUP_FEE | 1000 | 10% maximum |
| MAX_PERFORMANCE_FEE | 5000 | 50% maximum |
| USDC_DECIMALS | 6 | USDC a 6 decimals |

---

## 10. ANALYSE DU FRONTEND EXISTANT

### 10.1 Type Investment (lib/types.ts) - Données UI

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | ID du vault |
| `name` | string | Nom de l'actif |
| `location.city` | string | Ville |
| `location.province` | string | Province/Région |
| `location.country` | string | Pays (optionnel) |
| `priceUSD` | number | Prix par part en USD |
| `priceETH` | number | Prix par part en ETH (optionnel) |
| `estimatedValue` | number | Valeur estimée totale |
| `imageUrl` | string | URL image (optionnel) |
| `imageCid` | string | CID IPFS image (optionnel) |
| `description` | string | Description courte |
| `longDescription` | string | Description longue (optionnel) |
| `type` | string | Type d'investissement |
| `assetType` | string | Type d'actif |
| `surface` | number | Surface en m² |
| `expectedReturn` | number | Rendement attendu (%) |
| `fundingProgress` | number | Progression 0-100 |
| `sharesAvailable` | number | Parts disponibles |
| `totalShares` | number | Total parts |
| `sharesSold` | number | Parts vendues |
| `contractAddress` | string | Adresse contrat |
| `puzzlePriceWei` | string | Prix en Wei (optionnel) |
| `saleStart` | number | Timestamp début vente |
| `saleEnd` | number | Timestamp fin vente |
| `isActive` | bool | Actif |
| `votingEnabled` | bool | Gouvernance activée |
| `details.yearBuilt` | number | Année construction |
| `details.rooms` | number | Nombre de pièces |
| `details.features` | string[] | Caractéristiques |
| `details.longDescription` | string | Description détaillée |

### 10.2 PropertyCard - Champs Affichés (components/molecules/PropertyCard.tsx)

| Élément UI | Source | Format |
|------------|--------|--------|
| Badge Funding | `fundingProgress` | "X% funded" ou "SOLD OUT" |
| Localisation | `location` | "city, province, country" |
| Nom | `name` | Texte |
| Type Actif | `assetType` | Badge |
| Type Investissement | `type` | Badge |
| Gouvernance | `votingEnabled` | Badge optionnel |
| Prix par part | `priceUSD` | Formaté devise |
| Rendement attendu | `expectedReturn` | "X.XX%" |
| Date fin vente | `saleEnd` | Date formatée |
| Progression | `fundingProgress` | "X% (vendu/total)" |
| Temps restant | Calculé | "X jours" ou "X heures" |
| Prix total | `estimatedValue` | Formaté devise |

### 10.3 Page Vault Detail (app/(app)/vault/[id]/page.tsx)

| Section | Champs Affichés |
|---------|-----------------|
| Header | `name`, `location.city`, `location.province` |
| Metrics Grid | `totalInvested`, `availableLiquidity` (calculés) |
| Description | `details.longDescription` ou `description` |
| Risques | Texte statique (liquidité, marché, opérationnel) |

### 10.4 MetricsGrid - Configuration Vault (components/vault-dashboard/metrics-grid.tsx)

| Section | Métrique | Valeur Actuelle |
|---------|----------|-----------------|
| État du Vault | Taux d'Utilisation | Calculé dynamique |
| | Total Investi | Passé en prop |
| | Liquidité Disponible | Passé en prop |
| Configuration | Max LTV | 75.00% (hardcodé) |
| | Seuil Liquidation | 82.50% (hardcodé) |
| | Pénalité | 5.00% (hardcodé) |
| | Période Lock-up | 12 Mois (hardcodé) |
| Information Actif | Type | "Immobilier Résidentiel" (hardcodé) |
| | Localisation | "Nice, France" (hardcodé) |
| | Assurance | "Couvert" (hardcodé) |
| Supply (Investissement) | APY Supply | 8.45% (hardcodé) |
| | Vos Parts | 0.00 VA |
| | Gains accumulés | 0.00 € |
| | Actions | Investir, Retirer |
| Borrow (Financement) | APY Borrow | 11.2% (hardcodé) |
| | Votre Dette | 0.00 € |
| | Capacité d'emprunt | 0.00 € |
| | Actions | Emprunter, Rembourser |

### 10.5 HeroSection - Stats Globales (components/organisms/HeroSection.tsx)

| Métrique | Valeur | Source |
|----------|--------|--------|
| Total Liquidity | $12.45M | Hardcodé (mock) |
| Cap | $20M | Hardcodé (mock) |
| Filled | 65% | Hardcodé (mock) |
| Active Loans | $8.2M | Hardcodé (mock) |
| Utilized | 40% | Hardcodé (mock) |

### 10.6 Admin Create Vault - Champs Existants (admin/app/dashboard/create-vault/page.tsx)

| Section | Champ | Input Type | Conversion |
|---------|-------|------------|------------|
| Asset Information | assetName | text | - |
| | assetType | select | - |
| | location | text | - |
| | assetPrice | number | parseUnits(x, 6) |
| | maxLiquidity | number | parseUnits(x, 6) |
| Credit Configuration | creditAmount | number | parseUnits(x, 6) |
| | creditDuration | number | days * 86400 |
| | frequency | button group | enum 0-3 |
| Interest Rate Model | borrowBaseRate | number | % * 100 (basis points) |
| | borrowSlope | number | % * 100 |
| | maxBorrowRatio | number | % * 100 |

**Fréquences disponibles dans l'admin:**
- 0 = Monthly
- 1 = Quarterly
- 2 = Semi-Annual
- 3 = Annual

**Types d'actifs dans l'admin:**
- Real Estate
- Commercial Property
- Residential
- Industrial
- Mixed Use

---

## 11. CHAMPS MANQUANTS / À AJOUTER

### 11.1 Dans la Création de Vault (Admin)

| Champ | Présent Smart Contract | Présent Admin UI | Action |
|-------|------------------------|------------------|--------|
| assetName | OUI | OUI | - |
| assetType | OUI | OUI | - |
| location | OUI | OUI | - |
| assetPrice | OUI | OUI | - |
| maxLiquidity | OUI | OUI | - |
| creditAmount | OUI | OUI | - |
| creditDuration | OUI | OUI | - |
| frequency | OUI | OUI | - |
| borrowBaseRate | OUI | OUI | - |
| borrowSlope | OUI | OUI | - |
| maxBorrowRatio | OUI | OUI | - |

**TOUS LES CHAMPS DE CRÉATION SONT PRÉSENTS**

### 11.2 Dans l'Affichage Vault Detail (Frontend Public)

| Champ | Disponible via Reader | Affiché | Action |
|-------|----------------------|---------|--------|
| Taux d'utilisation | OUI (utilizationRate) | OUI (calculé) | Utiliser la donnée contrat |
| Max LTV | OUI (maxBorrowRatio) | NON (hardcodé 75%) | Connecter au contrat |
| Seuil Liquidation | NON dans contrat | NON (hardcodé 82.5%) | Calculer ou ajouter |
| Pénalité | NON dans contrat | NON (hardcodé 5%) | Ajouter au contrat ou supprimer |
| Période Lock-up | NON explicite | NON (hardcodé 12 mois) | Utiliser creditDuration |
| Type actif | OUI (assetType) | NON (hardcodé) | Connecter au contrat |
| Localisation | OUI (location) | NON (hardcodé) | Connecter au contrat |
| Assurance | NON dans contrat | NON (hardcodé) | Ajouter ou supprimer |
| APY Supply | OUI (expectedReturn) | NON (hardcodé 8.45%) | Connecter au contrat |
| APY Borrow | OUI (borrowBaseRate) | NON (hardcodé 11.2%) | Connecter au contrat |
| Vos Parts | OUI (getUserPosition) | Placeholder | Connecter au contrat |
| Gains accumulés | OUI (getUserPosition) | Placeholder | Connecter au contrat |
| Dette | OUI (getUserPosition) | Placeholder | Connecter au contrat |
| Capacité emprunt | OUI (calculable) | Placeholder | Calculer |

### 11.3 Données Hardcodées à Dynamiser

**HeroSection:**
- Total Liquidity → `getGlobalStats().totalSupplied`
- Active Loans → `getGlobalStats().totalBorrowed`
- Utilization → calculer depuis les stats

**MetricsGrid:**
- Max LTV → `vaultInfo.maxBorrowRatio / 100`
- Période Lock-up → `vaultInfo.creditDuration` formaté
- Type → `vaultInfo.assetType`
- Localisation → `vaultInfo.location`
- APY Supply → `expectedReturn / 100`
- APY Borrow → `calculateBorrowRate() / 100`

---

## 12. PAGES ADMIN - ÉTAT D'IMPLÉMENTATION

### 12.1 Dashboard Principal (/dashboard) ✅ IMPLÉMENTÉ
- [x] Stats globales depuis Reader (useGlobalStats)
- [x] Liste des derniers vaults (VaultsTable)
- [x] Cards avec TVL, vaults actifs, fees collectés

### 12.2 Gestion Vaults (/dashboard/vaults) ✅ IMPLÉMENTÉ
- [x] Liste de tous les vaults (useVaults)
- [x] Affichage status, TVL, utilization, funding progress
- [x] Liens vers détails vault
- [x] Refresh des données

### 12.3 Détail Vault (/dashboard/vaults/[id]) ⚠️ À COMPLÉTER
- [ ] Informations complètes du vault
- [ ] État du vault
- [ ] Actions admin: addRevenue, processRepayment, setInvestmentDate, pauseRevenue

### 12.4 Création Vault (/dashboard/create-vault) ✅ IMPLÉMENTÉ
- [x] Formulaire complet avec tous les champs CreateVaultParams
- [x] Validation des inputs
- [x] Appel createVault sur Factory

### 12.5 Treasury (/dashboard/treasury) ✅ IMPLÉMENTÉ
- [x] Balance treasury (USDC balanceOf)
- [x] Balance fee collector
- [x] Stats FeeCollector (useFeeCollectorStats)
- [x] Action distributeToTreasury
- [x] Liens vers explorateur Base Sepolia

### 12.6 Fees (/dashboard/fees) ✅ IMPLÉMENTÉ
- [x] Stats fees collectés/distribués (getFeeStats)
- [x] Configuration fees protocol (setupFee, performanceFee)
- [x] Tableau des fees actuels
- [x] Formulaires update setupFee et performanceFee
- [x] Action distributeToTreasury
- [x] Documentation du flow de fees

### 12.7 Utilisateurs (/dashboard/users) ✅ IMPLÉMENTÉ
- [x] Stats vaults actifs, vaults avec suppliers, CVT mintés
- [x] Tableau des positions par vault (CVT supply)
- [x] Liens vers tokens CVT sur explorateur
- [x] Documentation getUserPosition

### 12.8 Paramètres Protocol (/dashboard/settings) ✅ IMPLÉMENTÉ
- [x] Affichage setupFee, performanceFee, vaultCount
- [x] Formulaires update setupFee et performanceFee
- [x] Tableau des adresses protocol (protocol, treasury, feeCollector, factory, USDC)
- [x] Liens vers explorateur Base Sepolia

### 12.9 Analytics (/dashboard/analytics) ✅ IMPLÉMENTÉ
- [x] Cards TVL, Total Borrowed, Fees, Average APY
- [x] Graphique utilization avec Progress bar
- [x] Distribution des vaults (actifs, fermés, funded)
- [x] Breakdown revenus et fees
- [x] Indicateurs de santé du protocol

### 12.10 Rapports (/dashboard/reports) ✅ IMPLÉMENTÉ
- [x] Cards GlobalStats (vaults, TVL, revenues, APY)
- [x] Fee Collection Report
- [x] Protocol Health metrics
- [x] Tableau complet Vault Report
- [x] Boutons Refresh et Export

---

## 13. ABIs DISPONIBLES (admin/lib/contracts.ts)

| Contrat | Fonctions Lecture | Fonctions Écriture |
|---------|-------------------|-------------------|
| PROTOCOL | vaultCount, setupFee, performanceFee, treasury, feeCollector, getVaultAddress, getAllVaults | setSetupFee, setPerformanceFee |
| FEE_COLLECTOR | totalFeesCollected, totalFeesDistributed, getAvailableBalance, getFeeStats, treasury | distributeToTreasury |
| READER | getGlobalStats, getVaultData, getVaults | - |
| FACTORY | getVaultCount | createVault |
| VAULT | vaultInfo, vaultState, calculateBorrowRate, getSuppliersCount | addRevenue, processRepayment, setInvestmentDate, pauseRevenue, resumeRevenue |
| USDC | balanceOf, decimals | approve |

---

## NOTES IMPORTANTES

1. **Tous les montants USDC** sont en 6 decimals (1 USDC = 1000000)
2. **Tous les pourcentages** sont en basis points (1% = 100, 10% = 1000)
3. **Les durées** sont en secondes (1 jour = 86400, 1 an = 31536000)
4. **RepaymentFrequency** est un enum: 0 = MONTHLY, 1 = QUARTERLY
