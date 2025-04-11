import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import MetamaskConnection from '../components/MetamaskConnection';
import NFTCard from '../components/NFTCard';
import axios from 'axios';
import { ethers } from 'ethers';
import {NFT_CONTRACT_ADDRESS, POLYGONSCAN_API_KEY} from '../constants/constants';


function ProfilePage() {
  const { isConnected, walletAddress, walletAddress: signer, provider } = useWallet();
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const fetchUsername = async () => {
      if (walletAddress) {
        try {
          const response = await fetch(`http://localhost:5000/api/usernames?walletAddress=${walletAddress}`);
          if (response.ok) {
            const data = await response.json();
            setUsername(data.username);
            setNewUsername(data.username);
          } else {
            console.error('Failed to fetch username');
          }
        } catch (error) {
          console.error('Error fetching username:', error);
        }
      }
    };

    fetchUsername();
  }, [walletAddress]);


  useEffect(() => {
    const fetchUserNFTsWithMetadata = async () => {
      const nftData = [];
      if (walletAddress) {
        try {
          const nftContract = await getNFTContract();
          const total = await nftContract.totalSupply();
          console.log(total);
          for (let i = 1; i <= Number(total); i++) {
            console.log(i);
            const tokenId = i;
            const [metadata, owner] = await Promise.all([
              nftContract.tokenURI(tokenId),
              nftContract.ownerOf(tokenId)
            ]);
            if (owner.toLowerCase() === walletAddress.toLowerCase()) {
              nftData.push({
                token_id: tokenId,
                owner,
                metadata
              });
            }
          }
          if (total > -1) {
            const transformedNFTs = await Promise.all(
              nftData.map(async (nft) => {
                try {
                  const uri = nft.metadata.replace("ipfs://", "");
                  const metadataResponse = await fetch(`http://localhost:8080/ipfs/${uri}`);
                  if (metadataResponse.ok) {
                    const metadata = await metadataResponse.json();
                    const imageUri = metadata.image.replace("ipfs://", "");
                    const timestamp = metadata.creationTime;

                    const dateObject = new Date(timestamp);

                    const year = dateObject.getFullYear();
                    const month = dateObject.getMonth() + 1;
                    const day = dateObject.getDate();
                    const hours = dateObject.getHours();
                    const minutes = dateObject.getMinutes();
                    const seconds = dateObject.getSeconds();

                    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                    let creatorString = metadata.creator;

                    if (creatorString) {
                      try {
                        const response = await fetch(`http://localhost:5000/api/usernames?walletAddress=${creatorString}`);
                        if (response.ok) {
                          const data = await response.json();
                          creatorString = data.username;
                        } else {
                          console.error('Failed to fetch username');
                        }
                      } catch (error) {
                        console.error('Error fetching username:', error);
                      }
                    }

                    let likeCount = 0;

                    try {
                      const nft_id = nft.token_id;
                      const response = await fetch(`http://localhost:5000/api/likes/nft/${nft_id}`);
                      if (!response.ok) {
                        throw new Error('Failed to fetch like count');
                      }
                      const likesData = await response.json();
                      likeCount = likesData.like_count;
                    } catch (err) {
                      setError(err.message);
                    }

                    return {
                      imageUrl: imageUri ? `http://localhost:8080/ipfs/${imageUri}` : null,
                      id: nft.token_id,
                      name: metadata.name,
                      description: metadata.description,
                      creator: creatorString,
                      created_at: formattedDate,
                      likes: likeCount,
                    };
                  } else {
                    console.error('Failed to fetch metadata for NFT:', nft);
                    return {
                      imageUrl: null,
                      id: nft.token_id,
                      name: 'Error loading name',
                      description: 'Error loading description',
                      creator: 'Error',
                      created_at: nft.created_at,
                      likes: 0,
                    };
                  }
                } catch (error) {
                  console.error('Error fetching metadata for NFT:', nft, error);
                  return {
                    imageUrl: null,
                    id: nft.token_id,
                    name: 'Error loading name',
                    description: 'Error loading description',
                    creator: 'Error',
                    created_at: nft.created_at,
                    likes: 0,
                  };
                }
              })
            );
            console.log(transformedNFTs);
            setNfts(transformedNFTs);
          } else {
            console.error('Failed to fetch user NFTs');
          }
        } catch (error) {
          console.error('Error fetching user NFTs:', error);
        }
      } else {
        setNfts([]);
      }
    };

    fetchUserNFTsWithMetadata();
  }, [walletAddress]);

  const getNFTABI = async () => {
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${NFT_CONTRACT_ADDRESS}&apikey=${POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status !== "1") {
            throw new Error("Failed to fetch ABI from Polygonscan");
        }
        return JSON.parse(response.data.result);
  }

  async function getNFTContract() {
    const abi = await getNFTABI(NFT_CONTRACT_ADDRESS);
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, provider);
  }

  const handleInputChange = (event) => {
    setNewUsername(event.target.value);
  };

  const handleApplyChanges = async () => {
    setErrorMessage('');

    if (newUsername.length < 3) {
      alert('Username must be at least 3 characters long.');
      return;
    }

    if (newUsername === username) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/usernames?walletAddress=${walletAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ desiredUsername: newUsername }),
      });

      if (response.ok) {
        setUsername(newUsername);
      } else if (response.status === 409) {
        const data = await response.json();
        setErrorMessage(data.error);
        alert(data.error);
      } else {
        console.error('Failed to update username');
        alert('Failed to update username.');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Error updating username.');
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', overflowY: 'auto', maxHeight: '100vh' }}>
      <h1>User Profile</h1>
      {!isConnected ? (
        <div>
          <p>Sorry, I don't know you.</p>
          <MetamaskConnection />
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>
            Wallet Address: {walletAddress}
          </div>
          <div>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={newUsername}
              onChange={handleInputChange}
              style={{ margin: '10px 0', padding: '8px', width: '300px' }}
            />
            <button onClick={handleApplyChanges} style={{ padding: '8px 15px' }}>
              Apply Changes
            </button>
          </div>
          {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}

          <h2 style={{ marginTop: '20px' }}>Your NFTs</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                imageUrl={nft.imageUrl}
                id = {nft.id}
                name={nft.name}
                description={nft.description}
                creator={nft.creator}
                created_at={nft.created_at}
                likes={nft.likes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;