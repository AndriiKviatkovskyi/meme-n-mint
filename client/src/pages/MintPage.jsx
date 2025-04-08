import React, { useState, useEffect } from 'react';
import MetamaskConnection from '../components/MetamaskConnection';
import { useWallet } from '../context/WalletContext';
import axios from 'axios';
import { ethers } from 'ethers';

function MintPage() {
  const { isConnected, walletAddress: account, provider, signer } = useWallet();
  const [selectedFile, setSelectedFile] = useState(null);
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [mintingStatus, setMintingStatus] = useState(null);
  const [mintingMessage, setMintingMessage] = useState('');

  const NFT_CONTRACT_ADDRESS = "0x05Ef3B28E9755dE0547aDd736bC2B311B300B811";
  const POLYGONSCAN_API_KEY = "3QRUHZJW6ABT5XFTT8CKDU59FM7KUREDN3";
  const PROVIDER_URL = "https://rpc-amoy.polygon.technology";

  useEffect(() => {
    if (mintingStatus) {
      const timer = setTimeout(() => {
        setMintingStatus(null);
        setMintingMessage('');
      }, 3000);
      return () => clearTimeout(timer); 
    }
  }, [mintingStatus]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      setMintingStatus('failed');
      setMintingMessage('Please select a valid .png, .jpg, or .jpeg file.');
    }
  };

  const handleNameChange = (event) => {
    setNftName(event.target.value);
  };

  const handleDescriptionChange = (event) => {
    setNftDescription(event.target.value);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setNftName('');
    setNftDescription('');
    setMintingStatus(null);
    setMintingMessage('');
    const fileInput = document.getElementById('nft-image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getSignature = async (message) => {
    if (!provider || !account) {
      setMintingStatus('failed');
      setMintingMessage('Please connect your wallet first.');
      return null;
    }

    try {
      const signer = await provider.getSigner(account);
      console.log("signer: ", signer);
      const signature = await signer.signMessage(message);
      console.log('Signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      setMintingStatus('failed');
      setMintingMessage('Failed to generate signature.');
      return null;
    }
  };

  const getABI = async () => {
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${NFT_CONTRACT_ADDRESS}&apikey=${POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status !== "1") {
            throw new Error("Failed to fetch ABI from Polygonscan");
        }
        return JSON.parse(response.data.result);
  }

  async function getContract() {
      const abi = await getABI(NFT_CONTRACT_ADDRESS);
      return new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, signer);
  }

  async function mintNFT(metadataUri) {

    console.log("\n🚀 Minting a new NFT...");
    console.log(signer);
    
    const contract = await getContract();
    const tx = await contract.mintToken(metadataUri);
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

    setMintingStatus('success');
      setMintingMessage('Minting successful!');
      setTimeout(() => {
        handleClear();
      }, 2000);

    return tokenId;
}
  

  const handleMint = async () => {
    if (!selectedFile || !nftName || !nftDescription) {
      setMintingStatus('failed');
      setMintingMessage('Please fill all the fields (image, name, and description) before minting.');
      return;
    }

    console.log('isConnected:', isConnected);
    console.log('account:', account);
    console.log('provider:', provider);

    setMintingStatus('progress');
    setMintingMessage('Preparing data for minting...');

    let base64ImageData = null;
    if (selectedFile) {
      const reader = new FileReader();
      await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          base64ImageData = reader.result;
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    if (!base64ImageData) {
      setMintingStatus('failed');
      setMintingMessage('Failed to read image file.');
      return;
    }

    const timestamp = Date.now();
    const messageToSign = JSON.stringify({
      name: nftName,
      description: nftDescription,
      imageData: base64ImageData,
      timestamp: timestamp,
    });

    const signature = await getSignature(messageToSign);
    if (!signature) {
      return;
    }

    setMintingMessage('Sending minting request to the server...');
    try {
      const response = await fetch('http://localhost:5000/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nftName,
          description: nftDescription,
          imageData: base64ImageData,
          signature: signature,
          signerAddress: account,
          timestamp: timestamp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Minting failed on the backend:', errorData);
        setMintingStatus('failed');
        setMintingMessage(`Minting failed: ${errorData?.message || response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('Minting successful:', data);
      const metadataUri = data.metadataUri;
      const id = await mintNFT(metadataUri);

      try {
        const publicKey = await signer.getAddress();
        const databaseResponse = await fetch('http://localhost:5000/api/nfts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: id,
            owner: publicKey,
            url: metadataUri,
          }),
        });
  
        if (!databaseResponse.ok) {
          const errorData = await response.json();
          console.error('Database error:', errorData);
          return;
        }


      } catch ( error) {
        console.error('Mint error:', error);
        setMintingStatus('failed');
        setMintingMessage(`Minting failed: ${errorData?.message || response.statusText}`);
      }

    } catch (error) {
      console.error('Error sending minting request:', error);
      setMintingStatus('failed');
      setMintingMessage('Failed to send minting request.');
    }
  };

  const formContainerStyle = {
    marginTop: '10px',
    marginBottom: '50px',
    border: '1px solid #ccc',
    padding: '15px',
    borderRadius: '5px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    overflowY: 'auto',
    maxHeight: '80vh',
  };

  const fullWidthStyle = {
    gridColumn: '1 / -1',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box',
  };

  const textareaStyle = {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box',
    minHeight: '80px',
  };

  const buttonsContainerStyle = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  };

  const buttonStyle = {
    padding: '10px',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  const clearButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
  };

  const mintButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
  };

  const pageStyle = {
    padding: '20px',
    backgroundColor: 'white',
    overflowY: 'auto',
    minHeight: '100vh',
  };

  const messageStyle = {
    marginBottom: '10px',
    fontWeight: 'bold',
    color: mintingStatus === 'success' ? 'green' : mintingStatus === 'failed' ? 'red' : 'orange',
  };

  return (
    <div style={pageStyle}>
      <h1>Meme and Mint!</h1>
      <MetamaskConnection />

      {!isConnected ? (
        <p>Sorry, no meme-n-minting without a wallet :(</p>
      ) : (
        <div style={formContainerStyle}>
          <h2 style={fullWidthStyle}>Mint Your Meme NFT</h2>

          <div>
            <label htmlFor="nft-image-upload" style={labelStyle}>Upload Image (.png, .jpg, .jpeg):</label>
            <input
              type="file"
              id="nft-image-upload"
              accept=".png, .jpg, .jpeg"
              onChange={handleFileChange}
              style={inputStyle}
            />
            {selectedFile && <p>Selected file: {selectedFile.name}</p>}
          </div>
          <div></div>

          <div>
            <label htmlFor="nft-name" style={labelStyle}>NFT Name:</label>
            <input
              type="text"
              id="nft-name"
              value={nftName}
              onChange={handleNameChange}
              style={inputStyle}
            />
          </div>
          <div></div>

          <div>
            <label htmlFor="nft-description" style={labelStyle}>NFT Description:</label>
            <textarea
              id="nft-description"
              value={nftDescription}
              onChange={handleDescriptionChange}
              style={textareaStyle}
            />
          </div>
          <div>
            {mintingMessage && <p style={messageStyle}>{mintingMessage}</p>}
            <div style={buttonsContainerStyle}>
              <button onClick={handleClear} style={clearButtonStyle}>
                Clear
              </button>
              <button
                onClick={handleMint}
                style={mintButtonStyle}
              >
                Mint NFT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MintPage;