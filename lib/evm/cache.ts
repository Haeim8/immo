/**
 * Cache RPC simple pour éviter les appels coûteux
 * - Cache mémoire avec TTL
 * - Cache localStorage pour persistence
 */

'use client';

const MEMORY_TTL = 30 * 1000; // 30 secondes
const STORAGE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache mémoire
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Get from memory cache
 */
export function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > MEMORY_TTL) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set in memory cache
 */
export function setInMemory<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get from localStorage with TTL check
 */
export function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(`rpc_cache_${key}`);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    if (Date.now() - entry.timestamp > STORAGE_TTL) {
      localStorage.removeItem(`rpc_cache_${key}`);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Set in localStorage
 */
export function setInStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`rpc_cache_${key}`, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Get from cache (memory first, then storage)
 */
export function getFromCache<T>(key: string): T | null {
  // Try memory first (faster)
  const memResult = getFromMemory<T>(key);
  if (memResult !== null) return memResult;

  // Try storage
  const storageResult = getFromStorage<T>(key);
  if (storageResult !== null) {
    // Restore to memory
    setInMemory(key, storageResult);
    return storageResult;
  }

  return null;
}

/**
 * Set in both caches
 */
export function setInCache<T>(key: string, data: T): void {
  setInMemory(key, data);
  setInStorage(key, data);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  memoryCache.clear();

  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('rpc_cache_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
