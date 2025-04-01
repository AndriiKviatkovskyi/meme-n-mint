// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTAuction is ERC721, Ownable {
    uint256 public defaultPrice;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public instantBuyPrice;
    bool public auctionCancelled = false;
    address public highestBidder;
    uint256 public highestBid;
    bool public auctionEnded;
    uint256 public tokenId;
    
    struct Bid {
        address bidder;
        uint256 amount;
    }

    Bid[] public allBids;
    
    IERC721 public nftContract;

    event BidPlaced(address indexed bidder, uint256 amount);
    event AuctionCancelled(address indexed owner);
    event AuctionEnded(address indexed winner, uint256 amount, uint256 tokenId);
    event AuctionStarted(uint256 startTime, uint256 endTime);
    event InstantBuy(address indexed buyer, uint256 price);
    event ManualBidAccepted(address indexed bidder, uint256 amount);
    event ManualBidDeclined(address indexed bidder, uint256 amount);

    modifier onlyWhenAuctionStarted() {
        require(block.timestamp >= startTime, "Auction has not started yet");
        _;
    }

    modifier auctionNotEnded() {
        require(!auctionEnded, "Auction has ended");
        _;
    }

    modifier auctionNotCancelled() {
        require(!auctionCancelled, "Auction has been cancelled");
        _;
    }

    modifier onlyWhenAuctionEnded() {
        require(block.timestamp >= endTime, "Auction has not ended yet");
        _;
    }

    constructor(address _nftContract, uint256 _defaultPrice, uint256 _startTime, uint256 _endTime, uint256 _tokenId, uint256 _instantBuyPrice) 
        ERC721("NFTAuction", "NA") 
    {
        nftContract = IERC721(_nftContract);
        defaultPrice = _defaultPrice;
        startTime = _startTime;
        endTime = _endTime;
        tokenId = _tokenId;
        instantBuyPrice = _instantBuyPrice;
        auctionCancelled = false;
        auctionEnded = false;
    }

    function startAuction() external onlyOwner {
        require(block.timestamp >= startTime, "Start time is not reached yet");
        require(block.timestamp < endTime, "End time is in the past");
        
        nftContract.transferFrom(owner(), address(this), tokenId);
        
        emit AuctionStarted(startTime, endTime);
    }

    function cancelAuction() external onlyOwner auctionNotCancelled auctionNotEnded {
        auctionCancelled = true;
        nftContract.transferFrom(address(this), owner(), tokenId);
        emit AuctionCancelled(owner());
    }

    function placeBid() external payable auctionNotEnded auctionNotCancelled onlyWhenAuctionStarted {
        require(msg.value > 0, "Bid amount must be greater than 0");
        require(msg.value > highestBid, "Bid must be higher than the current highest bid");

        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid);
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        allBids.push(Bid(msg.sender, msg.value));

        emit BidPlaced(msg.sender, msg.value);
    }

    function buyInstantly() external payable auctionNotEnded auctionNotCancelled {
        require(instantBuyPrice > 0, "Instant buy price is not set");
        require(msg.value == instantBuyPrice, "Incorrect instant buy price");

        payable(owner()).transfer(instantBuyPrice);
        auctionEnded = true;
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        emit InstantBuy(msg.sender, instantBuyPrice);
    }

    function acceptManualBid() external onlyOwner onlyWhenAuctionEnded {
        require(!auctionCancelled, "Auction has been cancelled");
        require(highestBid < defaultPrice, "Bid is higher than or equal to default price");

        payable(owner()).transfer(highestBid);
        nftContract.transferFrom(address(this), highestBidder, tokenId);
        
        auctionEnded = true;
        emit ManualBidAccepted(highestBidder, highestBid);
        emit AuctionEnded(highestBidder, highestBid, tokenId);
    }

    function declineManualBid() external onlyOwner onlyWhenAuctionEnded {
        require(!auctionCancelled, "Auction has been cancelled");
        require(highestBid < defaultPrice, "Bid is higher than or equal to default price");

        payable(highestBidder).transfer(highestBid);

        auctionEnded = true;
        emit ManualBidDeclined(highestBidder, highestBid);
    }

    function acceptBid() external onlyOwner onlyWhenAuctionEnded {
        require(!auctionCancelled, "Auction has been cancelled");

        if (highestBid >= defaultPrice) {
            payable(owner()).transfer(highestBid);
            nftContract.transferFrom(address(this), highestBidder, tokenId);
            emit AuctionEnded(highestBidder, highestBid, tokenId);
        } else {
            revert("Bid is below the default price. Owner can cancel or accept manually.");
        }

        auctionEnded = true;
    }

    function getCurrentHighestBid() external view returns (address, uint256) {
        return (highestBidder, highestBid);
    }

    function getAllBids() external view returns (address[] memory, uint256[] memory) {
        uint256 bidCount = allBids.length;
        address[] memory bidders = new address[](bidCount);
        uint256[] memory bidAmounts = new uint256[](bidCount);

        for (uint256 i = 0; i < bidCount; i++) {
            bidders[i] = allBids[i].bidder;
            bidAmounts[i] = allBids[i].amount;
        }

        return (bidders, bidAmounts);
    }

    function getAuctionStatus() external view returns (string memory) {
        if (auctionCancelled) {
            return "Auction cancelled";
        } else if (auctionEnded) {
            return "Auction ended";
        } else {
            return "Auction ongoing";
        }
    }
}
