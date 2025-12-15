const { ethers } = require("hardhat");

async function main() {
  const userAddr = "0xD9C228C0F84cb4DC2Fb37F5af496Ef16Ea94fd79";
  const vaultAddr = "0x7D2C4552E9332b6DDD74e0Ea7F153dAaA239650A";
  const stakingAddr = "0x63408BAf8a2a023315e17b457F68EaA50CDFA376";
  const cvtAddr = "0x4A539C79C9cB592F545Bb5b09296929a46898dfc";

  console.log("Checking user:", userAddr);
  console.log("=".repeat(50));

  // Get contracts
  const vault = await ethers.getContractAt("CantorVault", vaultAddr);
  const staking = await ethers.getContractAt("CVTStaking", stakingAddr);
  // Use ERC20 ABI for CVT
  const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
  const cvt = new ethers.Contract(cvtAddr, ERC20_ABI, ethers.provider);

  // Check user position in vault
  const position = await vault.positions(userAddr);
  console.log("\n=== VAULT POSITION ===");
  console.log("Raw position:", position);
  // Position struct: [supplied, borrowed, lastInterestUpdate, interestAccrued]
  const supplied = position[0] || position.supplied || 0n;
  const borrowed = position[1] || position.borrowed || 0n;
  console.log("Supplied:", ethers.formatUnits(supplied, 6), "USDC");
  console.log("Borrowed:", ethers.formatUnits(borrowed, 6), "USDC");

  // Check CVT balance
  const cvtBalance = await cvt.balanceOf(userAddr);
  console.log("\n=== CVT TOKEN ===");
  console.log("CVT Balance:", ethers.formatUnits(cvtBalance, 18), "CVT");

  // Check staking position
  try {
    const stakePos = await staking.getStakePosition(userAddr);
    console.log("\n=== STAKING POSITION ===");
    console.log("Staked:", ethers.formatUnits(stakePos.amount, 18), "CVT");
  } catch(e) {
    console.log("\n=== STAKING POSITION ===");
    console.log("No staking position");
  }

  // Check max borrow
  const maxBorrow = await vault.getMaxBorrow(userAddr);
  console.log("\n=== BORROW CAPACITY ===");
  console.log("Max Borrow:", ethers.formatUnits(maxBorrow, 6), "USDC");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("ANALYSIS:");
  const suppliedNum = parseFloat(ethers.formatUnits(supplied, 6));
  const cvtBal = parseFloat(ethers.formatUnits(cvtBalance, 18));
  const maxBorrowAmt = parseFloat(ethers.formatUnits(maxBorrow, 6));

  console.log(`- User supplied ${suppliedNum} USDC`);
  console.log(`- User has ${cvtBal} CVT tokens`);
  console.log(`- User can borrow up to ${maxBorrowAmt} USDC (70% LTV)`);

  if (cvtBal > 0) {
    console.log("\n⚠️  POTENTIAL ISSUE:");
    console.log("If user stakes their CVT, they could:");
    console.log("1. Have their supply backing protocol borrowing (via staking)");
    console.log("2. ALSO borrow themselves using the same collateral");
    console.log("= Double use of the same collateral!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
