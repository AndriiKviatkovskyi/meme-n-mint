// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

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

    event TokenMinted(uint256 indexed tokenId, string tokenURI, address marketplaceAddress, address minter);

    constructor(address _marketplaceAddress) ERC721("NFT", "MEME") {
        marketplaceAddress = _marketplaceAddress;
    }

    function mintToken(string memory nftURI) external returns (uint256) {

        _tokenIdCounter.increment();
        uint256 NftId = _tokenIdCounter.current();
        _mint(msg.sender, NftId);
        _setTokenURI(NftId, nftURI);

        setApprovalForAll(marketplaceAddress, true);
        _creators[NftId] = msg.sender;

        emit TokenMinted(NftId, nftURI, marketplaceAddress, msg.sender);

        return NftId;
    }
}