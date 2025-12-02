// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./CantorVault.sol";
import "./CantorFiProtocol.sol";
import "./CVT.sol";

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
        uint256 liquidationBonus;
        uint256 expectedReturn;
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
    function _buildVaultData(address vaultAddress) internal view returns (VaultData memory data) {
        CantorVault vault = CantorVault(vaultAddress);

        // Get vaultInfo (9 fields: vaultId, maxLiquidity, borrowBaseRate, borrowSlope, maxBorrowRatio, liquidationBonus, isActive, createdAt, treasury)
        {
            (
                uint256 _vaultId,
                uint256 maxLiquidity,
                uint256 borrowBaseRate,
                uint256 borrowSlope,
                uint256 maxBorrowRatio,
                uint256 liquidationBonus,
                bool isActive,
                uint256 createdAt,

            ) = vault.vaultInfo();

            data.vaultId = _vaultId;
            data.vaultAddress = vaultAddress;
            data.maxLiquidity = maxLiquidity;
            data.borrowBaseRate = borrowBaseRate;
            data.borrowSlope = borrowSlope;
            data.maxBorrowRatio = maxBorrowRatio;
            data.liquidationBonus = liquidationBonus;
            data.isActive = isActive;
            data.createdAt = createdAt;
        }

        // Get vaultState (7 fields: totalSupplied, totalBorrowed, availableLiquidity, utilizationRate, totalInterestCollected, lastInterestUpdate, totalBadDebt)
        {
            (
                uint256 totalSupplied,
                uint256 totalBorrowed,
                uint256 availableLiquidity,
                uint256 utilizationRate,
                uint256 totalInterestCollected,
                ,
                uint256 totalBadDebt
            ) = vault.vaultState();

            data.totalSupplied = totalSupplied;
            data.totalBorrowed = totalBorrowed;
            data.availableLiquidity = availableLiquidity;
            data.utilizationRate = utilizationRate;
            data.totalInterestCollected = totalInterestCollected;
            data.totalBadDebt = totalBadDebt;

            data.fundingProgress = data.maxLiquidity > 0
                ? (totalSupplied * 10000) / data.maxLiquidity
                : 0;

            // Calculate expected APY
            uint256 borrowRate = vault.calculateBorrowRate();
            data.expectedReturn = (borrowRate * utilizationRate) / 10000;
        }

        // CVT, underlying token, and pause state
        {
            data.cvtToken = address(vault.cvtToken());
            data.cvtTotalSupply = CVT(data.cvtToken).totalSupply();
            data.isPaused = vault.paused();
            data.underlyingToken = address(vault.token());
        }

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
        CantorVault vault = CantorVault(vaultAddress);

        // Position (11 fields): amount, cvtBalance, lockConfig, isLocked, lockEndDate,
        // interestClaimed, interestPending, borrowedAmount, borrowInterestAccumulated, lastInterestUpdate, interestIndexSnapshot
        (
            uint256 amount,
            uint256 cvtBalance,
            ,
            bool isLocked,
            uint256 lockEndDate,
            uint256 interestClaimed,
            uint256 interestPending,
            uint256 borrowedAmount,
            uint256 borrowInterestAccumulated,
            ,

        ) = vault.positions(user);

        (uint256 totalSupplied, , , , , , ) = vault.vaultState();

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

            (uint256 amount, , , , , , , , , , ) = vault.positions(user);
            if (amount > 0) {
                activePositions++;
            }
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

            (
                uint256 amount,
                uint256 cvtBalance,
                ,
                bool isLocked,
                uint256 lockEndDate,
                uint256 interestClaimed,
                uint256 interestPending,
                uint256 borrowedAmount,
                uint256 borrowInterestAccumulated,
                ,

            ) = vault.positions(user);

            if (amount > 0) {
                (uint256 totalSupplied, , , , , , ) = vault.vaultState();

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
            CantorVault vault = CantorVault(vaultAddress);

            // VaultInfo (9 fields)
            (, , , , , , bool isActive, , ) = vault.vaultInfo();

            // VaultState (7 fields)
            (
                uint256 vaultTotalSupplied,
                uint256 vaultTotalBorrowed,
                ,
                uint256 vaultUtilization,
                uint256 vaultInterestCollected,
                ,

            ) = vault.vaultState();

            totalSupplied += vaultTotalSupplied;
            totalBorrowed += vaultTotalBorrowed;
            totalInterestCollected += vaultInterestCollected;

            if (isActive) {
                activeVaults++;
            }

            // Weighted average APY (based on variable utilization)
            // Fixed precision: multiply before divide to prevent precision loss
            if (vaultTotalSupplied > 0) {
                uint256 vaultBorrowRate = vault.calculateBorrowRate();
                // Multiply all factors first, then divide once at the end
                // vaultAPY = (borrowRate * utilization * supply) / 10000
                // We accumulate (borrowRate * utilization * supply) and divide later
                totalWeightedSupply += vaultTotalSupplied;
                totalAPY += (vaultBorrowRate * vaultUtilization * vaultTotalSupplied) / 10000;
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
        CantorVault vault = CantorVault(vaultAddress);

        // VaultState (7 fields)
        (uint256 totalSupplied, , , uint256 utilizationRate, , , ) = vault.vaultState();

        uint256 borrowRate = vault.calculateBorrowRate();

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
        CantorVault vault = CantorVault(vaultAddress);

        // Position (11 fields)
        (
            uint256 supplyAmount,
            ,
            CantorVault.LockConfig memory lockConfig,
            bool isLocked,
            uint256 lockEndDate,
            ,
            ,
            uint256 borrowedAmount,
            ,
            ,

        ) = vault.positions(user);

        // Check balance
        if (supplyAmount < amount) {
            return (false, 0, "Insufficient balance");
        }

        // Check lock
        if (isLocked && block.timestamp < lockEndDate) {
            if (!lockConfig.canWithdrawEarly) {
                return (false, 0, "Position locked");
            }
            penalty = (amount * lockConfig.earlyWithdrawalFee) / 10000;
        }

        // Check solvency if borrowed
        if (borrowedAmount > 0) {
            // VaultInfo (9 fields): maxBorrowRatio is at position 4
            (, , , , uint256 maxBorrowRatio, , , , ) = vault.vaultInfo();

            uint256 remainingSupply = supplyAmount - amount;
            uint256 maxBorrow = (remainingSupply * maxBorrowRatio) / 10000;

            if (borrowedAmount > maxBorrow) {
                return (false, penalty, "Would make position insolvent");
            }
        }

        // Check liquidity (7 fields)
        (, , uint256 availableLiquidity, , , , ) = vault.vaultState();
        uint256 netAmount = penalty > 0 ? amount - penalty : amount;

        if (availableLiquidity < netAmount) {
            return (false, penalty, "Insufficient vault liquidity");
        }

        return (true, penalty, "");
    }
}
