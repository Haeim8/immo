// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CVT (Cantor Vault Token)
 * @notice Global share token for all CantorFi vaults
 * @dev Single CVT token shared across ALL vaults
 *      - Multiple vaults can mint/burn via MINTER_ROLE
 *      - 1 CVT = 1 share (scaled to 18 decimals)
 *      - Supply to Vault USDC → get CVT
 *      - Supply to Vault WETH → get CVT (same token)
 */
contract CVT is ERC20, AccessControl {
    // ============== ROLES ==============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidAmount();

    // ============== EVENTS ==============

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // ============== CONSTRUCTOR ==============

    /**
     * @param admin_ Admin address (receives ADMIN_ROLE)
     */
    constructor(address admin_) ERC20("Cantor Vault Token", "CVT") {
        if (admin_ == address(0)) revert InvalidAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
    }

    // ============== MINTING / BURNING ==============

    /**
     * @notice Mint tokens (called by vaults on supply)
     * @param to Address to receive the tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _mint(to, amount);
    }

    /**
     * @notice Burn tokens (called by vaults on withdraw)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _burn(from, amount);
    }

    // ============== ADMIN FUNCTIONS ==============

    /**
     * @notice Add a minter (vault)
     * @param minter Address to grant minter role
     */
    function addMinter(address minter) external onlyRole(ADMIN_ROLE) {
        if (minter == address(0)) revert InvalidAddress();
        _grantRole(MINTER_ROLE, minter);
        emit MinterAdded(minter);
    }

    /**
     * @notice Remove a minter (vault)
     * @param minter Address to revoke minter role
     */
    function removeMinter(address minter) external onlyRole(ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, minter);
        emit MinterRemoved(minter);
    }

    /**
     * @notice Check if an address is a minter
     * @param account Address to check
     * @return True if address has MINTER_ROLE
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }
}
