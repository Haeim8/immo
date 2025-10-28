// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title USCINFT
 * @notice NFT metadata generator for USCI puzzles
 * @dev Generates on-chain SVG and metadata for puzzle NFTs
 */
contract USCINFT {
    struct PlaceMetadata {
        uint256 placeId;
        string assetType;
        string name;
        string city;
        string province;
    }

    /**
     * @notice Generate tokenURI with on-chain SVG
     */
    function generateTokenURI(
        uint256 tokenId,
        PlaceMetadata memory metadata,
        address originalMinter,
        address currentOwner
    ) external pure returns (string memory) {
        // Generate SVG
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs>',
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#bg)"/>',
            '<text x="200" y="80" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">PUZZLE NFT</text>',
            '<text x="200" y="140" font-family="Arial" font-size="16" fill="white" text-anchor="middle">', metadata.name, '</text>',
            '<text x="200" y="180" font-family="Arial" font-size="14" fill="white" text-anchor="middle" opacity="0.8">', metadata.city, ', ', metadata.province, '</text>',
            '<text x="200" y="240" font-family="Arial" font-size="32" fill="white" text-anchor="middle" font-weight="bold">#', Strings.toString(tokenId), '</text>',
            '<text x="200" y="280" font-family="Arial" font-size="14" fill="white" text-anchor="middle" opacity="0.8">Place ID: ', Strings.toString(metadata.placeId), '</text>',
            '<text x="200" y="310" font-family="Arial" font-size="12" fill="white" text-anchor="middle" opacity="0.6">', metadata.assetType, '</text>',
            '</svg>'
        ));

        // Base64 encode metadata
        string memory json = string(abi.encodePacked(
            '{"name":"Puzzle #', Strings.toString(tokenId), ' - ', metadata.name, '",',
            '"description":"Interactive place puzzle for ', metadata.name, ' in ', metadata.city, '",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes":[',
            '{"trait_type":"Place","value":"', metadata.name, '"},',
            '{"trait_type":"Location","value":"', metadata.city, ', ', metadata.province, '"},',
            '{"trait_type":"Token ID","value":', Strings.toString(tokenId), '},',
            '{"trait_type":"Place ID","value":', Strings.toString(metadata.placeId), '},',
            '{"trait_type":"Asset Type","value":"', metadata.assetType, '"},',
            '{"trait_type":"Original Minter","value":"', originalMinter == currentOwner ? "true" : "false", '"}',
            ']}'
        ));

        return string(abi.encodePacked('data:application/json;base64,', Base64.encode(bytes(json))));
    }
}
