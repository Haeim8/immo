"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import {
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    AlertTriangle,
    ExternalLink,
    History,
    Loader2
} from "lucide-react";
import { useAccount } from "wagmi";
import { useTransactionHistory } from "@/lib/evm/history";
import { BLOCK_EXPLORER_URL, formatUsd } from "@/lib/evm/hooks";
import Link from "next/link";

export default function TransactionHistory() {
    const { address } = useAccount();
    const { history, isLoading, error, refetch } = useTransactionHistory(address);

    if (!address) return null;

    return (
        <div className="card-vault">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Transaction History</h3>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                    disabled={isLoading}
                >
                    <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="overflow-x-auto">
                {isLoading && history.length === 0 ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-destructive">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No transactions found recently.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Asset</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">Time</th>
                                <th className="px-4 py-3 text-center">Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {history.map((tx) => (
                                <tr key={tx.hash + tx.type} className="hover:bg-secondary/30 transition-colors group">
                                    <td className="px-4 py-3 font-medium">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'Supply' ? 'bg-success/10 text-success' :
                                                tx.type === 'Borrow' ? 'bg-accent/10 text-accent' :
                                                    tx.type === 'Repay' ? 'bg-primary/10 text-primary' :
                                                        tx.type === 'Liquidate' ? 'bg-destructive/10 text-destructive' :
                                                            'bg-secondary text-secondary-foreground'
                                            }`}>
                                            {tx.type === 'Supply' && <ArrowUpRight className="w-3 h-3" />}
                                            {tx.type === 'Borrow' && <ArrowDownRight className="w-3 h-3" />}
                                            {tx.type === 'Repay' && <RefreshCcw className="w-3 h-3" />}
                                            {tx.type === 'Liquidate' && <AlertTriangle className="w-3 h-3" />}
                                            {tx.type === 'Withdraw' && <ArrowDownRight className="w-3 h-3 rotate-45" />}
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{tx.tokenSymbol}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{tx.vaultAddress.slice(0, 6)}...{tx.vaultAddress.slice(-4)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="font-bold">{parseFloat(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.tokenSymbol}</div>
                                        {tx.amountUsd && (
                                            <div className="text-xs text-muted-foreground">
                                                {formatUsd(tx.amountUsd)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                                        {format(tx.timestamp, "MMM d, HH:mm")}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <a
                                            href={`${BLOCK_EXPLORER_URL}/tx/${tx.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
