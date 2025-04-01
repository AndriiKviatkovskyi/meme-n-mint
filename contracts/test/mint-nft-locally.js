const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const NFT_CONTRACT_ADDRESS = config.nftAddress; 
const METADATA_URL = "https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/NFT_Metadata.json";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; 

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const abiPath = "./artifacts/contracts/NFT.sol/NFT.json";
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, wallet);

async function mintNFT() {
    console.log("\n🚀 Minting a new NFT...");

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
