// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    address private marketplaceAddress;
    mapping(uint256 => address) private _creators;

    event TokenMinted(
        uint256 indexed tokenId,
        string tokenURI,
        address marketplaceAddress,
        address minter
    );

    /**
     * @notice Initializes the NFT contract with a marketplace address.
     * @param _marketplaceAddress The address of the marketplace contract.
     */
    constructor(address _marketplaceAddress) ERC721("Meme-n-Mint", "MEMT") {
        marketplaceAddress = _marketplaceAddress;
    }

    /**
     * @notice Mints a new NFT with a given metadata URI.
     * @param nftURI The URI pointing to the NFT metadata.
     * @return The ID of the newly minted NFT.
     */
    function mintToken(string memory nftURI) external returns (uint256) {
        _tokenIdCounter.increment();
        uint256 newNftId = _tokenIdCounter.current();

        _mint(msg.sender, newNftId);
        _setTokenURI(newNftId, nftURI);

        setApprovalForAll(marketplaceAddress, true);
        _creators[newNftId] = msg.sender;

        emit TokenMinted(newNftId, nftURI, marketplaceAddress, msg.sender);

        return newNftId;
    }

    /**
     * @notice Returns the total number of NFTs minted.
     * @return The current total supply.
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
}
