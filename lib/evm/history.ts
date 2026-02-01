'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import { useAllVaults } from './hooks';

export interface HistoryItem {
    hash: string;
    blockNumber: number;
    timestamp: number;
    type: 'Supply' | 'Withdraw' | 'Borrow' | 'Repay' | 'Liquidate';
    amount: string;
    amountUsd?: number;
    vaultAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    liquidator?: string; // Only for Liquidate
}

// Events signatures
const SUPPLY_EVENT = parseAbiItem('event Supply(address indexed user, uint256 amount)');
const WITHDRAW_EVENT = parseAbiItem('event Withdraw(address indexed user, uint256 amount)');
const BORROW_EVENT = parseAbiItem('event Borrow(address indexed user, uint256 amount)');
const REPAY_EVENT = parseAbiItem('event Repay(address indexed user, uint256 amount)');
const LIQUIDATE_EVENT = parseAbiItem('event Liquidate(address indexed liquidator, address indexed user, uint256 amount, uint256 penalty)');

export function useTransactionHistory(userAddress: `0x${string}` | undefined) {
    const { vaults } = useAllVaults();
    const publicClient = usePublicClient();

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!userAddress || !publicClient || vaults.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const allEvents: HistoryItem[] = [];
            const currentBlock = await publicClient.getBlockNumber();
            const fromBlock = currentBlock - BigInt(100000); // Last ~100k blocks (adjust for mainnet)

            // Iterate over all vaults user might have used
            for (const vault of vaults) {
                const vaultAddr = vault.vaultAddress;

                // Parallelize fetch for one vault
                const [supplies, withdraws, borrows, repays, liquidations] = await Promise.all([
                    publicClient.getLogs({
                        address: vaultAddr,
                        event: SUPPLY_EVENT,
                        args: { user: userAddress },
                        fromBlock,
                        toBlock: currentBlock
                    }),
                    publicClient.getLogs({
                        address: vaultAddr,
                        event: WITHDRAW_EVENT,
                        args: { user: userAddress },
                        fromBlock,
                        toBlock: currentBlock
                    }),
                    publicClient.getLogs({
                        address: vaultAddr,
                        event: BORROW_EVENT,
                        args: { user: userAddress },
                        fromBlock,
                        toBlock: currentBlock
                    }),
                    publicClient.getLogs({
                        address: vaultAddr,
                        event: REPAY_EVENT,
                        args: { user: userAddress },
                        fromBlock,
                        toBlock: currentBlock
                    }),
                    publicClient.getLogs({
                        address: vaultAddr,
                        event: LIQUIDATE_EVENT,
                        args: { user: userAddress }, // Warning: user is 2nd indexed arg
                        fromBlock,
                        toBlock: currentBlock
                    })
                ]);

                // Process logs
                const processLog = async (log: any, type: HistoryItem['type']) => {
                    const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                    const amount = type === 'Liquidate' ? log.args.amount : log.args.amount; // Same arg name

                    // Calculate USD value if price available
                    const formattedAmount = formatUnits(amount, vault.tokenDecimals);
                    const amountUsd = vault.tokenPrice ? parseFloat(formattedAmount) * vault.tokenPrice : undefined;

                    allEvents.push({
                        hash: log.transactionHash,
                        blockNumber: Number(log.blockNumber),
                        timestamp: Number(block.timestamp) * 1000,
                        type,
                        amount: formattedAmount,
                        amountUsd,
                        vaultAddress: vaultAddr,
                        tokenSymbol: vault.tokenSymbol,
                        tokenDecimals: vault.tokenDecimals,
                        liquidator: type === 'Liquidate' ? log.args.liquidator : undefined
                    });
                };

                // We push promises to array to await all block fetches
                const processingPromises: Promise<void>[] = [];

                supplies.forEach(log => processingPromises.push(processLog(log, 'Supply')));
                withdraws.forEach(log => processingPromises.push(processLog(log, 'Withdraw')));
                borrows.forEach(log => processingPromises.push(processLog(log, 'Borrow')));
                repays.forEach(log => processingPromises.push(processLog(log, 'Repay')));
                liquidations.forEach(log => processingPromises.push(processLog(log, 'Liquidate')));

                await Promise.all(processingPromises);
            }

            // Sort by timestamp desc
            allEvents.sort((a, b) => b.timestamp - a.timestamp);

            setHistory(allEvents);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            setError("Failed to load history. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [userAddress, publicClient, vaults]);

    // Fetch on mount or change
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { history, isLoading, error, refetch: fetchHistory };
}
