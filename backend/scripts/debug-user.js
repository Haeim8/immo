const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Script de diagnostic pour une adresse utilisateur
 * Vérifie balances, allowances, et état des vaults
 */
async function main() {
  console.log("=".repeat(60));
  console.log("DIAGNOSTIC UTILISATEUR");
  console.log("=".repeat(60));

  // Adresse à vérifier
  const userAddress = "0xD9C228C0F84cb4DC2Fb37F5af496Ef16Ea94fd79";
  console.log(`\nAdresse utilisateur: ${userAddress}`);

  // Charger les déploiements
  const deployments = JSON.parse(fs.readFileSync("./deployments-sepolia.json", "utf8"));
  console.log(`\nContrats:`);
  console.log(`  Protocol: ${deployments.protocol}`);
  console.log(`  Factory: ${deployments.factory}`);
  console.log(`  USDC: ${deployments.usdc}`);

  const [signer] = await ethers.getSigners();

  // ============================================
  // 1. Vérifier les balances de tokens
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("1. BALANCES DE TOKENS");
  console.log("=".repeat(60));

  const erc20ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(userAddress);
  console.log(`\nETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  // Check USDC balance
  const usdc = new ethers.Contract(deployments.usdc, erc20ABI, signer);
  const usdcDecimals = await usdc.decimals();
  const usdcBalance = await usdc.balanceOf(userAddress);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)} USDC`);

  // ============================================
  // 2. Récupérer tous les vaults
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("2. VAULTS DISPONIBLES");
  console.log("=".repeat(60));

  const factoryABI = [
    "function getVaultCount() view returns (uint256)",
    "function getVaultAddress(uint256) view returns (address)"
  ];

  const factory = new ethers.Contract(deployments.factory, factoryABI, signer);
  const vaultCount = await factory.getVaultCount();
  console.log(`\nNombre de vaults: ${vaultCount}`);

  const vaultABI = [
    "function token() view returns (address)",
    "function getVaultInfo() view returns (uint256 vaultId, address tokenAddress, string memory tokenSymbol, uint8 tokenDecimals, bool isActive)",
    "function getVaultState() view returns (uint256 totalSupplied, uint256 totalBorrowed, uint256 availableLiquidity, uint256 maxLiquidity, uint256 utilizationRate)",
    "function getPosition(address user) view returns (uint256 amount, uint256 cvtBalance, uint256 borrowed, uint256 interestPending, bool isLocked, uint256 lockEndDate)",
    "function isPaused() view returns (bool)"
  ];

  // ============================================
  // 3. Vérifier chaque vault
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("3. ÉTAT DES VAULTS ET ALLOWANCES");
  console.log("=".repeat(60));

  for (let i = 0; i < vaultCount; i++) {
    const vaultAddress = await factory.getVaultAddress(i);
    const vault = new ethers.Contract(vaultAddress, vaultABI, signer);

    console.log(`\n--- VAULT #${i} ---`);
    console.log(`Adresse: ${vaultAddress}`);

    try {
      // Infos vault
      const vaultInfo = await vault.getVaultInfo();
      const vaultState = await vault.getVaultState();
      const isPaused = await vault.isPaused();

      console.log(`Token: ${vaultInfo.tokenSymbol} (${vaultInfo.tokenAddress})`);
      console.log(`Decimals: ${vaultInfo.tokenDecimals}`);
      console.log(`Active: ${vaultInfo.isActive ? 'OUI' : 'NON'}`);
      console.log(`Paused: ${isPaused ? 'OUI' : 'NON'}`);
      console.log(`Total Supplied: ${ethers.formatUnits(vaultState.totalSupplied, vaultInfo.tokenDecimals)}`);
      console.log(`Total Borrowed: ${ethers.formatUnits(vaultState.totalBorrowed, vaultInfo.tokenDecimals)}`);
      console.log(`Available: ${ethers.formatUnits(vaultState.availableLiquidity, vaultInfo.tokenDecimals)}`);
      console.log(`Max Liquidity: ${ethers.formatUnits(vaultState.maxLiquidity, vaultInfo.tokenDecimals)}`);
      console.log(`Utilization: ${Number(vaultState.utilizationRate) / 100}%`);

      // Position utilisateur
      const position = await vault.getPosition(userAddress);
      console.log(`\nPosition utilisateur:`);
      console.log(`  Supplied: ${ethers.formatUnits(position.amount, vaultInfo.tokenDecimals)}`);
      console.log(`  CVT Balance: ${ethers.formatEther(position.cvtBalance)}`);
      console.log(`  Borrowed: ${ethers.formatUnits(position.borrowed, vaultInfo.tokenDecimals)}`);
      console.log(`  Interest Pending: ${ethers.formatUnits(position.interestPending, vaultInfo.tokenDecimals)}`);

      // Allowance du token vers le vault
      const token = new ethers.Contract(vaultInfo.tokenAddress, erc20ABI, signer);
      const allowance = await token.allowance(userAddress, vaultAddress);
      const tokenBalance = await token.balanceOf(userAddress);

      console.log(`\nToken ${vaultInfo.tokenSymbol}:`);
      console.log(`  Balance utilisateur: ${ethers.formatUnits(tokenBalance, vaultInfo.tokenDecimals)}`);
      console.log(`  Allowance vers vault: ${ethers.formatUnits(allowance, vaultInfo.tokenDecimals)}`);

      // DIAGNOSTIC
      console.log(`\n⚠️  DIAGNOSTIC:`);

      if (!vaultInfo.isActive) {
        console.log(`  ❌ VAULT INACTIF - Ne peut pas supply/borrow`);
      }

      if (isPaused) {
        console.log(`  ❌ VAULT EN PAUSE - Ne peut pas supply/borrow`);
      }

      if (tokenBalance === 0n) {
        console.log(`  ❌ BALANCE ${vaultInfo.tokenSymbol} = 0 - Ne peut pas supply`);
      }

      if (allowance === 0n && tokenBalance > 0n) {
        console.log(`  ⚠️  PAS D'ALLOWANCE - Il faut approve() le vault avant de supply`);
        console.log(`  💡 Solution: Appeler token.approve("${vaultAddress}", montant)`);
      } else if (allowance > 0n) {
        console.log(`  ✅ Allowance OK - Peut supply jusqu'à ${ethers.formatUnits(allowance, vaultInfo.tokenDecimals)}`);
      }

      if (vaultInfo.isActive && !isPaused && tokenBalance > 0n && allowance > 0n) {
        console.log(`  ✅ TOUT EST OK POUR SUPPLY`);
      }

    } catch (error) {
      console.log(`❌ Erreur lors de la lecture du vault: ${error.message}`);
    }
  }

  // ============================================
  // 4. Résumé
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("RÉSUMÉ");
  console.log("=".repeat(60));
  console.log(`\nSi allowance = 0 sur un vault:`);
  console.log(`1. L'utilisateur doit d'abord approve le vault`);
  console.log(`2. Appeler: token.approve(vaultAddress, montantMaxEnWei)`);
  console.log(`3. Ensuite il pourra supply`);
  console.log(`\nSi vault isPaused ou !isActive:`);
  console.log(`1. L'admin doit unpause() ou activer le vault`);
  console.log(`2. Vérifier les paramètres du vault`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
