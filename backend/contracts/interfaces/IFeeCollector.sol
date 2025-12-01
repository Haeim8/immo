// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IFeeCollector {
    function notifyFeeReceived(address token, uint256 amount) external;
}
