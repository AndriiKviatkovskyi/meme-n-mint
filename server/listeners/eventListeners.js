import dotenv from 'dotenv';
dotenv.config();

const getNFTABI = async () => {
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${process.env.NFT_CONTRACT_ADDRESS}&apikey=${process.env.POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status !== "1") {
            throw new Error("Failed to fetch ABI from Polygonscan");
        }
        return JSON.parse(response.data.result);
}

const getMarketplaceABI = async () => {
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${process.env.MARKETPLACE_CONTRACT_ADDRESS}&apikey=${process.env.POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status !== "1") {
            throw new Error("Failed to fetch ABI from Polygonscan");
        }
        return JSON.parse(response.data.result);
}

 