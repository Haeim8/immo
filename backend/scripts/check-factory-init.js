/**
 * Script pour vérifier si le contrat Factory est initialisé
 */

const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');
const fs = require('fs');
const path = require('path');

const FACTORY_ADDRESS = '0x0BF94931d6c63EA092d91Ce7d67D46325B912349';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

async function main() {
  console.log('\n🔍 ===== VÉRIFICATION INITIALISATION FACTORY =====\n');
  console.log(`📍 Adresse Factory: ${FACTORY_ADDRESS}`);
  console.log(`🌐 RPC: ${BASE_SEPOLIA_RPC}\n`);

  // Créer le client
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });

  // Charger l'ABI
  const abiPath = path.join(__dirname, '../artifacts/contracts/USCIFactory.sol/USCIFactory.json');
  const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const FACTORY_ABI = contractJson.abi;

  try {
    // Vérifier que le contrat existe
    const code = await client.getBytecode({ address: FACTORY_ADDRESS });
    if (!code || code === '0x') {
      console.error('❌ Le contrat n\'existe pas à cette adresse!');
      process.exit(1);
    }
    console.log('✅ Contrat trouvé\n');

    // Lire l'admin
    const admin = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'admin',
    });

    // Lire le treasury
    const treasury = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'treasury',
    });

    // Lire le nombre de places créées
    const placeCount = await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'placeCount',
    });

    console.log('📊 ===== ÉTAT DU CONTRAT =====\n');
    console.log('👑 Admin:', admin);
    console.log('💰 Treasury:', treasury);
    console.log('🏠 Places créées:', placeCount.toString());

    // Vérifier si initialisé
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    if (admin === zeroAddress || treasury === zeroAddress) {
      console.log('\n❌ ===== CONTRAT NON INITIALISÉ =====');
      console.log('Le contrat Factory n\'a PAS été initialisé!');
      console.log('\nPour initialiser le contrat:');
      console.log('1. Décommentez la fonction initialize() dans USCIFactory.sol');
      console.log('2. Redéployez le contrat');
      console.log('OU');
      console.log('3. Utilisez le constructor pour passer admin et treasury au déploiement\n');
      process.exit(1);
    }

    console.log('\n✅ ===== CONTRAT INITIALISÉ =====');
    console.log('Le contrat est correctement initialisé!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
