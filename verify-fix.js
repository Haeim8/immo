const { createPublicClient, http, parseAbi } = require('viem');
const { baseSepolia } = require('viem/chains');

// NEW FIXED Reader Address (V3)
const READER_ADDRESS = '0x5543B24592ACa039d752C59716aD60f97e88b86D';
const PROTOCOL_ADDRESS = '0x019A6562e7966Da17C1EE3ec4A3d0c79E079CeA5';
const RPC_URL = 'https://sepolia.base.org';

async function main() {
    console.log("=== STARTING DIAGNOSTIC ===");

    const client = createPublicClient({
        chain: baseSepolia,
        transport: http(RPC_URL)
    });

    // 1. Check Protocol Vault Count
    console.log(`\n1. Checking Protocol at ${PROTOCOL_ADDRESS}...`);
    try {
        const count = await client.readContract({
            address: PROTOCOL_ADDRESS,
            abi: parseAbi(['function vaultCount() view returns (uint256)']),
            functionName: 'vaultCount'
        });
        console.log(`✅ Protocol vaultCount: ${count.toString()}`);

        if (count > 0n) {
            // 2. Check getVaultAddress(0) from Protocol
            console.log(`\n2. Checking getVaultAddress(0)...`);
            let vault0Address;
            try {
                vault0Address = await client.readContract({
                    address: PROTOCOL_ADDRESS,
                    abi: parseAbi(['function getVaultAddress(uint256) view returns (address)']),
                    functionName: 'getVaultAddress',
                    args: [0n]
                });
                console.log(`✅ Protocol getVaultAddress(0) -> ${vault0Address}`);
            } catch (e) {
                console.error(`❌ Protocol getVaultAddress(0) FAILED: ${e.message}`);
                return; // Stop here if we can't get address
            }

            // 3. Check Vault 0 Direct Call (OLD ABI vs NEW ABI)
            console.log(`\n3. Checking Vault at ${vault0Address}...`);

            try {
                const code = await client.getBytecode({ address: vault0Address });
                console.log(`   Vault Code Length: ${code ? code.length : 0} bytes`);

                if (!code || code.length === 0) {
                    console.error("❌ VAULT HAS NO CODE (Self-destructed or wrong address?)");
                } else {
                    console.log("✅ Vault has code.");
                }

            } catch (e) {
                console.error(`❌ Vault check failed: ${e.message}`);
            }

        } else {
            console.log("Protocol has 0 vaults. Reader should return empty array.");
        }

    } catch (e) {
        console.error("❌ Failed to reach Protocol:", e.message);
    }

    // 4. Finally Check Reader
    console.log(`\n4. Checking Reader at ${READER_ADDRESS}...`);
    try {
        const vaults = await client.readContract({
            address: READER_ADDRESS,
            abi: parseAbi([
                'function getVaults(uint256 offset, uint256 limit) view returns ((uint256 vaultId, address vaultAddress, uint256 maxLiquidity, uint256 borrowBaseRate, uint256 borrowSlope, uint256 maxBorrowRatio, uint256 liquidationBonus, uint256 liquidationThreshold, uint256 expectedReturn, uint256 currentBorrowRate, bool isActive, uint256 createdAt, uint256 totalSupplied, uint256 totalBorrowed, uint256 availableLiquidity, uint256 utilizationRate, uint256 fundingProgress, uint256 totalInterestCollected, uint256 totalBadDebt, address cvtToken, uint256 cvtTotalSupply, bool isPaused, address underlyingToken)[])'
            ]),
            functionName: 'getVaults',
            args: [0n, 1n]
        });
        console.log(`✅ Reader getVaults(0,1) success! Found ${vaults.length} vaults.`);
        console.log(vaults[0]);
    } catch (e) {
        console.error(`❌ Reader getVaults(0,1) FAILED: ${e.message}`);
    }
}

main();
