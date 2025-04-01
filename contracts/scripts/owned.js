const axios = require("axios");
require("dotenv").config();

const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const POLYGONSCAN_URL = "https://api-amoy.polygonscan.com/api";

async function getOwnedNFTs(walletAddress) {
    try {
        console.log(`\n🔍 Fetching ERC-721 NFTs for: ${walletAddress}`);

        const url = `${POLYGONSCAN_URL}?module=account&action=tokennfttx&address=${walletAddress}&apikey=${POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status !== "1") {
            console.error("❌ No NFTs found or API error.");
            return;
        }

        const transactions = response.data.result;
        if (transactions.length === 0) {
            console.log("🚫 No ERC-721 NFTs found.");
            return;
        }

        let ownedNFTs = {};
        transactions.forEach(tx => {
            if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
                ownedNFTs[tx.tokenID] = {
                    contract: tx.contractAddress,
                    tokenId: tx.tokenID,
                    tokenName: tx.tokenName,
                    tokenSymbol: tx.tokenSymbol,
                };
            } else if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
                delete ownedNFTs[tx.tokenID]; // If sent away, remove it
            }
        });

        console.log(`✅ Found ${Object.keys(ownedNFTs).length} NFTs:`);
        Object.values(ownedNFTs).forEach(nft => {
            console.log("\n---------------------------");
            console.log(`🎨 Collection: ${nft.tokenName} (${nft.tokenSymbol})`);
            console.log(`📜 Contract: ${nft.contract}`);
            console.log(`🆔 Token ID: ${nft.tokenId}`);
        });

    } catch (error) {
        console.error("❌ Error fetching NFTs:", error.message);
    }
}

// Run the function
getOwnedNFTs(WALLET_ADDRESS);
