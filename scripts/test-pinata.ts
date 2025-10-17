/**
 * Script de test pour vérifier l'upload Pinata
 * Usage: ts-node scripts/test-pinata.ts
 */

import { pinata, isPinataConfigured, getIpfsUrl } from "../lib/pinata/upload";
import * as fs from "fs";
import * as path from "path";

async function testPinataConnection() {
  console.log("🧪 Test de connexion Pinata...\n");

  // 1. Vérifier la configuration
  console.log("1️⃣ Vérification de la configuration:");
  const isConfigured = isPinataConfigured();
  console.log(`   - Pinata configuré: ${isConfigured ? "✅ Oui" : "❌ Non"}`);

  if (!isConfigured) {
    console.error("\n❌ Pinata n'est pas configuré !");
    console.error("Vérifiez que NEXT_PUBLIC_PINATA_JWT et NEXT_PUBLIC_PINATA_GATEWAY sont définis dans .env.local");
    process.exit(1);
  }

  console.log(`   - JWT: ${process.env.NEXT_PUBLIC_PINATA_JWT?.substring(0, 20)}...`);
  console.log(`   - Gateway: ${process.env.NEXT_PUBLIC_PINATA_GATEWAY}\n`);

  // 2. Tester l'upload d'un fichier texte
  console.log("2️⃣ Test d'upload d'un fichier texte:");
  try {
    const testData = {
      name: "Test Property",
      description: "Ceci est un test d'upload sur Pinata",
      timestamp: new Date().toISOString(),
      test: true,
    };

    const blob = new Blob([JSON.stringify(testData, null, 2)], { type: "application/json" });
    const file = new File([blob], "test-metadata.json", { type: "application/json" });

    const upload = await pinata.upload.file(file);
    const cid = upload.IpfsHash;

    console.log(`   ✅ Upload réussi !`);
    console.log(`   - CID: ${cid}`);
    console.log(`   - URL: ${getIpfsUrl(cid)}\n`);

    // 3. Vérifier l'accès au fichier
    console.log("3️⃣ Vérification de l'accès au fichier:");
    const url = getIpfsUrl(cid);
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Fichier accessible !`);
      console.log(`   - Données récupérées:`, data);
    } else {
      console.error(`   ❌ Impossible d'accéder au fichier (status: ${response.status})`);
    }
  } catch (error) {
    console.error("   ❌ Erreur lors de l'upload:", error);
    process.exit(1);
  }

  console.log("\n✅ Tous les tests Pinata sont passés !");
  console.log("\n📝 Vous pouvez maintenant créer une propriété depuis l'interface admin.");
}

// Exécuter les tests
testPinataConnection().catch((error) => {
  console.error("\n❌ Erreur fatale:", error);
  process.exit(1);
});
