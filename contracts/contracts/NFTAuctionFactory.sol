// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./NFTAuction.sol";

contract NFTAuctionFactory {
    using Counters for Counters.Counter;

    mapping(uint256 => NFTAuction) public auctions;
    mapping(uint256 => uint256) public auctionsByTokenId;
    mapping(address => uint256[]) public auctionsByCreator;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed auctionAddress,
        address indexed creator,
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime,
        uint256 defaultPrice,
        uint256 instantBuyPrice
    );

    event AuctionDeleted(
        uint256 indexed auctionId,
        address indexed creator,
        uint256 tokenId
    );

    event AuctionOver(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 highestBid,
        uint256 tokenId
    );

    event AuctionOverInstantly(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 price,
        uint256 tokenId
    );

    Counters.Counter private auctionCounter;

    /**
     * @notice Creates a new NFT auction
     * @dev Deploys a new NFTAuction contract and registers it in the factory
     * @param _nftContract The address of the NFT contract being auctioned
     * @param _defaultPrice The starting bid for the auction
     * @param _startTime The start time of the auction
     * @param _endTime The end time of the auction
     * @param _tokenId The ID of the token being auctioned
     * @param _instantBuyPrice The price for the instant buy option
     * @return auctionId The ID of the newly created auction
     */
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
            _instantBuyPrice,
            msg.sender
        );

        auctionCounter.increment();
        uint256 auctionId = auctionCounter.current();

        auctions[auctionId] = newAuction;
        auctionsByTokenId[_tokenId] = auctionId;
        auctionsByCreator[msg.sender].push(auctionId);

        emit AuctionCreated(
            auctionId,
            address(newAuction),
            msg.sender,
            _tokenId,
            _startTime,
            _endTime,
            _defaultPrice,
            _instantBuyPrice
        );

        return auctionId;
    }

    /**
     * @notice Deletes an existing auction
     * @dev Cancels the auction and removes it from the creator's list
     * @param auctionId The ID of the auction to be deleted
     */
    function deleteAuction(uint256 auctionId) external {
        require(address(auctions[auctionId]) != address(0), "Auction does not exist");

        NFTAuction auction = auctions[auctionId];

        uint256 tokenId = auction.tokenId();

        auction.cancelAuction(msg.sender);

        _removeAuctionFromCreator(auction.creator(), auctionId);
        delete auctions[auctionId];
        delete auctionsByTokenId[tokenId];

        emit AuctionDeleted(
            auctionId,
            auction.creator(),
            tokenId
        );
    }

    /**
     * @notice Finalizes an auction after it ends and transfers the NFT to the winner
     * @dev This function ensures the highest bidder receives the NFT
     * @param auctionId The ID of the auction to finalize
     */
    function auctionOver(uint256 auctionId) external {
        require(address(auctions[auctionId]) != address(0), "Auction does not exist");

        NFTAuction auction = auctions[auctionId];

        uint256 tokenId = auction.tokenId();

        address winner = auction.highestBidder();
        uint256 finalPrice = auction.highestBid();  

        auction.acceptBid(msg.sender);

        _removeAuctionFromCreator(auction.creator(), auctionId);
        delete auctionsByTokenId[tokenId];

        emit AuctionOver(
            auctionId,
            winner,
            finalPrice,
            tokenId
        );
    }

    /**
     * @notice Ends the auction instantly via instant buy
     * @dev Deletes auction details without processing a bid
     * @param auctionId The ID of the auction to end
     */
    function auctionOverInstantly(uint256 auctionId) external payable{
        require(address(auctions[auctionId]) != address(0), "Auction does not exist");

        NFTAuction auction = auctions[auctionId];

        uint256 tokenId = auction.tokenId();
        uint256 finalPrice = auction.instantBuyPrice(); 

        auction.buyInstantly{value: msg.value}(msg.sender);

        _removeAuctionFromCreator(auction.creator(), auctionId);
        delete auctionsByTokenId[tokenId];

        emit AuctionOverInstantly(
            auctionId,
            msg.sender,
            finalPrice,
            tokenId
        );
    }

    /**
     * @notice Retrieves detailed information about an auction
     * @param auctionId The ID of the auction to retrieve information for
     * @return owner The address of the auction creator
     * @return defaultPrice The starting bid for the auction
     * @return startTime The start time of the auction
     * @return endTime The end time of the auction
     * @return tokenId The token ID of the auctioned NFT
     * @return instantBuyPrice The price for the instant buy option
     * @return highestBidder The address of the highest bidder
     * @return highestBid The highest bid amount
     * @return auctionEnded Whether the auction has ended
     */
    function getAuctionInfo(uint256 auctionId) external view returns (
        address owner,
        uint256 defaultPrice,
        uint256 startTime,
        uint256 endTime,
        uint256 tokenId,
        uint256 instantBuyPrice,
        address highestBidder,
        uint256 highestBid,
        bool auctionEnded
    ) {

        require(address(auctions[auctionId]) != address(0), "Auction does not exist");

        NFTAuction auction = auctions[auctionId];

        return (
            auction.creator(),
            auction.defaultPrice(),
            auction.startTime(),
            auction.endTime(),
            auction.tokenId(),
            auction.instantBuyPrice(),
            auction.highestBidder(),
            auction.highestBid(),
            auction.auctionEnded()
        );
    }

    /**
     * @notice Removes an auction from a creator's list of auctions
     * @param creator The address of the creator
     * @param auctionId The ID of the auction to remove
     */
    function _removeAuctionFromCreator(address creator, uint256 auctionId) internal {
        uint256[] storage creatorAuctions = auctionsByCreator[creator];
        for (uint256 i = 0; i < creatorAuctions.length; i++) {
            if (creatorAuctions[i] == auctionId) {
                creatorAuctions[i] = creatorAuctions[creatorAuctions.length - 1];
                creatorAuctions.pop();
                break;
            }
        }
    }

    /**
     * @notice Retrieves the address of the auction contract by its ID
     * @param auctionId The ID of the auction
     * @return The address of the auction contract
     */
    function getAuctionAddress(uint256 auctionId) external view returns (address) {
        return address(auctions[auctionId]);
    }

    /**
     * @notice Retrieves the total number of auctions created
     * @return The number of auctions created so far
     */
    function getAuctionCount() external view returns (uint256) {
        return auctionCounter.current();
    }

    /**
     * @notice Retrieves all auctions created by a specific creator
     * @param creator The address of the auction creator
     * @return A list of auction IDs created by the specified creator
     */
    function getAuctionsByCreator(address creator) external view returns (uint256[] memory) {
        return auctionsByCreator[creator];
    }
}
