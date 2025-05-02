import { ethers } from 'ethers';
import dotenv from 'dotenv';
import axios from 'axios';
import pool from '../database/database.js';

dotenv.config();

const provider = new ethers.JsonRpcProvider('https://polygon-amoy.infura.io/v3/a94bbccf30594824b9903de3edcc87a7');

const fetchAbi = async (address) => {
  const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${address}&apikey=${process.env.POLYGONSCAN_API_KEY}`;
  const response = await axios.get(url);
  if (response.data.status !== "1") {
    throw new Error("Failed to fetch ABI from Polygonscan");
  }
  return JSON.parse(response.data.result);
};

export async function registerEventListeners() {
  try {
    const nftAbi = await fetchAbi(process.env.NFT_CONTRACT_ADDRESS);
    const marketplaceAbi = await fetchAbi(process.env.MARKETPLACE_CONTRACT_ADDRESS);
    const auctionFactoryAbi = await fetchAbi(process.env.AUCTION_FACTORY_CONTRACT_ADDRESS);

    const nftContract = new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS, nftAbi, provider);
    const marketplaceContract = new ethers.Contract(process.env.MARKETPLACE_CONTRACT_ADDRESS, marketplaceAbi, provider);
    const auctionFactory = new ethers.Contract(process.env.AUCTION_FACTORY_CONTRACT_ADDRESS, auctionFactoryAbi, provider);

    nftContract.on('TokenMinted', async (tokenId, tokenURI, marketplaceAddress, minter) => {
      try {
        await pool.query(
          `INSERT INTO minted_tokens (token_id, token_uri, marketplace_address, minter) VALUES ($1, $2, $3, $4)
           ON CONFLICT (token_id) DO NOTHING`,
          [tokenId.toString(), tokenURI, marketplaceAddress, minter]
        );
        console.log(`[TokenMinted] Token ${tokenId} minted by ${minter}`);
      } catch (err) {
        console.error('Error writing TokenMinted event:', err);
      }
    });

    marketplaceContract.on('ItemListed', async (listingId, nftContract, tokenId, price, seller) => {
      try {
        await pool.query(
          `INSERT INTO listings (listing_id, nft_contract, token_id, price, seller) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (listing_id) DO NOTHING`,
          [listingId.toString(), nftContract, tokenId.toString(), price.toString(), seller]
        );
        console.log(`[ItemListed] Listing ${listingId} for token ${tokenId} by ${seller}`);
      } catch (err) {
        console.error('Error writing ItemListed event:', err);
      }
    });

    marketplaceContract.on('ItemBought', async (listingId, nftContract, tokenId, price, buyer, seller) => {
      try {
        await pool.query(
          `INSERT INTO purchases (listing_id, nft_contract, token_id, price, buyer, seller) VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (listing_id) DO NOTHING`,
          [listingId.toString(), nftContract, tokenId.toString(), price.toString(), buyer, seller]
        );
        console.log(`[ItemBought] Listing ${listingId} bought by ${buyer}`);
      } catch (err) {
        console.error('Error writing ItemBought event:', err);
      }
    });

    marketplaceContract.on('ItemCancelled', async (listingId, nftContract, tokenId, seller) => {
      try {
        await pool.query(
          `INSERT INTO cancellations (listing_id, nft_contract, token_id, seller) VALUES ($1, $2, $3, $4)
           ON CONFLICT (listing_id) DO NOTHING`,
          [listingId.toString(), nftContract, tokenId.toString(), seller]
        );
        console.log(`[ItemCancelled] Listing ${listingId} cancelled by ${seller}`);
      } catch (err) {
        console.error('Error writing ItemCancelled event:', err);
      }
    });

    auctionFactory.on('AuctionCreated', async (auctionId, auctionAddress, creator, tokenId, startTime, endTime, defaultPrice, instantBuyPrice) => {
        try {
          await pool.query(
            `INSERT INTO auctions (auction_id, auction_address, creator, token_id, start_time, end_time, default_price, instant_buy_price)
             VALUES ($1, $2, $3, $4, to_timestamp($5), to_timestamp($6), $7, $8)
             ON CONFLICT (auction_id) DO NOTHING`,
            [
              auctionId.toString(),
              auctionAddress,
              creator,
              tokenId.toString(),
              startTime.toString(),
              endTime.toString(),
              defaultPrice.toString(),
              instantBuyPrice.toString()
            ]
          );
          console.log(`[AuctionCreated] Auction ${auctionId} created by ${creator}`);
        } catch (err) {
          console.error('Error writing AuctionCreated event:', err);
        }
    });
  
    auctionFactory.on('AuctionDeleted', async (auctionId, creator, tokenId) => {
    try {
        await pool.query(
        `INSERT INTO auction_deletions (auction_id, creator, token_id) VALUES ($1, $2, $3)
            ON CONFLICT (auction_id) DO NOTHING`,
        [auctionId.toString(), creator, tokenId.toString()]
        );
        console.log(`[AuctionDeleted] Auction ${auctionId} deleted by ${creator}`);
    } catch (err) {
        console.error('Error writing AuctionDeleted event:', err);
    }
    });

    auctionFactory.on('AuctionOver', async (auctionId, winner, highestBid, tokenId) => {
    try {
        await pool.query(
        `INSERT INTO auction_results (auction_id, winner, highest_bid, token_id, type) VALUES ($1, $2, $3, $4, 'bid')
            ON CONFLICT (auction_id) DO NOTHING`,
        [auctionId.toString(), winner, highestBid.toString(), tokenId.toString()]
        );
        console.log(`[AuctionOver] Auction ${auctionId} won by ${winner} for ${highestBid}`);
    } catch (err) {
        console.error('Error writing AuctionOver event:', err);
    }
    });

    auctionFactory.on('AuctionOverInstantly', async (auctionId, winner, price, tokenId) => {
    try {
        await pool.query(
        `INSERT INTO auction_results (auction_id, winner, highest_bid, token_id, type) VALUES ($1, $2, $3, $4, 'instant')
            ON CONFLICT (auction_id) DO NOTHING`,
        [auctionId.toString(), winner, price.toString(), tokenId.toString()]
        );
        console.log(`[AuctionOverInstantly] Auction ${auctionId} bought instantly by ${winner} for ${price}`);
    } catch (err) {
        console.error('Error writing AuctionOverInstantly event:', err);
    }
    });

    console.log('✅ Event listeners registered.');

  } catch (err) {
    console.error('❌ Failed to set up contracts or listeners:', err);
  }
}
