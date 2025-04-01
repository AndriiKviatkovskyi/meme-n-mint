const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const NFT_CONTRACT_ADDRESS = config.nftAddress;
const AUCTION_FACTORY_ADDRESS = config.auctionFactoryAddress; // Auction Factory contract address
const PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // User 1
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // User 2
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"  // User 3
];
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const nftAbiPath = "./artifacts/contracts/NFT.sol/NFT.json";
const auctionFactoryAbiPath = "./artifacts/contracts/NFTAuctionFactory.sol/NFTAuctionFactory.json"; // Auction Factory ABI

// Load contract ABIs
const nftAbi = JSON.parse(fs.readFileSync(nftAbiPath, "utf8")).abi;
const auctionFactoryAbi = JSON.parse(fs.readFileSync(auctionFactoryAbiPath, "utf8")).abi;

// Create contract instances
const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, nftAbi, provider);
const auctionFactoryContract = new ethers.Contract(AUCTION_FACTORY_ADDRESS, auctionFactoryAbi, provider);

// Create wallet instances for each user
const wallets = PRIVATE_KEYS.map(key => new ethers.Wallet(key, provider));

async function mintNFT() {
  const nftURI = "https://example.com/nft_metadata.json"; // Replace with actual metadata URI
  const user1 = wallets[0];
  const mintTx = await nftContract.connect(user1).mintToken(nftURI);
  const receipt = await mintTx.wait();
  const nftTokenId = receipt.logs.find(log => log.fragment.name === "TokenMinted").args[0];
  console.log(`NFT minted with token ID: ${nftTokenId}`);
  return nftTokenId;
}

async function deployAuctionForNFT(nftTokenId) {
  console.log("\n🚀 Deploying auction...");

  // Define auction parameters
  const defaultPrice = ethers.parseEther("1"); // Default price 1 ETH
  const instantBuyPrice = ethers.parseEther("10"); // Instant buy price 10 ETH
  const startTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds 
  const endTime = startTime + 60; // End time is 60 seconds after start

  const user1 = wallets[0];

  const owner = await nftContract.ownerOf(nftTokenId);
  console.log(`Owner of token ${nftTokenId}:`, owner);

  await nftContract.connect(user1).approve(auctionFactoryContract.getAddress(), nftTokenId);

  // Deploy auction contract using Auction Factory
  const deployTx = await auctionFactoryContract.connect(user1).createAuction(
    config.nftAddress,
    defaultPrice,
    startTime,
    endTime,
    nftTokenId,
    instantBuyPrice
  );
  
  const receipt = await deployTx.wait();
  console.log(receipt.events);
  const auctionAddress = receipt.events[0].args.auctionAddress;

  console.log(`Auction deployed at address: ${auctionAddress}`);
  return auctionAddress;
}

async function placeBids(auctionAddress) {
  const auctionContract = new ethers.Contract(auctionAddress, auctionAbi, provider);
  
  // User 2 places a bid of 2 ETH after 15 seconds
  const user2 = wallets[1];
  setTimeout(async () => {
    const bidAmount = ethers.utils.parseEther("2");
    console.log("\n🤑 User 2 placing bid...");
    const bidTx = await auctionContract.connect(user2).placeBid({ value: bidAmount });
    await bidTx.wait();
    console.log("✅ User 2 placed bid of 2 ETH.");
  }, 15000); // 15 seconds delay

  // User 3 places a bid of 3 ETH after 30 seconds
  const user3 = wallets[2];
  setTimeout(async () => {
    const bidAmount = ethers.utils.parseEther("3");
    console.log("\n🤑 User 3 placing bid...");
    const bidTx = await auctionContract.connect(user3).placeBid({ value: bidAmount });
    await bidTx.wait();
    console.log("✅ User 3 placed bid of 3 ETH.");
  }, 30000); // 30 seconds delay
}

async function endAuction(auctionAddress) {
  const auctionContract = new ethers.Contract(auctionAddress, auctionAbi, provider);
  
  // Wait for 60 seconds, then end the auction
  setTimeout(async () => {
    const auctionDetails = await auctionContract.getAuctionStatus();
    if (auctionDetails === "Auction ended") {
      console.log("\n⏰ Auction ended. Finalizing the auction...");

      const winner = await auctionContract.highestBidder();
      const finalPrice = await auctionContract.highestBid();

      console.log(`🏆 Winner: ${winner}`);
      console.log(`💰 Final Price: ${ethers.utils.formatEther(finalPrice)} ETH`);

      // Transfer the NFT to the winner
      const user1 = wallets[0];
      const transferTx = await nftContract.connect(user1).transferFrom(user1.address, winner, nftTokenId);
      await transferTx.wait();
      
      console.log("✅ NFT transferred to winner.");
    }
  }, 60000); // 60 seconds after auction start
}

async function main() {
  try {
    // Mint a new NFT
    const nftTokenId = await mintNFT();

    // Deploy an auction for the minted NFT
    const auctionAddress = await deployAuctionForNFT(nftTokenId);

    // Place bids and end the auction
    placeBids(auctionAddress);
    endAuction(auctionAddress);
  } catch (error) {
    console.error("❌ Error in auction process:", error);
  }
}

main();
