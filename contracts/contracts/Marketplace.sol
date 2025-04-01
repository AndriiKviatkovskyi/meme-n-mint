// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Marketplace {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _listingIdCounter;

    struct Listing {
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address seller;
        bool isSold;
    }

    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => uint256) private _tokenListingIds;

    event ItemListed(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, uint256 price, address seller);
    event ItemBought(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, uint256 price, address buyer, address seller);
    event ItemCancelled(uint256 indexed listingId, address indexed nftContract, uint256 indexed tokenId, address seller);

    function listItem(address nftContract, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "You are not the owner of this NFT");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Marketplace must be approved to transfer NFT");
        require(_tokenListingIds[tokenId] == 0, "Item is already listed");
        _listingIdCounter.increment();
        uint256 listingId = _listingIdCounter.current();
        _listings[listingId] = Listing({nftContract: nftContract, tokenId: tokenId, price: price, seller: msg.sender, isSold: false});
        _tokenListingIds[tokenId] = listingId;
        emit ItemListed(listingId, nftContract, tokenId, price, msg.sender);
    }

    function buyItem(address nftContract, uint256 tokenId) external payable {
        uint256 listingId = _tokenListingIds[tokenId];
        require(listingId > 0, "Item not listed");
        Listing memory listing = _listings[listingId];
        require(!listing.isSold, "Item already sold");
        require(msg.value == listing.price, "Incorrect purchase price");
        IERC721(nftContract).transferFrom(listing.seller, msg.sender, listing.tokenId);
        (bool success, ) = payable(listing.seller).call{value: msg.value}("");
        require(success, "Payment failed");
        _listings[listingId].isSold = true;
        delete _tokenListingIds[tokenId];
        emit ItemBought(listingId, nftContract, listing.tokenId, listing.price, msg.sender, listing.seller);
    }

    function cancelListing(address nftContract, uint256 tokenId) external {
        uint256 listingId = _tokenListingIds[tokenId];
        require(listingId > 0, "Item not listed");
        Listing memory listing = _listings[listingId];
        require(listing.seller == msg.sender, "You are not the seller of this item");
        require(!listing.isSold, "Item already sold");
        delete _listings[listingId];
        delete _tokenListingIds[tokenId];
        emit ItemCancelled(listingId, nftContract, tokenId, msg.sender);
    }

    function getListing(uint256 tokenId) external view returns (address nftContractAddress, uint256 tokenIdValue, uint256 price, address seller, bool isSold) {
        uint256 listingId = _tokenListingIds[tokenId];
        require(listingId > 0, "Item not listed");
        Listing memory listing = _listings[listingId];
        return (listing.nftContract, listing.tokenId, listing.price, listing.seller, listing.isSold);
    }

    function getListingId(uint256 tokenId) external view returns (uint256) {
        return _tokenListingIds[tokenId];
    }
}