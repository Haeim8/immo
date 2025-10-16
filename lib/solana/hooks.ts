"use client";

import { useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  buyShare,
  claimDividends,
  createProperty,
  depositDividends,
  fetchProperty,
  fetchShareNFT,
  fetchUserShareNFTs,
  fetchAllProperties,
} from "./instructions";
import {
  CreatePropertyParams,
  Property,
  ShareNFT,
} from "./types";

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
        const { transaction, shareNFTPDA, tokenId } = await buyShare(
          connection,
          propertyPDA,
          publicKey
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        setLoading(false);
        return { signature, shareNFTPDA, tokenId };
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

  return {
    buyPropertyShare,
    claimShareDividends,
    createNewProperty,
    depositPropertyDividends,
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

// Hook for fetching all properties
export function useAllProperties() {
  const { connection } = useConnection();
  const [properties, setProperties] = useState<Array<{ publicKey: PublicKey; account: Property }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allProperties = await fetchAllProperties(connection);
      setProperties(allProperties);
    } catch (err: any) {
      setError(err.message || "Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, refresh: fetchProperties };
}

export function useUserShareNFTs() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [shareNFTs, setShareNFTs] = useState<PublicKey[]>([]);
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
