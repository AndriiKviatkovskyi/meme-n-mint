const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const NFTAuction = await hre.ethers.getContractFactory("NFTAuction");

    const dummyNFTContract = "0x0000000000000000000000000000000000000000"; 
    const dummyDefaultPrice = hre.ethers.parseEther("1.0");
    const dummyStartTime = Math.floor(Date.now() / 1000) + 3600; 
    const dummyEndTime = dummyStartTime + 86400; 
    const dummyTokenId = 1; 
    const dummyInstantBuyPrice = hre.ethers.parseEther("2.0");

    const auction = await NFTAuction.deploy(
      dummyNFTContract,
      dummyDefaultPrice,
      dummyStartTime,
      dummyEndTime,
      dummyTokenId,
      dummyInstantBuyPrice
    );
  
    const auctionAddress = await auction.getAddress();
    console.log("NFTAuction deployed to:", auctionAddress);

    const verifyCommand = `npx hardhat verify --network amoy ${auctionAddress} "${dummyNFTContract}" "${dummyDefaultPrice.toString()}" "${dummyStartTime}" "${dummyEndTime}" "${dummyTokenId}" "${dummyInstantBuyPrice.toString()}"`;

    console.log("Run the following command to verify the contract:");
    console.log(verifyCommand);

    const config = {
        auctionAddress
      };
    
    const configPath = path.join(__dirname, "..", "configAuction.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Contract addresses saved to config.json");
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});