const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

const NFT_CONTRACT_ADDRESS = "0xA24C3fe30C7Ea933A48EDc91f03529113c8C72CA";
const METADATA_URL = "https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/NFT_Metadata.json";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const PROVIDER_URL = "https://rpc-amoy.polygon.technology";

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function getABI(contractAddress) {
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${contractAddress}&apikey=${POLYGONSCAN_API_KEY}`;
    const response = await axios.get(url);
    if (response.data.status !== "1") {
        throw new Error("Failed to fetch ABI from Polygonscan");
    }
    return JSON.parse(response.data.result);
}

async function getContract() {
    const abi = await getABI(NFT_CONTRACT_ADDRESS);
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, wallet);
}

async function mintNFT() {
    console.log("\n🚀 Minting a new NFT...");
    
    const contract = await getContract();
    const tx = await contract.mintToken(METADATA_URL);
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => log.fragment.name === "TokenMinted");
    if (!event) {
        console.error("❌ No TokenMinted event found.");
        return;
    }

    const tokenId = event.args[0].toString();
    const tokenURI = event.args[1];
    const marketplace = event.args[2];
    const minter = event.args[3];

    console.log(`✅ NFT Minted!`);
    console.log(`🆔 Token ID: ${tokenId}`);
    console.log(`🔗 Metadata URL: ${tokenURI}`);
    console.log(`👤 Minter: ${minter}`);
    console.log(`🏪 Marketplace: ${marketplace}`);

    return tokenId;
}


async function getMintedNFTs() {
    console.log("\n📜 Fetching all minted NFTs...");
    
    const contract = await getContract();
    const events = await contract.queryFilter("TokenMinted");

    if (events.length === 0) {
        console.log("❌ No NFTs minted yet.");
        return;
    }

    console.log(`✅ Found ${events.length} minted NFTs:`);

    events.forEach(event => {
        const tokenId = event.args[0].toString();
        const tokenURI = event.args[1];
        const marketplace = event.args[2];
        const minter = event.args[3];

        console.log("\n------------------------");
        console.log(`🆔 Token ID: ${tokenId}`);
        console.log(`🔗 Metadata URL: ${tokenURI}`);
        console.log(`👤 Minter: ${minter}`);
        console.log(`🏪 Marketplace: ${marketplace}`);
    });
}

async function main() {
    await mintNFT();
    await getMintedNFTs();
}

main().catch(console.error);
