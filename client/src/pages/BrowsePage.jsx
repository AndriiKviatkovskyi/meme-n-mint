import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import NFTBrowseCard from '../components/NFTBrowseCard';
import axios from 'axios';
import { ethers } from 'ethers';
import {NFT_CONTRACT_ADDRESS, POLYGONSCAN_API_KEY} from '../constants/constants';

function BrowsePage() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const { isConnected, walletAddress, walletAddress: account, provider, signer } = useWallet();

  const sortNFTs = (nfts) => {
    const sortedNFTs = [...nfts];
    sortedNFTs.sort((a, b) => {
      let comparison = 0;

      if (sortOption === 'id') {
        comparison = a.id - b.id;
      } else if (sortOption === 'name') {
        comparison = a.name.localeCompare(b.name); 
      } else if (sortOption === 'owner') {
        comparison = a.owner.localeCompare(b.owner);
      } else if (sortOption === 'creator') {
        comparison = a.creator.localeCompare(b.creator);
      } else if (sortOption === 'likes') {
        comparison = (a.likes || 0) - (b.likes || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sortedNFTs;
  };
  
  useEffect(() => {

    const fetchNFTsWithMetadata = async () => {
      const nftData = [];
      if (!provider) {
        return;
      }
      try {
        const nftContract = await getNFTContract();
        const total = await nftContract.totalSupply();
        for (let i = 1; i <= Number(total); i++) {
          const tokenId = i;
          const [metadata, owner] = await Promise.all([
            nftContract.tokenURI(tokenId),
            nftContract.ownerOf(tokenId)
          ]);
          nftData.push({
            token_id: tokenId,
            owner,
            metadata
          });
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

                  let ownerString = nft.owner;
                  if (ownerString) {
                    try {
                      const response = await fetch(`http://localhost:5000/api/usernames?walletAddress=${ownerString}`);
                      if (response.ok) {
                        const data = await response.json();
                        ownerString = data.username;
                      } else {
                        console.error('Failed to fetch creator username');
                      }
                    } catch (error) {
                      console.error('Error fetching creator username:', error);
                    }
                  }

                  if (creatorString) {
                    try {
                      const creatorResponse = await fetch(`http://localhost:5000/api/usernames?walletAddress=${creatorString}`);
                      if (creatorResponse.ok) {
                        const creatorData = await creatorResponse.json();
                        creatorString = creatorData.username;
                      } else {
                        console.error('Failed to fetch creator username');
                      }
                    } catch (error) {
                      console.error('Error fetching creator username:', error);
                    }
                  }

                  let likes = 0;
                  try {
                    const response = await fetch(`http://localhost:5000/api/likes/nft/${nft.token_id}`);
                    const data = await response.json();
                    likes = data.like_count;
                  } catch (error) {
                    console.error('Error fetching likes:', error);
                  }

                  return {
                    imageUrl: imageUri ? `http://localhost:8080/ipfs/${imageUri}` : null,
                    id: nft.token_id,
                    name: metadata.name,
                    description: metadata.description,
                    owner: ownerString,
                    creator: creatorString,
                    created_at: formattedDate,
                    likes: likes,
                  };
                } else {
                  console.error('Failed to fetch metadata for NFT:', nft);
                  return {
                    imageUrl: null,
                    id: nft.token_id,
                    name: 'Error loading name',
                    description: 'Error loading description',
                    owner: 'Error',
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
          setNfts(transformedNFTs);
        } else {
          setError('Failed to fetch NFTs');
        }
      } catch (error) {
        setError('Error fetching NFTs');
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTsWithMetadata();
  }, [walletAddress]);

  useEffect(() => {
    if (nfts.length > 0) {
      setNfts(sortNFTs(nfts));
    }
  }, [sortOption, sortOrder]);

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

  if (loading) {
    return <div>Loading NFTs...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', padding: '20px', backgroundColor: 'white' }}>
      <h1>Browse NFTs</h1>
      <div style={{ marginBottom: '20px' }}>
        <label>Sort by: </label>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="id">ID</option>
          <option value="name">Name</option>
          <option value="owner">Owner</option>
          <option value="creator">Creator</option>
          <option value="likes">Likes</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ marginLeft: '10px' }}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {nfts.length > 0 ? (
          nfts.map((nft) => (
            <NFTBrowseCard
              key={nft.id}
              imageUrl={nft.imageUrl}
              id={nft.id}
              name={nft.name}
              description={nft.description}
              owner={nft.owner}
              creator={nft.creator}
              created_at={nft.created_at}
            />
          ))
        ) : (
          <p>No NFTs found.</p>
        )}
      </div>
    </div>
  );
}

export default BrowsePage;
