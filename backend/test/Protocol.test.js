const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("CantorFi Protocol", function () {
  let owner, admin, treasury, user1, user2, user3;
  let usdc, weth; // Two tokens
  let protocol, factory, feeCollector, vaultImplementation;
  let boatVault, boatVaultAddress, boatVaultId;
  let carVault, carVaultAddress, carVaultId;

  // Constants
  const SETUP_FEE = 100; // 1%
  const PERFORMANCE_FEE = 1000; // 10%
  const BORROW_FEE_RATE = 1500; // 15% - Le protocole prend 15% des intérêts d'emprunt
  const USDC_INITIAL_SUPPLY = ethers.parseUnits("500000000", 6); // 500M USDC
  const WETH_INITIAL_SUPPLY = ethers.parseUnits("500000000", 18); // 500M WETH (for tests)

  // Vault parameters - Boat: 200M WETH
  const BOAT_VAULT = {
    maxLiquidity: ethers.parseUnits("200000000", 18), // 200M max liquidity
    borrowBaseRate: 500, // 5%
    borrowSlope: 1000, // 10%
    maxBorrowRatio: 7000, // 70%
    liquidationBonus: 500, // 5%
    liquidationThreshold: 8000 // 80%
  };

  // Vault parameters - Car: 15M USDC
  const CAR_VAULT = {
    maxLiquidity: ethers.parseUnits("15000000", 6), // 15M max liquidity
    borrowBaseRate: 500, // 5%
    borrowSlope: 1000, // 10%
    maxBorrowRatio: 7000, // 70%
    liquidationBonus: 500, // 5%
    liquidationThreshold: 8000 // 80%
  };

  let cvt;

  beforeEach(async function () {
    this.timeout(120000); // 2 minutes for deployment

    [owner, admin, treasury, user1, user2, user3] = await ethers.getSigners();
    // Deploy Mock USDC (6 decimals)
    const MockToken = await ethers.getContractFactory("MockERC20");
    usdc = await MockToken.deploy("Mock USDC", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy Mock WETH (18 decimals)
    weth = await MockToken.deploy("Wrapped Ether", "WETH", 18);
    await weth.waitForDeployment();

    // Mint USDC to users
    await usdc.mint(owner.address, USDC_INITIAL_SUPPLY);
    await usdc.mint(admin.address, USDC_INITIAL_SUPPLY);
    await usdc.mint(user1.address, USDC_INITIAL_SUPPLY);
    await usdc.mint(user2.address, USDC_INITIAL_SUPPLY);
    await usdc.mint(user3.address, USDC_INITIAL_SUPPLY);

    // Mint WETH to users
    await weth.mint(owner.address, WETH_INITIAL_SUPPLY);
    await weth.mint(admin.address, WETH_INITIAL_SUPPLY);
    await weth.mint(user1.address, WETH_INITIAL_SUPPLY);
    await weth.mint(user2.address, WETH_INITIAL_SUPPLY);
    await weth.mint(user3.address, WETH_INITIAL_SUPPLY);

    // Deploy global CVT token
    const CVT = await ethers.getContractFactory("CVT");
    cvt = await CVT.deploy(admin.address);
    await cvt.waitForDeployment();

    // Deploy CantorFiProtocol via UUPS proxy
    const CantorFiProtocol = await ethers.getContractFactory("CantorFiProtocol");
    protocol = await upgrades.deployProxy(
      CantorFiProtocol,
      [admin.address, treasury.address, SETUP_FEE, PERFORMANCE_FEE, BORROW_FEE_RATE],
      { kind: "uups" }
    );
    await protocol.waitForDeployment();

    // Deploy FeeCollector via UUPS proxy
    const FeeCollector = await ethers.getContractFactory("FeeCollector");
    feeCollector = await upgrades.deployProxy(
      FeeCollector,
      [admin.address, treasury.address],
      { kind: "uups" }
    );
    await feeCollector.waitForDeployment();

    // Set FeeCollector in Protocol
    await protocol.connect(admin).setFeeCollector(await feeCollector.getAddress());

    // Deploy CantorVault implementation (for cloning - not proxied itself)
    const CantorVault = await ethers.getContractFactory("CantorVault");
    vaultImplementation = await CantorVault.deploy();
    await vaultImplementation.waitForDeployment();

    // Deploy CantorAssetFactory via UUPS proxy
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

    // Grant factory ADMIN_ROLE on CVT so it can addMinter for new vaults
    await cvt.connect(admin).grantRole(await cvt.ADMIN_ROLE(), await factory.getAddress());

    // Grant FACTORY_ROLE to factory in protocol
    await protocol.connect(admin).addFactory(await factory.getAddress());

    // Grant NOTIFIER_ROLE to factory in feeCollector
    await feeCollector.connect(admin).addNotifier(await factory.getAddress());
  });

  // Helper function to create a vault
  async function createVault(token, vaultParams, creator = admin) {
    const tokenAddress = await token.getAddress();
    const params = {
      token: tokenAddress,
      ...vaultParams
    };

    const tx = await factory.connect(creator).createVault(params);
    const receipt = await tx.wait();

    // Get vault address from event
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
    const vaultContract = CantorVault.attach(vaultAddr);

    // Grant NOTIFIER_ROLE to vault in feeCollector
    await feeCollector.connect(admin).addNotifier(vaultAddr);

    return { vault: vaultContract, vaultAddress: vaultAddr, vaultId: parsedEvent.args.vaultId };
  }

  // Helper to create both vaults
  async function createBothVaults() {
    // Create Boat vault with WETH (200M, 13 years)
    const boatResult = await createVault(weth, BOAT_VAULT, admin);
    boatVault = boatResult.vault;
    boatVaultAddress = boatResult.vaultAddress;
    boatVaultId = boatResult.vaultId;

    // Create Car vault with USDC (15M, 10 years)
    const carResult = await createVault(usdc, CAR_VAULT, admin);
    carVault = carResult.vault;
    carVaultAddress = carResult.vaultAddress;
    carVaultId = carResult.vaultId;

    return { boatResult, carResult };
  }

  // ============== TEST SECTIONS ==============

  describe("Deployment", function () {
    it("should deploy all contracts correctly", async function () {
      expect(await protocol.getAddress()).to.be.properAddress;
      expect(await factory.getAddress()).to.be.properAddress;
      expect(await feeCollector.getAddress()).to.be.properAddress;
      expect(await vaultImplementation.getAddress()).to.be.properAddress;
    });

    it("should have correct admin roles", async function () {
      const ADMIN_ROLE = await protocol.ADMIN_ROLE();
      expect(await protocol.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("should have two different tokens deployed", async function () {
      expect(await usdc.decimals()).to.equal(6);
      expect(await weth.decimals()).to.equal(18);
      expect(await usdc.symbol()).to.equal("USDC");
      expect(await weth.symbol()).to.equal("WETH");
    });
  });

  describe("Vault Creation", function () {
    it("should create Boat vault with WETH (200M)", async function () {
      const { boatResult } = await createBothVaults();

      expect(boatResult.vaultAddress).to.be.properAddress;

      const vaultInfo = await boatVault.getVaultInfo();
      expect(vaultInfo.maxLiquidity).to.equal(BOAT_VAULT.maxLiquidity);
      expect(vaultInfo.borrowBaseRate).to.equal(BOAT_VAULT.borrowBaseRate);
    });

    it("should create Car vault with USDC (15M)", async function () {
      await createBothVaults();

      expect(carVaultAddress).to.be.properAddress;

      const vaultInfo = await carVault.getVaultInfo();
      expect(vaultInfo.maxLiquidity).to.equal(CAR_VAULT.maxLiquidity);
      expect(vaultInfo.borrowBaseRate).to.equal(CAR_VAULT.borrowBaseRate);
    });

    it("should have different tokens for each vault", async function () {
      await createBothVaults();

      const boatToken = await boatVault.token();
      const carToken = await carVault.token();

      expect(boatToken).to.equal(await weth.getAddress());
      expect(carToken).to.equal(await usdc.getAddress());
      expect(boatToken).to.not.equal(carToken);
    });

    it("should have protocol set correctly", async function () {
      await createBothVaults();

      // Verify vaults are registered in protocol
      expect(await protocol.vaultCount()).to.equal(2);
      expect(await protocol.getVaultAddress(0)).to.equal(boatVaultAddress);
      expect(await protocol.getVaultAddress(1)).to.equal(carVaultAddress);
    });
  });

  describe("Supply", function () {
    beforeEach(async function () {
      await createBothVaults();
    });

    // Default lock config (no lock)
    const NO_LOCK = {
      hasLock: false,
      lockDurationSeconds: 0,
      canWithdrawEarly: false,
      earlyWithdrawalFee: 0
    };

    it("should allow user to supply WETH to Boat vault", async function () {
      const supplyAmount = ethers.parseUnits("1000", 18); // 1000 WETH

      await weth.connect(user1).approve(boatVaultAddress, supplyAmount);
      await boatVault.connect(user1).supply(supplyAmount, NO_LOCK);

      const position = await boatVault.getUserPosition(user1.address);
      expect(position.amount).to.equal(supplyAmount);
    });

    it("should allow user to supply USDC to Car vault", async function () {
      const supplyAmount = ethers.parseUnits("10000", 6); // 10,000 USDC

      await usdc.connect(user1).approve(carVaultAddress, supplyAmount);
      await carVault.connect(user1).supply(supplyAmount, NO_LOCK);

      const position = await carVault.getUserPosition(user1.address);
      expect(position.amount).to.equal(supplyAmount);
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      await createBothVaults();
    });

    const NO_LOCK = {
      hasLock: false,
      lockDurationSeconds: 0,
      canWithdrawEarly: false,
      earlyWithdrawalFee: 0
    };

    it("should allow user to withdraw WETH from Boat vault", async function () {
      const supplyAmount = ethers.parseUnits("1000", 18);

      await weth.connect(user1).approve(boatVaultAddress, supplyAmount);
      await boatVault.connect(user1).supply(supplyAmount, NO_LOCK);

      const balanceBefore = await weth.balanceOf(user1.address);

      await boatVault.connect(user1).withdraw(supplyAmount);

      const balanceAfter = await weth.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      await createBothVaults();
    });

    const NO_LOCK = {
      hasLock: false,
      lockDurationSeconds: 0,
      canWithdrawEarly: false,
      earlyWithdrawalFee: 0
    };

    it("should allow user to borrow from Boat vault after supply", async function () {
      // User supplies WETH first (as collateral)
      const supplyAmount = ethers.parseUnits("10000", 18);
      await weth.connect(user1).approve(boatVaultAddress, supplyAmount);
      await boatVault.connect(user1).supply(supplyAmount, NO_LOCK);

      // User borrows against their collateral (max 70% = 7000 WETH)
      const borrowAmount = ethers.parseUnits("5000", 18); // 50% of supply
      const userBalanceBefore = await weth.balanceOf(user1.address);

      await boatVault.connect(user1).borrow(borrowAmount);

      const userBalanceAfter = await weth.balanceOf(user1.address);
      expect(userBalanceAfter - userBalanceBefore).to.equal(borrowAmount);

      // Verify position
      const position = await boatVault.getUserPosition(user1.address);
      expect(position.borrowedAmount).to.equal(borrowAmount);
    });
  });

  describe("Repay", function () {
    // Tests will be added here
  });

  describe("Revenue Distribution", function () {
    // Tests will be added here
  });

  describe("Capital Repayment", function () {
    // Tests will be added here
  });

  describe("Liquidation", function () {
    // Tests will be added here
  });

  describe("Fee Collection", function () {
    beforeEach(async function () {
      await createBothVaults();
    });

    const NO_LOCK = {
      hasLock: false,
      lockDurationSeconds: 0,
      canWithdrawEarly: false,
      earlyWithdrawalFee: 0
    };

    it("should collect fees on borrow repayment", async function () {
      // Supply WETH
      const supplyAmount = ethers.parseUnits("10000", 18);
      await weth.connect(user1).approve(boatVaultAddress, supplyAmount);
      await boatVault.connect(user1).supply(supplyAmount, NO_LOCK);

      // Borrow
      const borrowAmount = ethers.parseUnits("5000", 18);
      await boatVault.connect(user1).borrow(borrowAmount);

      // Advance time to accrue interest
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
      await ethers.provider.send("evm_mine");

      // Repay - approve a bit more for interest
      const repayAmount = ethers.parseUnits("6000", 18);
      await weth.connect(user1).approve(boatVaultAddress, repayAmount);
      await boatVault.connect(user1).repayBorrow(repayAmount);

      // Check FeeCollector received fees
      const feeCollectorAddress = await feeCollector.getAddress();
      const wethFees = await weth.balanceOf(feeCollectorAddress);
      expect(wethFees).to.be.gt(0);
    });
  });

  describe("Access Control", function () {
    // Tests will be added here
  });

  describe("Edge Cases", function () {
    // Tests will be added here
  });
});
