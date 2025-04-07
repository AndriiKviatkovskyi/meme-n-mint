import React, { useState, useEffect } from 'react';
import NFTBrowseCard from '../components/NFTBrowseCard';

function BrowsePage() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNFTsWithMetadata = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/nfts');
        if (response.ok) {
          const nftData = await response.json();
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

                  return {
                    imageUrl: imageUri ? `http://localhost:8080/ipfs/${imageUri}` : null,
                    id: nft.token_id,
                    name: metadata.name,
                    description: metadata.description,
                    owner: ownerString,
                    creator: creatorString,
                    created_at: formattedDate,
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
  }, []);

  if (loading) {
    return <div>Loading NFTs...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', padding: '20px', backgroundColor: 'white' }}>
      <h1>Browse NFTs</h1>
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
              likes={nft.likes}
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
