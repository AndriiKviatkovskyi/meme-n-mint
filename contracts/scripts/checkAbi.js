const API_KEY = "3QRUHZJW6ABT5XFTT8CKDU59FM7KUREDN3"; // Replace with your Polygonscan API key
const CONTRACT_ADDRESS = '0x69D2931F1A0c57428b47987Cae68Bb08F3D72d9F'; // Replace with the NFT Auction contract address
const BASE_URL = 'https://api-amoy.polygonscan.com/api';

// Function to fetch contract details
async function fetchNFTAuctionContract() {
    const url = `${BASE_URL}?module=contract&action=getabi&address=${CONTRACT_ADDRESS}&apikey=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === '1') {
            console.log('Contract ABI:', data.result);

            fs.writeFile(OUTPUT_FILE, JSON.stringify(data.result, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log(`ABI saved to ${OUTPUT_FILE}`);
                }
            });
        } else {
            console.error('Error fetching contract:', data.message);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Call the function to fetch the contract
fetchNFTAuctionContract();
