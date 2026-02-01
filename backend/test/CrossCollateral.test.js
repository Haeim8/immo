const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Cross-Collateral System", function () {
  let owner, admin, treasury, user1, user2;
  let usdc, weth;
  let protocol, factory, feeCollector, vaultImplementation;
  let priceOracle, collateralManager;
  let usdcVault, wethVault;
  let usdcVaultAddress, wethVaultAddress;
  let usdcPriceFeed, wethPriceFeed;

  // Constants
  const SETUP_FEE = 0;
  const PERFORMANCE_FEE = 1000; // 10%
  const BORROW_FEE_RATE = 1500; // 15%
  const MAX_LTV = 7000; // 70%
  const LIQUIDATION_THRESHOLD = 8000; // 80%
  const LIQUIDATION_BONUS = 500; // 5%

  // Prices (8 decimals like Chainlink)
  const USDC_PRICE = 100000000; // $1.00
  const WETH_PRICE = 350000000000; // $3500.00

  // Amounts
  const USDC_SUPPLY = ethers.parseUnits("100000", 6); // 100k USDC
  const WETH_SUPPLY = ethers.parseUnits("100", 18); // 100 WETH

  // Vault parameters
  const VAULT_PARAMS = {
    maxLiquidity: ethers.parseUnits("10000000", 18),
    borrowBaseRate: 500, // 5%
    borrowSlope: 1000, // 10%
    maxBorrowRatio: 7000, // 70%
    liquidationBonus: 500 // 5%
  };

  let cvt;

  beforeEach(async function () {
    this.timeout(120000);

    [owner, admin, treasury, user1, user2] = await ethers.getSigners();

    // Deploy Mock USDC (6 decimals)
    const MockToken = await ethers.getContractFactory("MockERC20");
    usdc = await MockToken.deploy("Mock USDC", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy Mock WETH (18 decimals)
    weth = await MockToken.deploy("Wrapped Ether", "WETH", 18);
    await weth.waitForDeployment();

    // Mint tokens to users
    await usdc.mint(user1.address, USDC_SUPPLY);
    await usdc.mint(user2.address, USDC_SUPPLY);
    await weth.mint(user1.address, WETH_SUPPLY);
    await weth.mint(user2.address, WETH_SUPPLY);

    // Deploy Mock Price Feeds
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    usdcPriceFeed = await MockPriceFeed.deploy(USDC_PRICE, 8, "USDC / USD");
    await usdcPriceFeed.waitForDeployment();

    wethPriceFeed = await MockPriceFeed.deploy(WETH_PRICE, 8, "ETH / USD");
    await wethPriceFeed.waitForDeployment();

    // Deploy global CVT token
    const CVT = await ethers.getContractFactory("CVT");
    cvt = await CVT.deploy(admin.address);
    await cvt.waitForDeployment();

    // Deploy CantorFiProtocol
    const CantorFiProtocol = await ethers.getContractFactory("CantorFiProtocol");
    protocol = await upgrades.deployProxy(
      CantorFiProtocol,
      [admin.address, treasury.address, SETUP_FEE, PERFORMANCE_FEE, BORROW_FEE_RATE],
      { kind: "uups" }
    );
    await protocol.waitForDeployment();

    // Deploy FeeCollector
    const FeeCollector = await ethers.getContractFactory("FeeCollector");
    feeCollector = await upgrades.deployProxy(
      FeeCollector,
      [admin.address, treasury.address],
      { kind: "uups" }
    );
    await feeCollector.waitForDeployment();

    await protocol.connect(admin).setFeeCollector(await feeCollector.getAddress());

    // Deploy PriceOracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await upgrades.deployProxy(
      PriceOracle,
      [admin.address],
      { kind: "uups" }
    );
    await priceOracle.waitForDeployment();

    // Set price feeds in oracle
    await priceOracle.connect(admin).setPriceFeed(await usdc.getAddress(), await usdcPriceFeed.getAddress());
    await priceOracle.connect(admin).setPriceFeed(await weth.getAddress(), await wethPriceFeed.getAddress());

    // Deploy CollateralManager
    const CollateralManager = await ethers.getContractFactory("CollateralManager");
    collateralManager = await upgrades.deployProxy(
      CollateralManager,
      [
        await priceOracle.getAddress(),
        await protocol.getAddress(),
        admin.address,
        MAX_LTV,
        LIQUIDATION_THRESHOLD,
        LIQUIDATION_BONUS
      ],
      { kind: "uups" }
    );
    await collateralManager.waitForDeployment();

    // Deploy CantorVault implementation
    const CantorVault = await ethers.getContractFactory("CantorVault");
    vaultImplementation = await CantorVault.deploy();
    await vaultImplementation.waitForDeployment();

    // Deploy CantorAssetFactory
    const CantorAssetFactory = await ethers.getContractFactory("CantorAssetFactory");
    factory = await upgrades.deployProxy(
      CantorAssetFactory,
      [
        await vaultImplementation.getAddress(),
        await protocol.getAddress(),
        await cvt.getAddress(),
        admin.address,
        treasury.address
      ],
      { kind: "uups", unsafeAllow: ["delegatecall"] }
    );
    await factory.waitForDeployment();

    // Grant factory ADMIN_ROLE on CVT
    await cvt.connect(admin).grantRole(await cvt.ADMIN_ROLE(), await factory.getAddress());

    // Grant roles
    await protocol.connect(admin).addFactory(await factory.getAddress());
    await feeCollector.connect(admin).addNotifier(await factory.getAddress());
  });

  // Helper to create vault
  async function createVault(token, tokenMaxLiquidity) {
    const params = {
      token: await token.getAddress(),
      maxLiquidity: tokenMaxLiquidity || VAULT_PARAMS.maxLiquidity,
      borrowBaseRate: VAULT_PARAMS.borrowBaseRate,
      borrowSlope: VAULT_PARAMS.borrowSlope,
      maxBorrowRatio: VAULT_PARAMS.maxBorrowRatio,
      liquidationBonus: VAULT_PARAMS.liquidationBonus,
      liquidationThreshold: LIQUIDATION_THRESHOLD
    };

    const tx = await factory.connect(admin).createVault(params);
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        return factory.interface.parseLog(log)?.name === "VaultCreated";
      } catch {
        return false;
      }
    });

    const parsedEvent = factory.interface.parseLog(event);
    const vaultAddr = parsedEvent.args.vaultAddress;

    const CantorVault = await ethers.getContractFactory("CantorVault");
    const vault = CantorVault.attach(vaultAddr);

    // Grant NOTIFIER_ROLE to vault
    await feeCollector.connect(admin).addNotifier(vaultAddr);

    // Enable cross-collateral and set manager
    await vault.connect(admin).setCollateralManager(await collateralManager.getAddress());
    await vault.connect(admin).setCrossCollateralEnabled(true);

    // Add vault to CollateralManager
    await collateralManager.connect(admin).addVault(vaultAddr);

    return { vault, vaultAddress: vaultAddr, vaultId: parsedEvent.args.vaultId };
  }

  // Helper to create both vaults
  async function setupVaults() {
    const usdcResult = await createVault(usdc, ethers.parseUnits("10000000", 6));
    usdcVault = usdcResult.vault;
    usdcVaultAddress = usdcResult.vaultAddress;

    const wethResult = await createVault(weth, ethers.parseUnits("10000", 18));
    wethVault = wethResult.vault;
    wethVaultAddress = wethResult.vaultAddress;

    return { usdcResult, wethResult };
  }

  const NO_LOCK = {
    hasLock: false,
    lockDurationSeconds: 0,
    canWithdrawEarly: false,
    earlyWithdrawalFee: 0
  };

  describe("Setup", function () {
    it("should deploy all contracts correctly", async function () {
      expect(await priceOracle.getAddress()).to.be.properAddress;
      expect(await collateralManager.getAddress()).to.be.properAddress;
    });

    it("should return correct prices from oracle", async function () {
      const usdcPriceResult = await priceOracle.getPrice(await usdc.getAddress());
      expect(usdcPriceResult).to.equal(USDC_PRICE);

      const wethPriceResult = await priceOracle.getPrice(await weth.getAddress());
      expect(wethPriceResult).to.equal(WETH_PRICE);
    });

    it("should calculate correct USD values", async function () {
      // 100 USDC = $100
      const usdcValue = await priceOracle.getUSDValue(
        await usdc.getAddress(),
        ethers.parseUnits("100", 6),
        6
      );
      expect(usdcValue).to.equal(100 * USDC_PRICE);

      // 1 WETH = $3500
      const wethValue = await priceOracle.getUSDValue(
        await weth.getAddress(),
        ethers.parseUnits("1", 18),
        18
      );
      expect(wethValue).to.equal(WETH_PRICE);
    });
  });

  describe("Cross-Collateral Borrowing", function () {
    beforeEach(async function () {
      await setupVaults();
    });

    it("should allow user to supply WETH and borrow USDC", async function () {
      // User1 supplies 10 WETH ($35,000)
      const wethAmount = ethers.parseUnits("10", 18);
      await weth.connect(user1).approve(wethVaultAddress, wethAmount);
      await wethVault.connect(user1).supply(wethAmount, NO_LOCK);

      // Verify collateral is recorded
      const collateral = await collateralManager.userCollateral(user1.address, 1); // vault 1 is WETH
      expect(collateral).to.equal(wethAmount);

      // User1 can borrow up to 70% of $35,000 = $24,500 USDC
      // Let's borrow $20,000 USDC
      const borrowAmount = ethers.parseUnits("20000", 6);

      // User2 supplies USDC for liquidity
      await usdc.connect(user2).approve(usdcVaultAddress, USDC_SUPPLY);
      await usdcVault.connect(user2).supply(USDC_SUPPLY, NO_LOCK);

      // User1 borrows USDC against WETH collateral
      const canBorrow = await collateralManager.canBorrow(user1.address, 0, borrowAmount);
      expect(canBorrow).to.be.true;

      await usdcVault.connect(user1).crossCollateralBorrow(borrowAmount);

      // Verify debt is recorded
      const [principal, interest] = await collateralManager.getUserDebt(user1.address, 0);
      expect(principal).to.equal(borrowAmount);

      // Verify user received USDC
      const userUsdcBalance = await usdc.balanceOf(user1.address);
      expect(userUsdcBalance).to.equal(USDC_SUPPLY + borrowAmount);
    });

    it("should prevent borrowing above max LTV", async function () {
      // User1 supplies 1 WETH ($3,500)
      const wethAmount = ethers.parseUnits("1", 18);
      await weth.connect(user1).approve(wethVaultAddress, wethAmount);
      await wethVault.connect(user1).supply(wethAmount, NO_LOCK);

      // User2 supplies USDC for liquidity
      await usdc.connect(user2).approve(usdcVaultAddress, USDC_SUPPLY);
      await usdcVault.connect(user2).supply(USDC_SUPPLY, NO_LOCK);

      // Try to borrow $3,000 (> 70% of $3,500 = $2,450)
      const borrowAmount = ethers.parseUnits("3000", 6);

      const canBorrow = await collateralManager.canBorrow(user1.address, 0, borrowAmount);
      expect(canBorrow).to.be.false;

      await expect(
        usdcVault.connect(user1).crossCollateralBorrow(borrowAmount)
      ).to.be.revertedWithCustomError(usdcVault, "ExceedsMaxBorrow");
    });

    it("should track health factor correctly", async function () {
      // User1 supplies 10 WETH ($35,000)
      const wethAmount = ethers.parseUnits("10", 18);
      await weth.connect(user1).approve(wethVaultAddress, wethAmount);
      await wethVault.connect(user1).supply(wethAmount, NO_LOCK);

      // User2 supplies USDC for liquidity
      await usdc.connect(user2).approve(usdcVaultAddress, USDC_SUPPLY);
      await usdcVault.connect(user2).supply(USDC_SUPPLY, NO_LOCK);

      // User1 borrows $20,000 USDC
      const borrowAmount = ethers.parseUnits("20000", 6);
      await usdcVault.connect(user1).crossCollateralBorrow(borrowAmount);

      // Health factor = (35000 * 80%) / 20000 = 1.4 = 14000 basis points
      const healthFactor = await collateralManager.getHealthFactor(user1.address);
      expect(healthFactor).to.be.closeTo(14000n, 100n); // ~140% with small tolerance

      // Should not be liquidatable
      const isLiquidatable = await collateralManager.isLiquidatable(user1.address);
      expect(isLiquidatable).to.be.false;
    });

    it("should allow repayment of cross-collateral borrow", async function () {
      // User1 supplies 10 WETH and borrows USDC
      const wethAmount = ethers.parseUnits("10", 18);
      await weth.connect(user1).approve(wethVaultAddress, wethAmount);
      await wethVault.connect(user1).supply(wethAmount, NO_LOCK);

      await usdc.connect(user2).approve(usdcVaultAddress, USDC_SUPPLY);
      await usdcVault.connect(user2).supply(USDC_SUPPLY, NO_LOCK);

      const borrowAmount = ethers.parseUnits("20000", 6);
      await usdcVault.connect(user1).crossCollateralBorrow(borrowAmount);

      // Repay half
      const repayAmount = ethers.parseUnits("10000", 6);
      await usdc.connect(user1).approve(usdcVaultAddress, repayAmount);
      await usdcVault.connect(user1).repayCrossCollateralBorrow(repayAmount);

      // Verify debt decreased (allow small tolerance for interest accrued)
      const [principal, interest] = await collateralManager.getUserDebt(user1.address, 0);
      expect(principal).to.be.closeTo(borrowAmount - repayAmount, ethers.parseUnits("100", 6));
    });
  });

  describe("Multi-Asset Collateral", function () {
    beforeEach(async function () {
      await setupVaults();
    });

    it("should aggregate collateral from multiple vaults", async function () {
      // User1 supplies both USDC and WETH
      const usdcAmount = ethers.parseUnits("10000", 6); // $10,000
      const wethAmount = ethers.parseUnits("1", 18); // $3,500

      await usdc.connect(user1).approve(usdcVaultAddress, usdcAmount);
      await usdcVault.connect(user1).supply(usdcAmount, NO_LOCK);

      await weth.connect(user1).approve(wethVaultAddress, wethAmount);
      await wethVault.connect(user1).supply(wethAmount, NO_LOCK);

      // Total collateral = $10,000 + $3,500 = $13,500
      const totalCollateral = await collateralManager.getTotalCollateralValueUSD(user1.address);

      // Expected: $13,500 in 8 decimals = 1_350_000_000_000
      const expectedValue = BigInt(13500) * BigInt(USDC_PRICE);
      expect(totalCollateral).to.be.closeTo(expectedValue, BigInt(USDC_PRICE)); // Allow $1 tolerance
    });

    it("should calculate max borrow across all collateral", async function () {
      // User1 supplies both assets
      const usdcAmount = ethers.parseUnits("10000", 6); // $10,000
      const wethAmount = ethers.parseUnits("1", 18); // $3,500

      await usdc.connect(user1).approve(usdcVaultAddress, usdcAmount);
      await usdcVault.connect(user1).supply(usdcAmount, NO_LOCK);

      await weth.connect(user1).approve(wethVaultAddress, wethAmount);
      await wethVault.connect(user1).supply(wethAmount, NO_LOCK);

      // Max borrow = 70% of $13,500 = $9,450
      const maxBorrowUsdc = await collateralManager.getMaxBorrow(user1.address, 0);

      // Expected: ~9450 USDC (6 decimals)
      expect(maxBorrowUsdc).to.be.closeTo(ethers.parseUnits("9450", 6), ethers.parseUnits("50", 6));
    });
  });
});
