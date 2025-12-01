/**
 * Pinata IPFS utilities for admin dashboard
 * Handles image and metadata uploads
 */

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

export interface PropertyMetadata {
  name: string;
  description: string;
  longDescription: string;
  image: string; // ipfs://Qm...
  images?: string[]; // Multiple images if available
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  features: string[];
  propertyType: string;
  yearBuilt: number;
  surface: number;
  rooms: number;
  votingEnabled: boolean;
  external_url?: string;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  location: {
    city: string;
    province: string;
    country: string;
  };
  financial: {
    totalShares: number;
    sharePrice: number;
    expectedReturn: number;
  };
  assetType: string;
  poolType: "usdc" | "weth" | "both";
}

/**
 * Upload image file to IPFS via Pinata
 */
export async function uploadImageToIPFS(file: File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT is not configured");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const pinataMetadata = JSON.stringify({
      name: `${file.name}`,
      keyvalues: {
        type: "property_image",
        uploadedAt: new Date().toISOString(),
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log("Image uploaded to IPFS:", data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Upload property metadata JSON to IPFS via Pinata
 */
export async function uploadMetadataToIPFS(metadata: PropertyMetadata): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT is not configured");
  }

  try {
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });

    const formData = new FormData();
    formData.append("file", jsonBlob, `${metadata.name.replace(/\s+/g, "_")}_metadata.json`);

    const pinataMetadata = JSON.stringify({
      name: `${metadata.name} - Property Metadata`,
      keyvalues: {
        type: "property_metadata",
        property_name: metadata.name,
        asset_type: metadata.assetType,
        city: metadata.location.city,
        pool_type: metadata.poolType,
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log("Metadata uploaded to IPFS:", data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL from CID
 */
export function getIPFSUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

/**
 * Create property metadata object from form data
 */
export function createPropertyMetadata(params: {
  name: string;
  description: string;
  longDescription: string;
  imageCid: string;
  assetType: string;
  propertyType: string;
  city: string;
  province: string;
  country: string;
  surface: number;
  rooms: number;
  yearBuilt: number;
  features: string[];
  expectedReturn: number;
  totalShares: number;
  sharePrice: number;
  votingEnabled: boolean;
  poolType: "usdc" | "weth" | "both";
  externalUrl?: string;
}): PropertyMetadata {
  return {
    name: params.name,
    description: params.description,
    longDescription: params.longDescription,
    image: `ipfs://${params.imageCid}`,
    attributes: [
      { trait_type: "Surface", value: `${params.surface} m2` },
      { trait_type: "Rooms", value: params.rooms },
      { trait_type: "Property Type", value: params.propertyType },
      { trait_type: "Year Built", value: params.yearBuilt },
      { trait_type: "Expected Return", value: `${params.expectedReturn}%` },
      { trait_type: "Total Shares", value: params.totalShares },
      { trait_type: "Share Price", value: `$${params.sharePrice}` },
      { trait_type: "Pool Type", value: params.poolType.toUpperCase() },
    ],
    features: params.features,
    propertyType: params.propertyType,
    yearBuilt: params.yearBuilt,
    surface: params.surface,
    rooms: params.rooms,
    votingEnabled: params.votingEnabled,
    external_url: params.externalUrl,
    location: {
      city: params.city,
      province: params.province,
      country: params.country,
    },
    financial: {
      totalShares: params.totalShares,
      sharePrice: params.sharePrice,
      expectedReturn: params.expectedReturn,
    },
    assetType: params.assetType,
    poolType: params.poolType,
  };
}
