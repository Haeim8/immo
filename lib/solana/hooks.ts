"use client";

import { useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  claimDividends,
  createProperty,
  depositDividends,
  fetchProperty,
  fetchShareNFT,
  fetchUserShareNFTs,
  fetchAllShareNFTs,
  fetchAllProperties,
  fetchPropertyProposals,
  closePropertySale,
  createProposalInstruction,
  closeProposalInstruction,
  liquidateProperty,
  initializeFactoryInstruction,
  fetchFactory,
} from "./instructions";
import { buyShareWithNFT } from "./buy-share-with-nft";
import {
  CreatePropertyParams,
  Property,
  ShareNFT,
  Proposal,
  Factory,
} from "./types";
import BN from "bn.js";

export function useBrickChain() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any) => {
    console.error(err);
    setError(err.message || "An error occurred");
    setLoading(false);
  }, []);

  const buyPropertyShare = useCallback(
    async (propertyPDA: PublicKey) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        // Generate SVG NFT and create transaction
        const { transaction, shareNFTPDA, tokenId, nftSvgData } =
          await buyShareWithNFT(connection, propertyPDA, publicKey);

        // Send transaction
        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return {
          signature,
          shareNFTPDA,
          tokenId,
          nftSvgData
        };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const claimShareDividends = useCallback(
    async (shareNFTPDA: PublicKey) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const { transaction, claimableAmount } = await claimDividends(
          connection,
          shareNFTPDA,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature, amount: claimableAmount };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const createNewProperty = useCallback(
    async (params: CreatePropertyParams) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const { transaction, propertyPDA } = await createProperty(
          connection,
          params,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature, propertyPDA };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const depositPropertyDividends = useCallback(
    async (propertyPDA: PublicKey, amount: number) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const transaction = await depositDividends(
          connection,
          propertyPDA,
          amount,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const createGovernanceProposal = useCallback(
    async (
      propertyPDA: PublicKey,
      title: string,
      description: string,
      votingDurationSeconds: number
    ) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const { transaction, proposalPDA, proposalId } =
          await createProposalInstruction(
            connection,
            propertyPDA,
            publicKey,
            title,
            description,
            votingDurationSeconds
          );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature, proposalPDA, proposalId };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const closeGovernanceProposal = useCallback(
    async (propertyPDA: PublicKey, proposalPDA: PublicKey) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const transaction = await closeProposalInstruction(
          connection,
          propertyPDA,
          proposalPDA,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const closeSaleManually = useCallback(
    async (propertyPDA: PublicKey) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const transaction = await closePropertySale(
          connection,
          propertyPDA,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const triggerLiquidation = useCallback(
    async (propertyPDA: PublicKey, totalSaleAmountLamports: number) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const transaction = await liquidateProperty(
          connection,
          propertyPDA,
          totalSaleAmountLamports,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  const initializeFactory = useCallback(
    async (treasury: PublicKey) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const { transaction, factoryPDA } = await initializeFactoryInstruction(
          connection,
          publicKey,
          treasury,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature, factoryPDA };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [connection, publicKey, sendTransaction, handleError]
  );

  return {
    buyPropertyShare,
    claimShareDividends,
    createNewProperty,
    depositPropertyDividends,
    createGovernanceProposal,
    closeGovernanceProposal,
    closeSaleManually,
    triggerLiquidation,
    initializeFactory,
    loading,
    error,
  };
}

export function useProperty(propertyPDA: PublicKey | null) {
  const { connection } = useConnection();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyPDA) return;

    setLoading(true);
    fetchProperty(connection, propertyPDA)
      .then(setProperty)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [connection, propertyPDA]);

  const refresh = useCallback(() => {
    if (!propertyPDA) return;

    setLoading(true);
    fetchProperty(connection, propertyPDA)
      .then(setProperty)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [connection, propertyPDA]);

  return { property, loading, error, refresh };
}

// Cache configuration
const CACHE_KEY = "usci_properties_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Proposals cache constants
const PROPOSALS_CACHE_KEY_PREFIX = "usci_proposals_cache_";
const PROPOSALS_CACHE_DURATION = 30 * 1000; // 30 seconds (propositions changent plus souvent)

interface CachedProperties {
  properties: Array<{ publicKey: string; account: any }>;
  timestamp: number;
}

interface CachedProposals {
  proposals: Array<{ publicKey: string; account: any }>;
  timestamp: number;
}

// Reconstruct BN objects from cached JSON data
function reconstructPropertyAccount(cachedAccount: any): Property {
  return {
    ...cachedAccount,
    propertyId: new BN(cachedAccount.propertyId),
    totalShares: new BN(cachedAccount.totalShares),
    sharePrice: new BN(cachedAccount.sharePrice),
    sharesSold: new BN(cachedAccount.sharesSold),
    saleStart: new BN(cachedAccount.saleStart),
    saleEnd: new BN(cachedAccount.saleEnd),
    totalDividendsDeposited: new BN(cachedAccount.totalDividendsDeposited),
    totalDividendsClaimed: new BN(cachedAccount.totalDividendsClaimed),
    proposalCount: new BN(cachedAccount.proposalCount),
    liquidationAmount: new BN(cachedAccount.liquidationAmount),
    liquidationClaimed: new BN(cachedAccount.liquidationClaimed),
    isLiquidated: cachedAccount.isLiquidated,
    factory: new PublicKey(cachedAccount.factory),
  };
}

function getCachedProperties(): Array<{ publicKey: PublicKey; account: Property }> | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedProperties = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Reconstruct PublicKey and BN objects
    return data.properties.map((p) => ({
      publicKey: new PublicKey(p.publicKey),
      account: reconstructPropertyAccount(p.account),
    }));
  } catch (err) {
    console.error("Error reading cache:", err);
    return null;
  }
}

function setCachedProperties(properties: Array<{ publicKey: PublicKey; account: Property }>) {
  if (typeof window === "undefined") return;

  try {
    const data: CachedProperties = {
      properties: properties.map((p) => ({
        publicKey: p.publicKey.toBase58(),
        account: {
          ...p.account,
          // Convert BN to strings for JSON serialization
          propertyId: p.account.propertyId.toString(),
          totalShares: p.account.totalShares.toString(),
          sharePrice: p.account.sharePrice.toString(),
          sharesSold: p.account.sharesSold.toString(),
          saleStart: p.account.saleStart.toString(),
          saleEnd: p.account.saleEnd.toString(),
          totalDividendsDeposited: p.account.totalDividendsDeposited.toString(),
          totalDividendsClaimed: p.account.totalDividendsClaimed.toString(),
          proposalCount: p.account.proposalCount.toString(),
          liquidationAmount: p.account.liquidationAmount.toString(),
          liquidationClaimed: p.account.liquidationClaimed.toString(),
          isLiquidated: p.account.isLiquidated,
          factory: p.account.factory.toBase58(),
        },
      })),
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    console.log("✅ Properties cached successfully");
  } catch (err) {
    console.error("Error writing cache:", err);
  }
}

// Proposals cache functions
function reconstructProposalAccount(cachedAccount: any): Proposal {
  return {
    ...cachedAccount,
    property: new PublicKey(cachedAccount.property),
    proposalId: new BN(cachedAccount.proposalId),
    creator: new PublicKey(cachedAccount.creator),
    createdAt: new BN(cachedAccount.createdAt),
    votingEndsAt: new BN(cachedAccount.votingEndsAt),
    yesVotes: new BN(cachedAccount.yesVotes),
    noVotes: new BN(cachedAccount.noVotes),
    isActive: cachedAccount.isActive,
    isExecuted: cachedAccount.isExecuted,
    bump: cachedAccount.bump,
  };
}

function getCachedProposals(propertyPDA: PublicKey): Array<{ publicKey: PublicKey; account: Proposal }> | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = PROPOSALS_CACHE_KEY_PREFIX + propertyPDA.toBase58();
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const data: CachedProposals = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - data.timestamp > PROPOSALS_CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Reconstruct PublicKey and BN objects
    return data.proposals.map((p) => ({
      publicKey: new PublicKey(p.publicKey),
      account: reconstructProposalAccount(p.account),
    }));
  } catch (err) {
    console.error("Error reading proposals cache:", err);
    return null;
  }
}

function setCachedProposals(propertyPDA: PublicKey, proposals: Array<{ publicKey: PublicKey; account: Proposal }>) {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = PROPOSALS_CACHE_KEY_PREFIX + propertyPDA.toBase58();
    const data: CachedProposals = {
      proposals: proposals.map((p) => ({
        publicKey: p.publicKey.toBase58(),
        account: {
          ...p.account,
          property: p.account.property.toBase58(),
          proposalId: p.account.proposalId.toString(),
          creator: p.account.creator.toBase58(),
          createdAt: p.account.createdAt.toString(),
          votingEndsAt: p.account.votingEndsAt.toString(),
          yesVotes: p.account.yesVotes.toString(),
          noVotes: p.account.noVotes.toString(),
          isActive: p.account.isActive,
          isExecuted: p.account.isExecuted,
          bump: p.account.bump,
        },
      })),
      timestamp: Date.now(),
    };

    localStorage.setItem(cacheKey, JSON.stringify(data));
    console.log("✅ Proposals cached successfully for", propertyPDA.toBase58().slice(0, 8));
  } catch (err) {
    console.error("Error writing proposals cache:", err);
  }
}

// Hook for fetching all properties with cache
export function useAllProperties() {
  const { connection } = useConnection();
  const [properties, setProperties] = useState<Array<{ publicKey: PublicKey; account: Property }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchProperties = useCallback(async (skipCache = false) => {
    setLoading(true);
    setError(null);
    setFromCache(false);

    try {
      // Try to load from cache first (unless skipCache is true)
      if (!skipCache) {
        const cached = getCachedProperties();
        if (cached && cached.length > 0) {
          console.log("📦 Loading properties from cache");
          setProperties(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }
      }

      // Fetch from blockchain
      console.log("🔗 Fetching properties from blockchain...");
      const allProperties = await fetchAllProperties(connection);
      setProperties(allProperties);

      // Save to cache
      setCachedProperties(allProperties);
    } catch (err: any) {
      setError(err.message || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  }, [connection]);

  const refresh = useCallback(() => {
    console.log("🔄 Force refreshing properties from blockchain");
    fetchProperties(true); // Skip cache on manual refresh
  }, [fetchProperties]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, refresh, fromCache };
}

export function useUserShareNFTs() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [shareNFTs, setShareNFTs] = useState<Array<{ publicKey: PublicKey; account: ShareNFT }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setShareNFTs([]);
      return;
    }

    setLoading(true);
    fetchUserShareNFTs(connection, publicKey)
      .then(setShareNFTs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [connection, publicKey]);

  const refresh = useCallback(() => {
    if (!publicKey) return;

    setLoading(true);
    fetchUserShareNFTs(connection, publicKey)
      .then(setShareNFTs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [connection, publicKey]);

  return { shareNFTs, loading, error, refresh };
}

export function useFactoryAccount() {
  const { connection } = useConnection();
  const [factory, setFactory] = useState<{ publicKey: PublicKey; account: Factory } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const account = await fetchFactory(connection);
      setFactory(account);
    } catch (err: any) {
      setError(err.message || "Failed to fetch factory");
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { factory, loading, error, refresh };
}

export function usePropertyProposals(propertyPDA: PublicKey | null) {
  const { connection } = useConnection();
  const [proposals, setProposals] = useState<Array<{ publicKey: PublicKey; account: Proposal }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchProposals = useCallback(async (skipCache = false) => {
    if (!propertyPDA) {
      setProposals([]);
      return;
    }

    setLoading(true);
    setError(null);
    setFromCache(false);

    try {
      // Essayer de charger depuis le cache d'abord (sauf si skipCache = true)
      if (!skipCache) {
        const cached = getCachedProposals(propertyPDA);
        if (cached) {
          console.log("📦 Loading proposals from cache for", propertyPDA.toBase58().slice(0, 8));
          setProposals(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }
      }

      // Sinon, fetch depuis la blockchain
      console.log("🔄 Fetching proposals from blockchain for", propertyPDA.toBase58().slice(0, 8));
      const result = await fetchPropertyProposals(connection, propertyPDA);
      setProposals(result);

      // Sauvegarder dans le cache
      setCachedProposals(propertyPDA, result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch proposals");
    } finally {
      setLoading(false);
    }
  }, [connection, propertyPDA?.toBase58()]); // FIX: utilise toBase58() pour éviter la boucle

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return { proposals, loading, error, refresh: fetchProposals, fromCache };
}

// Investor data interface
export interface InvestorData {
  address: string;
  totalShares: number;
  propertiesInvested: number;
  totalDividendsClaimed: number;
  investments: Array<{
    propertyPDA: PublicKey;
    propertyName: string;
    shareNFTPDA: PublicKey;
    tokenId: number;
    dividendsClaimed: number;
    mintTime: number;
  }>;
}

// Hook to fetch and aggregate all investors data
export function useAllInvestors() {
  const { connection } = useConnection();
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all ShareNFTs and properties
      const [shareNFTs, properties] = await Promise.all([
        fetchAllShareNFTs(connection),
        fetchAllProperties(connection),
      ]);

      // Create a map of property PDA to property data
      const propertyMap = new Map(
        properties.map((p) => [p.publicKey.toBase58(), p])
      );

      // Aggregate data by investor address
      const investorMap = new Map<string, InvestorData>();

      for (const nft of shareNFTs) {
        const ownerAddress = nft.account.owner.toBase58();
        const property = propertyMap.get(nft.account.property.toBase58());

        if (!investorMap.has(ownerAddress)) {
          investorMap.set(ownerAddress, {
            address: ownerAddress,
            totalShares: 0,
            propertiesInvested: 0,
            totalDividendsClaimed: 0,
            investments: [],
          });
        }

        const investor = investorMap.get(ownerAddress)!;
        investor.totalShares += 1;
        investor.totalDividendsClaimed += nft.account.dividendsClaimed?.toNumber() || 0;
        investor.investments.push({
          propertyPDA: nft.account.property,
          propertyName: property?.account.name || "Unknown",
          shareNFTPDA: nft.publicKey,
          tokenId: nft.account.tokenId?.toNumber() || 0,
          dividendsClaimed: nft.account.dividendsClaimed?.toNumber() || 0,
          mintTime: nft.account.mintTime?.toNumber() || 0,
        });
      }

      // Count unique properties per investor
      for (const [, investor] of investorMap) {
        const uniqueProperties = new Set(
          investor.investments.map((inv) => inv.propertyPDA.toBase58())
        );
        investor.propertiesInvested = uniqueProperties.size;
      }

      // Convert to array and sort by total shares (most active first)
      const investorsArray = Array.from(investorMap.values()).sort(
        (a, b) => b.totalShares - a.totalShares
      );

      setInvestors(investorsArray);
    } catch (err: any) {
      console.error("Error fetching investors:", err);
      setError(err.message || "Failed to fetch investors");
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  return { investors, loading, error, refresh: fetchInvestors };
}
