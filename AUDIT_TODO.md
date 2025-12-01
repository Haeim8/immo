# Plan d'actions CantorFi

## Priorité critique (bloquant sécurité/fonds)
- Corriger la liquidation dans `backend/contracts/CantorVault.sol`: aujourd'hui la dette est simplement effacée (`borrowedAmount`/`borrowInterestAccumulated` remis à 0) sans récupérer de liquidité ni créditer la trésorerie/les LPs. Il faut saisir le collatéral pour couvrir la dette, mettre à jour `availableLiquidity`, et enregistrer la perte éventuelle au niveau du vault.
- Ajuster la compta du principal remboursé: `processRepayment`/`claimCapital` créditent le capital sans jamais décrémenter `pos.amount` ni `vaultState.totalSupplied`, ce qui permet aux suppliers de retirer deux fois (claimCapital + withdraw). Refaire le modèle: le principal remboursé doit réduire l’exposition (montant supply et totalSupplied) et bloquer un double retrait.
- Sécuriser la trésorerie disponible: des distributions (intérêts de borrow via `_distributeRevenue`, pénalités d’early withdraw, liquidations) créditent des soldes utilisateurs sans incrémenter `vaultState.availableLiquidity`, ce qui crée des underflows au claim et une compta fausse. Recompter `availableLiquidity` dès qu’un montant entre dans le coffre.
- Mettre en place un vrai mode pause: `pauseRevenue`/`resumeRevenue` ne sont jamais vérifiés. Ajouter des guards (revenus, remboursements, claims) et documenter quels flux sont stoppés en pause d’urgence.
- Limiter le risque DoS: `_distributeRevenue` et `_distributeCapital` bouclent sur tous les fournisseurs. Introduire un système itératif (accrual par index, snapshots, ou claims basés sur checkpoints) pour rester viable quand il y a beaucoup de LPs.

## Contrats (compléments pour déploiement)
- Ajouter des storage gaps aux contrats upgradeables (Protocol, Factory, Vault, FeeCollector, CantorToken) pour éviter les collisions lors des upgrades.
- Gérer correctement les intérêts: aujourd’hui le taux supply est dérivé du taux borrow mais n’est pas adossé à des flux encaissés. Revoir le modèle (accrual global + index) et aligner le calcul sur le cash réellement payé par les borrowers.
- Exposer les données manquantes pour le front/admin: liste des suppliers/borrowers et leurs soldes, revenus/repayments par période, état des locks, statut pause. Étendre `CantorVaultReader` ou ajouter des événements + indexation.
- Vérifier/mettre à jour les adresses déployées (Base Sepolia) et supprimer les artefacts legacy (`deployments.json` daté 2025, vieux ABIs/constantes).
- Couvrir par tests Hardhat les cas critiques: liquidation, pénalités de retrait anticipé, repayment partiel, arrêt des intérêts quand le crédit est remboursé, underflow `availableLiquidity`.

## Admin app (tableau de bord équipe)
- Authz: remplacer la whitelist locale (`admin/app/page.tsx`) par une vérification on-chain du rôle `ADMIN_ROLE`/`MANAGER_ROLE` (AccessControl) et bloquer l’UI si rôle absent.
- Flux création de vault: gérer l’approbation USDC pour le setup fee, afficher le coût exact, vérifier que la Factory a bien le rôle `FACTORY_ROLE` dans le Protocol, persister les métadonnées UI (ville, images, description) hors-chain (Pinata/DB) et les lier par CID.
- Gestion des revenus/repayments: dans `admin/app/dashboard/loans/page.tsx`, ajouter les checks d’allowance USDC, afficher le fee prélevé, journaliser les transferts et l’état `pauseReason` pour suivre les périodes de gel.
- Monitoring détaillé: enrichir `VaultsTable`/`vaults` page avec les positions utilisateurs (supply/borrow par adresse), l’APY réel (revenus encaissés), les événements récents (RevenueAdded, RepaymentProcessed, Liquidated).
- Actions manquantes: implémenter les pages liées du menu (Add Revenue, Process Repayment, Pause/Unpause) au lieu des liens vides, et ajouter les hooks pour `claimCapital`/`claimRevenue` côté trésorerie si la team doit retirer pour des entités spécifiques.
- Sécurité UX: bloquer les actions tant que les transactions précédentes ne sont pas confirmées, afficher clairement le réseau ciblé (Base Sepolia) et les adresses des contrats utilisés.

## App client (partie utilisateur)
- Supprimer l’ancien code “places/puzzles” (`lib/evm/hooks.ts`, `write-hooks.ts`, `adapters.ts`, pages portfolio/vault/home) et brancher l’app sur `CantorVaultReader` + `CantorVault` actuels.
- Ajouter un provider wagmi/RainbowKit dans `app/layout.tsx` et une config réseau cohérente avec les adresses Base Sepolia.
- Écran d’accueil/vitrine: afficher la liste des vaults via `getVaults` (Reader), montrer TVL, APY attendu, funding progress et bouton “Supply”.
- Supply/Borrow: créer les écrans et hooks pour `supply`, `withdraw`, `borrow`, `repayBorrow`, `claimInterests`, `claimRevenue`, `claimCapital`, en gérant allowances USDC et les locks (pénalité, date de fin).
- Portfolio utilisateur: utiliser `getUserPortfolio` (Reader) pour agréger les positions, pending/claimed amounts, borrowed amounts et health factor si exposé.
- Pages existantes cassées: l’accès par code (`app/(access)`) appelle des routes `/api/access/*` inexistantes; soit les implémenter, soit retirer la barrière. Le `PropertyGrid`/`vault/[id]` doit lire les vraies données on-chain et non `useAllPlaces`.

## Données & intégration
- Unifier les ABIs/constants: choisir entre `abis-new.json` et les ABIs générées depuis `backend/artifacts`, supprimer les versions legacy et exposer une seule source typée (TS).
- Stocker et servir les métadonnées des vaults (nom, description longue, médias, chiffres off-chain) pour enrichir l’UI client et admin; lier chaque vaultId → CID/URL.
- Documenter et versionner les adresses de déploiement (environnement testnet/mainnet) et les block explorers dans un fichier unique partagé entre admin et app.

## Tests & observabilité
- Ajouter des tests e2e front (happy path supply/withdraw/borrow/claim) sur Base Sepolia fork pour valider l’intégration complète.
- Mettre en place un monitoring simple (log des events via viem/subgraph) pour suivre Revenues/Repayments/Liquidations et alimenter le dashboard admin.
