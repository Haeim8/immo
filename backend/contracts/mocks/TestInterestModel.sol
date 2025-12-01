// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../CantorVaultInterestModel.sol";

/**
 * @title TestInterestModel
 * @notice Contrat de test pour CantorVaultInterestModel library
 */
contract TestInterestModel {
    using CantorVaultInterestModel for uint256;

    function calculateBorrowRate(
        uint256 baseRate,
        uint256 slope,
        uint256 utilization
    ) external pure returns (uint256) {
        return CantorVaultInterestModel.calculateBorrowRate(baseRate, slope, utilization);
    }

    function calculateUtilization(
        uint256 totalBorrowed,
        uint256 totalSupplied
    ) external pure returns (uint256) {
        return CantorVaultInterestModel.calculateUtilization(totalBorrowed, totalSupplied);
    }

    function calculateInterest(
        uint256 principal,
        uint256 rate,
        uint256 timeElapsed
    ) external pure returns (uint256) {
        return CantorVaultInterestModel.calculateInterest(principal, rate, timeElapsed);
    }

    function calculateMaxBorrow(
        uint256 supplyAmount,
        uint256 maxBorrowRatio
    ) external pure returns (uint256) {
        return CantorVaultInterestModel.calculateMaxBorrow(supplyAmount, maxBorrowRatio);
    }

    function isSolvent(
        uint256 supplyAmount,
        uint256 borrowedAmount,
        uint256 maxBorrowRatio
    ) external pure returns (bool) {
        return CantorVaultInterestModel.isSolvent(supplyAmount, borrowedAmount, maxBorrowRatio);
    }
}
