// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./CantorVault.sol";
import "./CantorFiProtocol.sol";
import "./CVT.sol";

// V9: Explicit Interfaces for Robust Backward Compatibility
interface INewVault {
    function vaultInfo() external view returns (
        uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address
    ); // 10 params
    function vaultState() external view returns (
        uint256, uint256, uint256, uint256, uint256, uint256, uint256
    );
    function cvtToken() external view returns (CVT);
    function paused() external view returns (bool);
    function token() external view returns (IERC20);
    function calculateBorrowRate() external view returns (uint256);
    // Positions
    function positions(address) external view returns (
        uint256, uint256, bool, bool, uint256, uint256, uint256, uint256, uint256, uint256, uint256
    );
}

interface IOldVault {
    function vaultInfo() external view returns (
        uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address
    ); // 9 params (Missing liquidationThreshold)
}

/**
 * @title CantorVaultReader
 * @notice Data aggregator for frontend - read-only
 * @dev Provides all data needed to display vaults, portfolios, and stats
 */
contract CantorVaultReader {

    CantorFiProtocol public protocol;

    constructor(address _protocol) {
        protocol = CantorFiProtocol(_protocol);
    }

    // ============== STRUCTS ==============

    struct VaultData {
        uint256 vaultId;
        address vaultAddress;
        uint256 maxLiquidity;
        uint256 borrowBaseRate;
        uint256 borrowSlope;
        uint256 maxBorrowRatio;
        uint256 liquidationThreshold;
        uint256 liquidationBonus;
        uint256 expectedReturn;      // Supply APY (borrowRate * utilization)
        uint256 currentBorrowRate;   // Current borrow APY (calculated from model)
        bool isActive;
        uint256 createdAt;
        // State
        uint256 totalSupplied;
        uint256 totalBorrowed;
        uint256 availableLiquidity;
        uint256 utilizationRate;
        uint256 fundingProgress;
        uint256 totalInterestCollected;
        uint256 totalBadDebt;
        // CVT
        address cvtToken;
        uint256 cvtTotalSupply;
        bool isPaused;
        // Underlying token
        address underlyingToken;
    }

    struct UserPositionData {
        uint256 vaultId;
        address vaultAddress;
        uint256 supplyAmount;
        uint256 cvtBalance;
        bool isLocked;
        uint256 lockEndDate;
        uint256 interestPending;
        uint256 interestClaimed;
        uint256 borrowedAmount;
        uint256 borrowInterestAccumulated;
        uint256 sharePercentage;
    }

    struct PortfolioSummary {
        uint256 totalInvested; // Total USDC supplied
        uint256 totalClaimed; // Total rewards claimed (interest + revenue + capital)
        uint256 totalPending; // Total rewards pending
        uint256 totalBorrowed;
        uint256 netValue; // totalInvested + totalPending - totalBorrowed
        uint256 vaultCount; // Number of vaults user is in
    }

    struct GlobalStats {
        uint256 totalVaults;
        uint256 totalSupplied; // Total TVL across all vaults
        uint256 totalBorrowed;
        uint256 totalRevenuesDistributed;
        uint256 totalCapitalRepaid;
        uint256 activeVaults; // Vaults that are still active
        uint256 averageAPY; // Weighted average
    }

    // ============== VIEW FUNCTIONS ==============

    /**
     * @notice Get all data for a vault
     * @param vaultId ID of the vault
     * @return VaultData struct with all vault information
     */
    function getVaultData(uint256 vaultId) external view returns (VaultData memory) {
        address vaultAddress = protocol.getVaultAddress(vaultId);
        return _buildVaultData(vaultAddress);
    }



    /**
     * @dev Internal function to build VaultData - split to avoid stack too deep
     */
    /**
     * @dev Internal function to build VaultData - split to avoid stack too deep
     */

    function _buildVaultData(address vaultAddress) internal view returns (VaultData memory data) {
        data.vaultId = 0;
        data.vaultAddress = vaultAddress;

        // Use low-level staticcall to detect return data length and decode accordingly.
        // try/catch does NOT catch ABI decode failures when return data is shorter than expected.
        (bool success, bytes memory retdata) = vaultAddress.staticcall(
            abi.encodeWithSignature("vaultInfo()")
        );

        if (success && retdata.length >= 288) {
            if (retdata.length >= 320) {
                // NEW format (10 params): vaultId, maxLiquidity, borrowBaseRate, borrowSlope,
                // maxBorrowRatio, liquidationBonus, liquidationThreshold, isActive, createdAt, treasury
                (
                    uint256 _vaultId,
                    uint256 maxLiquidity,
                    uint256 borrowBaseRate,
                    uint256 borrowSlope,
                    uint256 maxBorrowRatio,
                    uint256 liquidationBonus,
                    uint256 liquidationThreshold,
                    bool isActive,
                    uint256 createdAt,
                ) = abi.decode(retdata, (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address));
                data.vaultId = _vaultId;
                data.maxLiquidity = maxLiquidity;
                data.borrowBaseRate = borrowBaseRate;
                data.borrowSlope = borrowSlope;
                data.maxBorrowRatio = maxBorrowRatio;
                data.liquidationThreshold = liquidationThreshold;
                data.liquidationBonus = liquidationBonus;
                data.isActive = isActive;
                data.createdAt = createdAt;
            } else {
                // OLD format (9 params): no liquidationThreshold
                (
                    uint256 _vaultId,
                    uint256 maxLiquidity,
                    uint256 borrowBaseRate,
                    uint256 borrowSlope,
                    uint256 maxBorrowRatio,
                    uint256 liquidationBonus,
                    bool isActive,
                    uint256 createdAt,
                ) = abi.decode(retdata, (uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address));
                data.vaultId = _vaultId;
                data.maxLiquidity = maxLiquidity;
                data.borrowBaseRate = borrowBaseRate;
                data.borrowSlope = borrowSlope;
                data.maxBorrowRatio = maxBorrowRatio;
                data.liquidationThreshold = 8000; // Legacy default
                data.liquidationBonus = liquidationBonus;
                data.isActive = isActive;
                data.createdAt = createdAt;
            }
        } else {
            // If call failed completely
            data.vaultId = 999;
            data.liquidationThreshold = 8000;
            data.isActive = true;
        }
        
        // 3. Vault State - Try Standard
        try INewVault(vaultAddress).vaultState() returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 availableLiquidity,
            uint256 utilizationRate,
            uint256 totalInterestCollected,
            uint256 lastInterestUpdate,
            uint256 totalBadDebt
        ) {
            data.totalSupplied = totalSupplied;
            data.totalBorrowed = totalBorrowed;
            data.availableLiquidity = availableLiquidity;
            data.utilizationRate = utilizationRate;
            data.totalInterestCollected = totalInterestCollected;
            data.totalBadDebt = totalBadDebt;

            data.fundingProgress = data.maxLiquidity > 0
                ? (totalSupplied * 10000) / data.maxLiquidity
                : 0;

             try INewVault(vaultAddress).calculateBorrowRate() returns (uint256 borrowRate) {
                data.currentBorrowRate = borrowRate;
                data.expectedReturn = (borrowRate * utilizationRate) / 10000;
            } catch {
                data.currentBorrowRate = 500; // Mock if fails
            }

        } catch {
            // Mock state if failed
            data.totalSupplied = 0;
            data.totalBorrowed = 0;
            data.currentBorrowRate = 0;
        }

        // 4. Token & Paused
        try INewVault(vaultAddress).paused() returns (bool p) {
            data.isPaused = p;
        } catch { data.isPaused = false; }

        try INewVault(vaultAddress).token() returns (IERC20 t) {
            data.underlyingToken = address(t);
        } catch {}

        try INewVault(vaultAddress).cvtToken() returns (CVT t) {
            data.cvtToken = address(t);
            try t.totalSupply() returns (uint256 s) {
                data.cvtTotalSupply = s;
            } catch {}
        } catch {}

        return data;
    }

    /**
     * @notice Get data for multiple vaults
     * @param offset Starting index
     * @param limit Number of vaults to retrieve
     * @return Array of VaultData structs
     */
    function getVaults(uint256 offset, uint256 limit)
        external
        view
        returns (VaultData[] memory)
    {
        uint256 totalVaults = protocol.vaultCount();

        if (offset >= totalVaults) {
            return new VaultData[](0);
        }

        uint256 end = offset + limit;
        if (end > totalVaults) {
            end = totalVaults;
        }

        uint256 length = end - offset;
        VaultData[] memory vaults = new VaultData[](length);

        for (uint256 i = 0; i < length; i++) {
            vaults[i] = this.getVaultData(offset + i);
        }

        return vaults;
    }

    /**
     * @notice Get a user's position in a vault
     * @param vaultId ID of the vault
     * @param user User address
     * @return UserPositionData struct with position information
     */
    function getUserPosition(uint256 vaultId, address user)
        external
        view
        returns (UserPositionData memory)
    {
        address vaultAddress = protocol.getVaultAddress(vaultId);
        CantorVault vault = CantorVault(vaultAddress); // Use type for struct decoding

        uint256 amount;
        uint256 cvtBalance;
        bool isLocked;
        uint256 lockEndDate;
        uint256 interestClaimed;
        uint256 interestPending;
        uint256 borrowedAmount;
        uint256 borrowInterestAccumulated;

        // Try reading position
        try vault.positions(user) returns (
            uint256 _amount,
            uint256 _cvtBalance,
            CantorVault.LockConfig memory,
            bool _isLocked,
            uint256 _lockEndDate,
            uint256 _interestClaimed,
            uint256 _interestPending,
            uint256 _borrowedAmount,
            uint256 _borrowInterestAccumulated,
            uint256,
            uint256
        ) {
            amount = _amount;
            cvtBalance = _cvtBalance;
            isLocked = _isLocked;
            lockEndDate = _lockEndDate;
            interestClaimed = _interestClaimed;
            interestPending = _interestPending;
            borrowedAmount = _borrowedAmount;
            borrowInterestAccumulated = _borrowInterestAccumulated;
        } catch {
            // If fails, return empty position (or could try OLD abi if positions diff)
            return UserPositionData({
                vaultId: vaultId,
                vaultAddress: vaultAddress,
                supplyAmount: 0,
                cvtBalance: 0,
                isLocked: false,
                lockEndDate: 0,
                interestPending: 0,
                interestClaimed: 0,
                borrowedAmount: 0,
                borrowInterestAccumulated: 0,
                sharePercentage: 0
            });
        }

        uint256 totalSupplied;
        try INewVault(vaultAddress).vaultState() returns (uint256 ts, uint256, uint256, uint256, uint256, uint256, uint256) {
           totalSupplied = ts;
        } catch {}

        uint256 sharePercentage = totalSupplied > 0
            ? (amount * 10000) / totalSupplied
            : 0;

        return UserPositionData({
            vaultId: vaultId,
            vaultAddress: vaultAddress,
            supplyAmount: amount,
            cvtBalance: cvtBalance,
            isLocked: isLocked,
            lockEndDate: lockEndDate,
            interestPending: interestPending,
            interestClaimed: interestClaimed,
            borrowedAmount: borrowedAmount,
            borrowInterestAccumulated: borrowInterestAccumulated,
            sharePercentage: sharePercentage
        });
    }

    /**
     * @notice Get all positions for a user
     * @param user User address
     * @return positions Array of UserPositionData
     * @return summary PortfolioSummary with totals
     */
    function getUserPortfolio(address user)
        external
        view
        returns (UserPositionData[] memory, PortfolioSummary memory)
    {
        uint256 totalVaults = protocol.vaultCount();

        // First pass: count non-zero positions
        uint256 activePositions = 0;
        for (uint256 i = 0; i < totalVaults; i++) {
            address vaultAddress = protocol.getVaultAddress(i);
            CantorVault vault = CantorVault(vaultAddress);
            
            try vault.positions(user) returns (uint256 amount, uint256, CantorVault.LockConfig memory, bool, uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
                if (amount > 0) {
                    activePositions++;
                }
            } catch {}
        }

        // Second pass: populate data
        UserPositionData[] memory positions = new UserPositionData[](activePositions);
        uint256 index = 0;

        uint256 totalInvested = 0;
        uint256 totalClaimed = 0;
        uint256 totalPending = 0;
        uint256 totalBorrowed = 0;

        for (uint256 i = 0; i < totalVaults; i++) {
            address vaultAddress = protocol.getVaultAddress(i);
            CantorVault vault = CantorVault(vaultAddress);

            uint256 amount;
            uint256 cvtBalance;
            bool isLocked;
            uint256 lockEndDate;
            uint256 interestClaimed;
            uint256 interestPending;
            uint256 borrowedAmount;
            uint256 borrowInterestAccumulated;
            
            // Try to read position
            try vault.positions(user) returns (
                uint256 _amount,
                uint256 _cvtBalance,
                CantorVault.LockConfig memory,
                bool _isLocked,
                uint256 _lockEndDate,
                uint256 _interestClaimed,
                uint256 _interestPending,
                uint256 _borrowedAmount,
                uint256 _borrowInterestAccumulated,
                uint256,
                uint256
            ) {
                amount = _amount;
                cvtBalance = _cvtBalance;
                isLocked = _isLocked;
                lockEndDate = _lockEndDate;
                interestClaimed = _interestClaimed;
                interestPending = _interestPending;
                borrowedAmount = _borrowedAmount;
                borrowInterestAccumulated = _borrowInterestAccumulated;
            } catch {
                continue; // Skip broken vaults
            }

            if (amount > 0) {
                uint256 totalSupplied;
                try INewVault(vaultAddress).vaultState() returns (uint256 ts, uint256, uint256, uint256, uint256, uint256, uint256) {
                   totalSupplied = ts;
                } catch {
                   totalSupplied = 0;
                }

                uint256 sharePercentage = totalSupplied > 0
                    ? (amount * 10000) / totalSupplied
                    : 0;

                positions[index] = UserPositionData({
                    vaultId: i,
                    vaultAddress: vaultAddress,
                    supplyAmount: amount,
                    cvtBalance: cvtBalance,
                    isLocked: isLocked,
                    lockEndDate: lockEndDate,
                    interestPending: interestPending,
                    interestClaimed: interestClaimed,
                    borrowedAmount: borrowedAmount,
                    borrowInterestAccumulated: borrowInterestAccumulated,
                    sharePercentage: sharePercentage
                });

                totalInvested += amount;
                totalClaimed += interestClaimed;
                totalPending += interestPending;
                totalBorrowed += borrowedAmount;

                index++;
            }
        }

        uint256 netValue = totalInvested + totalPending;
        if (netValue > totalBorrowed) {
            netValue -= totalBorrowed;
        } else {
            netValue = 0;
        }

        PortfolioSummary memory summary = PortfolioSummary({
            totalInvested: totalInvested,
            totalClaimed: totalClaimed,
            totalPending: totalPending,
            totalBorrowed: totalBorrowed,
            netValue: netValue,
            vaultCount: activePositions
        });

        return (positions, summary);
    }

    /**
     * @notice Get global protocol statistics
     * @return GlobalStats struct with protocol-wide data
     */
    function getGlobalStats() external view returns (GlobalStats memory) {
        uint256 totalVaults = protocol.vaultCount();

        uint256 totalSupplied = 0;
        uint256 totalBorrowed = 0;
        uint256 totalInterestCollected = 0;
        uint256 activeVaults = 0;
        uint256 totalAPY = 0;
        uint256 totalWeightedSupply = 0;

        for (uint256 i = 0; i < totalVaults; i++) {
            address vaultAddress = protocol.getVaultAddress(i);
            // V9: Hybrid check
            bool isActive;
            uint256 vaultTotalSupplied;
            uint256 vaultTotalBorrowed;
            uint256 vaultUtilization;
            uint256 vaultInterestCollected;

            // 1. Check Active Status safely via low-level call
            {
                (bool ok, bytes memory ret) = vaultAddress.staticcall(
                    abi.encodeWithSignature("vaultInfo()")
                );
                if (ok && ret.length >= 320) {
                    // NEW format (10 params) - isActive is at index 7
                    (, , , , , , , isActive, , ) = abi.decode(ret, (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address));
                } else if (ok && ret.length >= 288) {
                    // OLD format (9 params) - isActive is at index 6
                    (, , , , , , isActive, , ) = abi.decode(ret, (uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address));
                } else {
                    isActive = false;
                }
            }

            // 2. Constants State (Same for both)
            try INewVault(vaultAddress).vaultState() returns (
                uint256 ms, uint256 mb, uint256, uint256 mu, uint256 mi, uint256, uint256
            ) {
                vaultTotalSupplied = ms;
                vaultTotalBorrowed = mb;
                vaultUtilization = mu;
                vaultInterestCollected = mi;
            } catch {}

            totalSupplied += vaultTotalSupplied;
            totalBorrowed += vaultTotalBorrowed;
            totalInterestCollected += vaultInterestCollected;

            if (isActive) {
                activeVaults++;
            }

            // Weighted average APY (based on variable utilization)
            if (vaultTotalSupplied > 0) {
                try INewVault(vaultAddress).calculateBorrowRate() returns (uint256 vaultBorrowRate) {
                     totalWeightedSupply += vaultTotalSupplied;
                     totalAPY += (vaultBorrowRate * vaultUtilization * vaultTotalSupplied) / 10000;
                } catch {}
            }
        }

        uint256 averageAPY = totalWeightedSupply > 0
            ? totalAPY / totalWeightedSupply
            : 0;

        return GlobalStats({
            totalVaults: totalVaults,
            totalSupplied: totalSupplied,
            totalBorrowed: totalBorrowed,
            totalRevenuesDistributed: totalInterestCollected,
            totalCapitalRepaid: 0,
            activeVaults: activeVaults,
            averageAPY: averageAPY
        });
    }

    /**
     * @notice Calculate current APR/APY for a vault
     * @param vaultId ID of the vault
     * @return currentAPY Current APY based on utilization
     */
    function calculateCurrentAPY(uint256 vaultId) external view returns (uint256 currentAPY) {
        address vaultAddress = protocol.getVaultAddress(vaultId);
        
        // VaultState
        uint256 totalSupplied;
        uint256 utilizationRate;
        try INewVault(vaultAddress).vaultState() returns (uint256 ts, uint256, uint256, uint256 ur, uint256, uint256, uint256) {
             totalSupplied = ts;
             utilizationRate = ur;
        } catch { return 0; }

        uint256 borrowRate;
        try INewVault(vaultAddress).calculateBorrowRate() returns (uint256 br) {
            borrowRate = br;
        } catch { return 0; }

        if (totalSupplied == 0) {
            return 0;
        }

        // Return variable APY based on utilization
        return (borrowRate * utilizationRate) / 10000;
    }

    /**
     * @notice Check if a user can withdraw from a vault
     * @param vaultId ID of the vault
     * @param user User address
     * @param amount Amount to withdraw
     * @return canWithdraw_ True if withdrawal is possible
     * @return penalty Penalty amount if early withdrawal
     * @return reason Reason if withdrawal is not possible
     */
    function canWithdraw(uint256 vaultId, address user, uint256 amount)
        external
        view
        returns (bool canWithdraw_, uint256 penalty, string memory reason)
    {
        address vaultAddress = protocol.getVaultAddress(vaultId);
        CantorVault vault = CantorVault(vaultAddress); // For types only if possible

        // Position (11 fields) - WARNING: This relies on implicit ABI. 
        // Ideally we should use INewVault.positions but struct decoding is tricky without import.
        // We wrap in try/catch to avoid crash.
        uint256 supplyAmount;
        bool isLocked;
        uint256 lockEndDate;
        bool canWithdrawEarly;
        uint256 earlyWithdrawalFee;
        uint256 borrowedAmount;
        
        try vault.positions(user) returns (
            uint256 _supply,
            uint256,
            CantorVault.LockConfig memory _lockConfig,
            bool _isLocked,
            uint256 _lockEndDate,
            uint256,
            uint256,
            uint256 _borrowed,
            uint256,
            uint256,
            uint256
        ) {
            supplyAmount = _supply;
            isLocked = _isLocked;
            lockEndDate = _lockEndDate;
            canWithdrawEarly = _lockConfig.canWithdrawEarly;
            earlyWithdrawalFee = _lockConfig.earlyWithdrawalFee;
            borrowedAmount = _borrowed;
        } catch {
             return (false, 0, "Error reading position");
        }

        // Check balance
        if (supplyAmount < amount) {
            return (false, 0, "Insufficient balance");
        }

        // Check lock
        if (isLocked && block.timestamp < lockEndDate) {
            if (!canWithdrawEarly) {
                return (false, 0, "Position locked");
            }
            penalty = (amount * earlyWithdrawalFee) / 10000;
        }

        // Check solvency if borrowed
        if (borrowedAmount > 0) {
            uint256 maxBorrowRatio;
            {
                (bool ok, bytes memory ret) = vaultAddress.staticcall(
                    abi.encodeWithSignature("vaultInfo()")
                );
                if (ok && ret.length >= 320) {
                    (, , , , maxBorrowRatio, , , , , ) = abi.decode(ret, (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address));
                } else if (ok && ret.length >= 288) {
                    (, , , , maxBorrowRatio, , , , ) = abi.decode(ret, (uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256, address));
                } else {
                    return (false, penalty, "Error reading vault info");
                }
            }

            uint256 remainingSupply = supplyAmount - amount;
            uint256 maxBorrow = (remainingSupply * maxBorrowRatio) / 10000;

            if (borrowedAmount > maxBorrow) {
                return (false, penalty, "Would make position insolvent");
            }
        }

        // Check liquidity
        uint256 availableLiquidity;
        try INewVault(vaultAddress).vaultState() returns (uint256, uint256, uint256 al, uint256, uint256, uint256, uint256) {
           availableLiquidity = al;
        } catch {
           return (false, penalty, "Error reading liquidity");
        }

        uint256 netAmount = penalty > 0 ? amount - penalty : amount;

        if (availableLiquidity < netAmount) {
            return (false, penalty, "Insufficient vault liquidity");
        }

        return (true, penalty, "");
    }
}
