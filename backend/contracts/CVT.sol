// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CVT (Cantor Vault Token)
 * @notice Share token for a specific vault
 * @dev Each vault has its own CVT token (e.g., cvVault_nice, cvVault_ferrari)
 *      Only the vault (owner) can mint/burn
 */
contract CVT is ERC20, Ownable {
    // ============== ERRORS ==============

    error InvalidAddress();
    error InvalidAmount();

    // ============== CONSTRUCTOR ==============

    /**
     * @param name_ Token name (e.g., "Cantor Vault Token - Villa Nice")
     * @param symbol_ Token symbol (e.g., "cvVault_nice")
     * @param vault_ Vault address (becomes owner and can mint/burn)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address vault_
    ) ERC20(name_, symbol_) Ownable(vault_) {
        if (vault_ == address(0)) revert InvalidAddress();
    }

    // ============== MINTING / BURNING ==============

    /**
     * @notice Mint tokens (called by vault on supply)
     * @param to Address to receive the tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _mint(to, amount);
    }

    /**
     * @notice Burn tokens (called by vault on withdraw)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _burn(from, amount);
    }
}
