import { PinataSDK } from "pinata-web3";

// Configuration Pinata
// Tu devras créer un compte sur https://pinata.cloud et récupérer tes clés
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

export const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
});

/**
 * Upload une image sur IPFS via Pinata
 * @param file - Fichier image à uploader
 * @param propertyName - Nom de la propriété (pour les métadonnées)
 * @returns CID IPFS de l'image uploadée
 */
export async function uploadPropertyImage(
  file: File,
  propertyName: string
): Promise<string> {
  try {
    // Upload le fichier sur IPFS
    const upload = await pinata.upload.file(file);

    // Récupérer le CID
    const cid = upload.IpfsHash;

    console.log("✅ Image uploadée sur IPFS:", cid);
    console.log("📍 URL:", `https://${PINATA_GATEWAY}/ipfs/${cid}`);

    return cid;
  } catch (error) {
    console.error("❌ Erreur upload IPFS:", error);
    throw new Error("Impossible d'uploader l'image sur IPFS");
  }
}

/**
 * Récupérer l'URL complète d'une image IPFS
 * @param cid - CID IPFS de l'image
 * @returns URL complète de l'image
 */
export function getIpfsUrl(cid: string): string {
  if (!cid) return "";

  // Retourner l'URL via la gateway Pinata
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

/**
 * Upload plusieurs images (pour une galerie)
 * @param files - Array de fichiers images
 * @param propertyName - Nom de la propriété
 * @returns Array de CIDs
 */
export async function uploadPropertyGallery(
  files: File[],
  propertyName: string
): Promise<string[]> {
  const cids: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const cid = await uploadPropertyImage(file, `${propertyName}-${i + 1}`);
    cids.push(cid);
  }

  console.log(`✅ ${cids.length} images uploadées sur IPFS`);
  return cids;
}

/**
 * Vérifier si Pinata est configuré
 */
export function isPinataConfigured(): boolean {
  return !!PINATA_JWT && !!PINATA_GATEWAY;
}
