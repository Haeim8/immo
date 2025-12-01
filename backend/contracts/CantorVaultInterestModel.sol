// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title CantorVaultInterestModel
 * @notice Library for calculating variable interest rates on borrows (Aave-style)
 * @dev Two-slope model with optimal utilization point (kink)
 *      - Below optimal: gentle slope (slope1)
 *      - Above optimal: steep slope (slope2) to protect liquidity
 */
library CantorVaultInterestModel {
    // ============== CONSTANTS ==============

    uint256 private constant BASIS_POINTS = 10000; // 100% = 10000
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    // ============== AAVE-STYLE CONSTANTS ==============

    /// @notice Optimal utilization rate (80% = 8000 basis points)
    uint256 public constant OPTIMAL_UTILIZATION = 8000;

    /// @notice Slope after optimal utilization (emergency slope) - 300% = 30000 basis points
    /// This makes borrowing VERY expensive when utilization > 80%
    uint256 public constant SLOPE2 = 30000;

    /// @notice Maximum utilization allowed (95% = 9500 basis points)
    /// Keeps 5% liquidity buffer for withdrawals
    uint256 public constant MAX_UTILIZATION = 9500;

    // ============== ERRORS ==============

    error InvalidUtilization();
    error InvalidRate();
    error UtilizationTooHigh();

    // ============== FUNCTIONS ==============

    /**
     * @notice Calculate variable borrow rate (Aave-style two-slope model)
     * @param baseRate Base rate (in basis points, e.g., 500 = 5%)
     * @param slope Rate slope below optimal (in basis points, e.g., 1000 = 10%)
     * @param utilization Current utilization rate (in basis points)
     * @return borrowRate Annual borrow rate (in basis points)
     *
     * @dev Formula:
     *      If utilization <= OPTIMAL (80%):
     *          rate = baseRate + (slope1 × utilization / OPTIMAL)
     *      If utilization > OPTIMAL:
     *          rate = baseRate + slope1 + (slope2 × (utilization - OPTIMAL) / (100% - OPTIMAL))
     *
     * @dev Example with baseRate=5%, slope1=10%, utilization=90%:
     *      - At 80%: 5% + 10% = 15%
     *      - At 90%: 15% + (300% × 10% / 20%) = 15% + 150% = 165% APY!
     *      This protects liquidity by making high utilization very expensive
     */
    function calculateBorrowRate(
        uint256 baseRate,
        uint256 slope,
        uint256 utilization
    ) internal pure returns (uint256) {
        // Validation
        if (utilization > BASIS_POINTS) revert InvalidUtilization();
        if (baseRate > BASIS_POINTS) revert InvalidRate();
        if (slope > BASIS_POINTS * 10) revert InvalidRate();

        uint256 borrowRate;

        if (utilization <= OPTIMAL_UTILIZATION) {
            // Below optimal: gentle slope
            // rate = baseRate + (slope × utilization / OPTIMAL)
            uint256 variableComponent = (slope * utilization) / OPTIMAL_UTILIZATION;
            borrowRate = baseRate + variableComponent;
        } else {
            // Above optimal: steep emergency slope
            // First add the rate at optimal point
            uint256 rateAtOptimal = baseRate + slope;

            // Then add steep slope for excess utilization
            uint256 excessUtilization = utilization - OPTIMAL_UTILIZATION;
            uint256 maxExcess = BASIS_POINTS - OPTIMAL_UTILIZATION; // 20%

            // Emergency rate = slope2 × excessUtilization / maxExcess
            uint256 emergencyRate = (SLOPE2 * excessUtilization) / maxExcess;

            borrowRate = rateAtOptimal + emergencyRate;
        }

        return borrowRate;
    }

    /**
     * @notice Check if utilization is within safe limits
     * @param utilization Current utilization rate
     * @return isSafe True if utilization is below MAX_UTILIZATION
     */
    function isUtilizationSafe(uint256 utilization) internal pure returns (bool) {
        return utilization <= MAX_UTILIZATION;
    }

    /**
     * @notice Get the rate at optimal utilization
     * @param baseRate Base rate
     * @param slope Slope below optimal
     * @return optimalRate Rate at optimal utilization point
     */
    function getRateAtOptimal(uint256 baseRate, uint256 slope) internal pure returns (uint256) {
        return baseRate + slope;
    }

    /**
     * @notice Calculate utilization rate
     * @param totalBorrowed Total amount borrowed
     * @param totalSupplied Total amount supplied
     * @return utilization Utilization rate (in basis points)
     *
     * @dev Formula: utilization = (totalBorrowed x 10000) / totalSupplied
     * @dev Returns 0 if totalSupplied = 0
     */
    function calculateUtilization(
        uint256 totalBorrowed,
        uint256 totalSupplied
    ) internal pure returns (uint256) {
        if (totalSupplied == 0) {
            return 0;
        }

        return (totalBorrowed * BASIS_POINTS) / totalSupplied;
    }

    /**
     * @notice Calculate accumulated interest for a period
     * @param principal Principal amount
     * @param rate Annual rate (in basis points)
     * @param timeElapsed Time elapsed (in seconds)
     * @return interest Accumulated interest
     *
     * @dev Formula: interest = principal x rate x timeElapsed / (BASIS_POINTS x SECONDS_PER_YEAR)
     */
    function calculateInterest(
        uint256 principal,
        uint256 rate,
        uint256 timeElapsed
    ) internal pure returns (uint256) {
        if (principal == 0 || rate == 0 || timeElapsed == 0) {
            return 0;
        }

        // interest = principal x rate x timeElapsed / (BASIS_POINTS x SECONDS_PER_YEAR)
        uint256 interest = (principal * rate * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);

        return interest;
    }

    /**
     * @notice Calculate effective daily APY
     * @param annualRate Annual rate (in basis points)
     * @return dailyRate Daily rate (in basis points)
     *
     * @dev Simple formula: dailyRate = annualRate / 365
     */
    function calculateDailyRate(uint256 annualRate) internal pure returns (uint256) {
        return annualRate / 365;
    }

    /**
     * @notice Calculate maximum borrowable amount
     * @param supplyAmount Amount supplied
     * @param maxBorrowRatio Maximum ratio (in basis points, e.g., 7500 = 75%)
     * @return maxBorrow Maximum borrowable amount
     */
    function calculateMaxBorrow(
        uint256 supplyAmount,
        uint256 maxBorrowRatio
    ) internal pure returns (uint256) {
        if (maxBorrowRatio > BASIS_POINTS) revert InvalidRate();

        return (supplyAmount * maxBorrowRatio) / BASIS_POINTS;
    }

    /**
     * @notice Check if a position is solvent
     * @param supplyAmount Amount supplied
     * @param borrowedAmount Amount borrowed
     * @param maxBorrowRatio Maximum ratio (in basis points)
     * @return isSolvent True if solvent, false otherwise
     */
    function isSolvent(
        uint256 supplyAmount,
        uint256 borrowedAmount,
        uint256 maxBorrowRatio
    ) internal pure returns (bool) {
        uint256 maxBorrow = calculateMaxBorrow(supplyAmount, maxBorrowRatio);
        return borrowedAmount <= maxBorrow;
    }
}
