/**
 * Property Metadata Management for IPFS
 * Handles uploading and fetching property metadata from Pinata/IPFS
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
    type: string; // "deed", "inspection", "appraisal", etc.
  }>;
  location: {
    city: string;
    province: string;
    country: string;
  };
  financial: {
    totalShares: number;
    sharePrice: number; // in USD
    expectedReturn: number; // percentage
  };
  assetType: string; // "real_estate", "vehicle", "business", "collectible"
}

/**
 * Upload property metadata JSON to IPFS via Pinata
 */
export async function uploadPropertyMetadata(
  metadata: PropertyMetadata
): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT is not configured");
  }

  try {
    // Create JSON blob
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });

    // Create form data
    const formData = new FormData();
    formData.append("file", jsonBlob, `${metadata.name.replace(/\s+/g, "_")}_metadata.json`);

    // Add metadata for Pinata
    const pinataMetadata = JSON.stringify({
      name: `${metadata.name} - Property Metadata`,
      keyvalues: {
        type: "property_metadata",
        property_name: metadata.name,
        asset_type: metadata.assetType,
        city: metadata.location.city,
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    // Upload to Pinata
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
    console.log("✅ Property metadata uploaded to IPFS:", data.IpfsHash);

    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading property metadata:", error);
    throw error;
  }
}

/**
 * Fetch property metadata from IPFS
 */
export async function fetchPropertyMetadata(
  cid: string
): Promise<PropertyMetadata> {
  try {
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata: PropertyMetadata = await response.json();
    return metadata;
  } catch (error) {
    console.error("Error fetching property metadata:", error);
    throw error;
  }
}

/**
 * Get IPFS URL from CID
 */
export function getMetadataUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

/**
 * Create property metadata object from form data
 */
export function createPropertyMetadata(params: {
  assetType: string;
  name: string;
  city: string;
  province: string;
  country: string;
  description: string;
  longDescription: string;
  imageCid: string;
  surface: number;
  rooms: number;
  propertyType: string;
  yearBuilt: number;
  features: string;
  totalShares: number;
  sharePrice: number; // in USD
  expectedReturn: number; // percentage
  votingEnabled: boolean;
  externalUrl?: string;
}): PropertyMetadata {
  return {
    name: params.name,
    description: params.description,
    longDescription: params.longDescription,
    image: `ipfs://${params.imageCid}`,
    attributes: [
      { trait_type: "Surface", value: `${params.surface} m²` },
      { trait_type: "Rooms", value: params.rooms },
      { trait_type: "Property Type", value: params.propertyType },
      { trait_type: "Year Built", value: params.yearBuilt },
      { trait_type: "Expected Return", value: `${params.expectedReturn}%` },
      { trait_type: "Total Shares", value: params.totalShares },
      { trait_type: "Share Price", value: `$${params.sharePrice}` },
    ],
    features: params.features
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0),
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
  };
}
