const { createPublicClient, http, parseAbi } = require('viem');
const { baseSepolia } = require('viem/chains');

const VAULT_0 = '0x5Ce6A19e0c76aB47d7974960BCC2c2e56F100B4D';
const RPC_URL = 'https://sepolia.base.org';

async function main() {
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http(RPC_URL)
    });

    console.log(`Scanning Vault ${VAULT_0}...`);

    const FUNCTIONS = [
        'function vaultInfo() view returns (uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address)',
        'function token() view returns (address)',
        'function maxLiquidity() view returns (uint256)',
        'function borrowBaseRate() view returns (uint256)',
        'function liquidationThreshold() view returns (uint256)',
        'function vaultState() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256)',
        'function getVaultInfo() view returns (address)',
        'function info() view returns (address)',
        'function cvtToken() view returns (address)',
        'function protocol() view returns (address)',
        'function initialized() view returns (bool)'
    ];

    for (const sig of FUNCTIONS) {
        try {
            const abi = parseAbi([sig]);
            const name = sig.split('function ')[1].split('(')[0];
            console.log(`Checking ${name}...`);

            const res = await client.readContract({
                address: VAULT_0,
                abi: abi,
                functionName: name
            });

            console.log(`✅ ${name}: EXISTS!`, res);
        } catch (e) {
            // console.log(`❌ ${sig.split(' ')[1]} Failed`); 
            // Use e.message to see if it's revert or something else
            if (e.message.includes('execution reverted')) {
                console.log(`❌ ${sig.split('function ')[1].split('(')[0]}: Reverted`);
            } else {
                console.log(`❓ ${sig.split('function ')[1].split('(')[0]}: Error ${e.message.slice(0, 50)}...`);
            }
        }
    }
}

main();
