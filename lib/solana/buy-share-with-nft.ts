/**
 * Helper to buy a share with automatic NFT generation
 * This wraps the buyShare instruction with NFT image and metadata generation
 */

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { buyShare, fetchProperty } from "./instructions";
import { generateNFTImage, uploadNFTImage } from "@/lib/nft/generator";
import { generateNFTMetadata, uploadNFTMetadata } from "@/lib/nft/metadata";
import { Property } from "./types";

export interface BuyShareWithNFTResult {
  transaction: Transaction;
  shareNFTPDA: PublicKey;
  tokenId: number;
  nftImageCid: string;
  nftMetadataCid: string;
}

/**
 * Buy a share with automatic NFT generation
 *
 * This function:
 * 1. Fetches the property data
 * 2. Generates a unique NFT image with overlay
 * 3. Uploads the NFT image to IPFS
 * 4. Generates NFT metadata JSON
 * 5. Uploads the NFT metadata to IPFS
 * 6. Creates the buy share transaction with the NFT CIDs
 */
export async function buyShareWithNFT(
  connection: Connection,
  propertyPDA: PublicKey,
  buyer: PublicKey
): Promise<BuyShareWithNFTResult> {
  console.log("🎨 Starting NFT generation for share purchase...");

  // 1. Fetch property data
  const property = await fetchProperty(connection, propertyPDA);
  if (!property) {
    throw new Error("Property not found");
  }

  const tokenId = property.sharesSold.toNumber();
  const clock = Math.floor(Date.now() / 1000);

  console.log(`📊 Property: ${property.name}`);
  console.log(`🎟️ Share #${tokenId} of ${property.totalShares.toNumber()}`);

  // 2. Generate NFT image with overlay
  console.log("🖼️ Generating NFT image...");
  const nftImageBlob = await generateNFTImage({
    propertyImageCid: property.imageCid,
    propertyName: property.name,
    shareNumber: tokenId,
    totalShares: property.totalShares.toNumber(),
    city: property.city,
    province: property.province,
    country: property.country,
    votingPower: property.votingEnabled ? 1 : 0,
    assetType: property.assetType,
  });

  // 3. Upload NFT image to IPFS
  console.log("☁️ Uploading NFT image to IPFS...");
  const nftImageCid = await uploadNFTImage(nftImageBlob, {
    propertyName: property.name,
    shareNumber: tokenId,
  });
  console.log(`✅ NFT image uploaded: ipfs://${nftImageCid}`);

  // 4. Generate NFT metadata
  console.log("📝 Generating NFT metadata...");
  const nftMetadata = generateNFTMetadata({
    property: property,
    propertyMetadataCid: property.metadataCid,
    shareNumber: tokenId,
    owner: buyer.toBase58(),
    mintTime: clock,
    nftImageCid: nftImageCid,
    votingPower: property.votingEnabled ? 1 : 0,
  });

  // 5. Upload NFT metadata to IPFS
  console.log("☁️ Uploading NFT metadata to IPFS...");
  const nftMetadataCid = await uploadNFTMetadata(
    nftMetadata,
    property.name,
    tokenId
  );
  console.log(`✅ NFT metadata uploaded: ipfs://${nftMetadataCid}`);

  // 6. Create buy share transaction
  console.log("🔗 Creating buy share transaction...");
  const { transaction, shareNFTPDA } = await buyShare(
    connection,
    propertyPDA,
    buyer,
    nftImageCid,
    nftMetadataCid
  );

  console.log("✅ NFT generated and transaction ready!");

  return {
    transaction,
    shareNFTPDA,
    tokenId,
    nftImageCid,
    nftMetadataCid,
  };
}
