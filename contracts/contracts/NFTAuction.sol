// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Importing OpenZeppelin contracts for ERC721, address utilities, and ownership management
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTAuction
 * @dev A contract for conducting timed auctions with an instant buy option for ERC721 NFTs
 */
contract NFTAuction is ERC721, Ownable {
    uint256 public defaultPrice;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public instantBuyPrice;
    bool public auctionCancelled = false;
    bool public auctionEnded;
    uint256 public tokenId;
    address public creator;

    address public highestBidder;
    uint256 public highestBid;

    struct Bid {
        address bidder;
        uint256 amount;
    }
    Bid[] public allBids;

    IERC721 public nftContract;

    event BidPlaced(address indexed bidder, uint256 amount);
    event AuctionCancelled(address indexed owner);
    event AuctionEnded(address indexed winner, uint256 amount, uint256 tokenId);
    event AuctionWaiting(address indexed winner, uint256 amount, uint256 tokenId);
    event AuctionStarted(uint256 startTime, uint256 endTime);
    event InstantBuy(address indexed buyer, uint256 price);
    event ManualBidAccepted(address indexed bidder, uint256 amount);
    event ManualBidDeclined(address indexed bidder, uint256 amount);

    // --- Modifiers ---

    /**
     * @dev Ensures the auction has started
     */
    modifier onlyWhenAuctionStarted() {
        require(block.timestamp >= startTime, "Auction has not started yet");
        _;
    }

    /**
     * @dev Ensures the auction has not ended
     */
    modifier auctionNotEnded() {
        require(!auctionEnded, "Auction has ended");
        _;
    }

    /**
     * @dev Ensures the auction has not been cancelled
     */
    modifier auctionNotCancelled() {
        require(!auctionCancelled, "Auction has been cancelled");
        _;
    }

    /**
     * @dev Ensures the auction has ended
     */
    modifier onlyWhenAuctionEnded() {
        require(block.timestamp >= endTime, "Auction has not ended yet");
        _;
    }

    /**
     * @notice Initializes the auction contract with the NFT and auction details
     * @param _nftContract Address of the ERC721 NFT contract
     * @param _defaultPrice Initial price of the auction
     * @param _startTime Auction start time (timestamp)
     * @param _endTime Auction end time (timestamp)
     * @param _tokenId Token ID of the NFT being auctioned
     * @param _instantBuyPrice Price at which the auctioned NFT can be bought instantly
     * @param _creator Address of the creator of the auction
     */
    constructor(
        address _nftContract,
        uint256 _defaultPrice,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokenId,
        uint256 _instantBuyPrice,
        address _creator
    ) ERC721("NFTAuction", "NA") {
        nftContract = IERC721(_nftContract);
        defaultPrice = _defaultPrice;
        startTime = _startTime;
        endTime = _endTime;
        tokenId = _tokenId;
        instantBuyPrice = _instantBuyPrice;
        auctionCancelled = false;
        auctionEnded = false;
        creator = _creator;
    }

    /**
     * @notice Starts the auction by transferring the NFT from creator to contract
     * @param _creator Address of the auction creator (only they can start the auction)
     */
    function startAuction(address _creator) external {
        require(_creator == creator, "Only the auction creator can start the auction");
        require(block.timestamp >= startTime, "Start time is not reached yet");
        require(block.timestamp < endTime, "End time is in the past");

        nftContract.transferFrom(creator, address(this), tokenId);

        emit AuctionStarted(startTime, endTime);
    }

    /**
     * @notice Cancels the auction and refunds the highest bidder if any
     * @param _creator Address of the auction creator (only they can cancel the auction)
     */
    function cancelAuction(address _creator) external auctionNotCancelled auctionNotEnded {
        require(_creator == creator, "Only the auction creator can cancel the auction");

        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid); // Refund highest bidder
        }

        auctionCancelled = true;
        nftContract.transferFrom(address(this), creator, tokenId); // Return NFT to creator

        emit AuctionCancelled(creator);
    }

    /**
     * @notice Places a bid in the auction, updating the highest bid and bidder
     * @dev Refunds the previous highest bidder
     * @dev Requires the sender to pay the bid
     */
    function placeBid() external payable auctionNotEnded auctionNotCancelled onlyWhenAuctionStarted {
        require(msg.value > 0, "Bid amount must be greater than 0");
        require(msg.value > highestBid, "Bid must be higher than the current highest bid");

        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid); // Refund previous highest bidder
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        allBids.push(Bid(msg.sender, msg.value)); // Record the bid

        emit BidPlaced(msg.sender, msg.value);
    }

    /**
     * @notice Buys the NFT instantly by paying the instant buy price
     * @dev Refunds the highest bidder if applicable
     * @dev Requires the sender to pay the exact instant buy price
     */
    function buyInstantly() external payable auctionNotEnded auctionNotCancelled {
        require(instantBuyPrice > 0, "Instant buy price is not set");
        require(msg.value == instantBuyPrice, "Incorrect instant buy price");

        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid); // Refund highest bidder
        }

        payable(creator).transfer(instantBuyPrice); // Transfer payment to creator
        auctionEnded = true;

        nftContract.transferFrom(address(this), msg.sender, tokenId); // Transfer NFT to buyer

        emit InstantBuy(msg.sender, instantBuyPrice);
    }

    /**
     * @notice Finalizes the auction and transfers the NFT to the highest bidder or back to the creator if no bids
     * @param _creator Address of the auction creator (only they can finalize the auction)
     */
    function acceptBid(address _creator) external payable onlyWhenAuctionEnded auctionNotCancelled {
        require(_creator == creator, "Only the auction creator can finalize the auction");

        if (highestBidder == address(0)) {
            // No bids placed
            nftContract.transferFrom(address(this), creator, tokenId);
            auctionEnded = true;

            emit AuctionEnded(address(0), 0, tokenId);
        } else {
            // Transfer funds and NFT to winner
            payable(creator).transfer(highestBid);
            nftContract.transferFrom(address(this), highestBidder, tokenId);
            auctionEnded = true;

            emit AuctionEnded(highestBidder, highestBid, tokenId);
        }
    }

    // --- View Functions ---

    /**
     * @notice Returns the current highest bidder and bid amount
     * @return (address, uint256) The highest bidder's address and the bid amount
     */
    function getCurrentHighestBid() external view returns (address, uint256) {
        return (highestBidder, highestBid);
    }

    /**
     * @notice Returns all bids placed during the auction
     * @return (address[] memory, uint256[] memory) Array of bidder addresses and their respective bid amounts
     */
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

    /**
     * @notice Returns the current status of the auction
     * @return string The status of the auction ("Auction cancelled", "Auction ended", or "Auction ongoing")
     */
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
