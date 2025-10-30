/**
 * Script pour récupérer le bloc de déploiement du contrat Factory
 */

const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

const FACTORY_ADDRESS = '0x0BF94931d6c63EA092d91Ce7d67D46325B912349';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

async function main() {
  console.log('\n🔍 Recherche du bloc de déploiement...');
  console.log(`📍 Adresse Factory: ${FACTORY_ADDRESS}`);
  console.log(`🌐 RPC: ${BASE_SEPOLIA_RPC}\n`);

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC),
  });

  try {
    // Recherche binaire pour trouver le bloc de déploiement
    const currentBlock = await client.getBlockNumber();
    console.log(`📊 Bloc actuel: ${currentBlock.toString()}\n`);

    // Vérifier si le contrat existe maintenant
    const currentCode = await client.getBytecode({ address: FACTORY_ADDRESS });
    if (!currentCode || currentCode === '0x') {
      console.error('❌ Le contrat n\'existe pas à cette adresse!');
      process.exit(1);
    }

    console.log('✅ Contrat trouvé, recherche du bloc de déploiement...\n');

    // Recherche binaire
    let low = 0n;
    let high = currentBlock;
    let deploymentBlock = currentBlock;

    while (low <= high) {
      const mid = (low + high) / 2n;

      try {
        const code = await client.getBytecode({
          address: FACTORY_ADDRESS,
          blockNumber: mid
        });

        if (code && code !== '0x') {
          // Le contrat existe à ce bloc, chercher plus tôt
          deploymentBlock = mid;
          high = mid - 1n;
          console.log(`🔎 Bloc ${mid}: Contrat existe, recherche plus tôt...`);
        } else {
          // Le contrat n'existe pas encore, chercher plus tard
          low = mid + 1n;
          console.log(`🔎 Bloc ${mid}: Contrat n'existe pas, recherche plus tard...`);
        }
      } catch (error) {
        // Si erreur, le bloc est trop ancien, chercher plus tard
        low = mid + 1n;
      }
    }

    console.log('\n✅ ===== RÉSULTAT =====\n');
    console.log(`📍 Bloc de déploiement trouvé: ${deploymentBlock.toString()}`);
    console.log(`🔗 Voir sur BaseScan: https://sepolia.basescan.org/tx/${FACTORY_ADDRESS}?block=${deploymentBlock}`);

    console.log('\n📝 À copier dans lib/evm/constants.ts:');
    console.log(`export const FACTORY_DEPLOYMENT_BLOCK = ${deploymentBlock}n as const;`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
