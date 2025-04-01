// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./NFTAuction.sol";

contract NFTAuctionFactory {
    using Counters for Counters.Counter;

    mapping(uint256 => NFTAuction) public auctions;

    event AuctionCreated(uint256 auctionId, address auctionAddress);

    event AuctionDeleted(uint256 auctionId);

    Counters.Counter private auctionCounter;

    function createAuction(
        address _nftContract,
        uint256 _defaultPrice,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokenId,
        uint256 _instantBuyPrice
    ) external returns (uint256) {

        NFTAuction newAuction = new NFTAuction(
            _nftContract,
            _defaultPrice,
            _startTime,
            _endTime,
            _tokenId,
            _instantBuyPrice
        );

        uint256 auctionId = auctionCounter.current();
        auctionCounter.increment();

        auctions[auctionId] = newAuction;

        newAuction.startAuction();

        emit AuctionCreated(auctionId, address(newAuction));

        return auctionId;
    }

    function deleteAuction(uint256 auctionId) external {
        require(address(auctions[auctionId]) != address(0), "Auction does not exist");

        NFTAuction auction = auctions[auctionId];

        require(auction.owner() == msg.sender, "You are not the owner of this auction");

        auction.cancelAuction();

        delete auctions[auctionId];

        emit AuctionDeleted(auctionId);
    }

    function getAuctionInfo(uint256 auctionId) external view returns (
        address owner,
        uint256 defaultPrice,
        uint256 startTime,
        uint256 endTime,
        uint256 tokenId,
        uint256 instantBuyPrice,
        address highestBidder,
        uint256 highestBid
    ) {

        require(address(auctions[auctionId]) != address(0), "Auction does not exist");

        NFTAuction auction = auctions[auctionId];

        return (
            auction.owner(),
            auction.defaultPrice(),
            auction.startTime(),
            auction.endTime(),
            auction.tokenId(),
            auction.instantBuyPrice(),
            auction.highestBidder(),
            auction.highestBid()
        );
    }


    function getAuctionCount() external view returns (uint256) {
        return auctionCounter.current();
    }

}
