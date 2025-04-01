const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("Marketplace deployed to:", marketplaceAddress);

  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(marketplaceAddress);
  const nftAddress = await nft.getAddress();

  console.log("NFT deployed to:", nftAddress);

  const NFTAuctionFactory = await hre.ethers.getContractFactory("NFTAuctionFactory");
  const auctionFactory = await NFTAuctionFactory.deploy();
  const auctionFactoryAddress = await auctionFactory.getAddress();

  console.log("NFTAuctionFactory deployed to:", auctionFactoryAddress);

  const config = {
    marketplaceAddress,
    nftAddress,
    auctionFactoryAddress,
  };

  const configPath = path.join(__dirname, "..", "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Contract addresses saved to config.json");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});