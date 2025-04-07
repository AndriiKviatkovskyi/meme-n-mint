import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function NFTDetailsPage() {
  const { nftId } = useParams();
  const [nftDetails, setNftDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNFTDetailsWithMetadata = async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/nfts/${id}`);
        if (response.ok) {
          const nft = await response.json();
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


              let creatorString = metadata.creator;
              if (creatorString) {
                try {
                  const response = await fetch(`http://localhost:5000/api/usernames?walletAddress=${creatorString}`);
                  if (response.ok) {
                    const data = await response.json();
                    creatorString = data.username;
                  } else {
                    console.error('Failed to fetch creator username');
                  }
                } catch (error) {
                  console.error('Error fetching creator username:', error);
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

              setNftDetails({
                imageUrl: imageUri ? `http://localhost:8080/ipfs/${imageUri}` : null,
                id: nft.token_id,
                name: metadata.name,
                description: metadata.description,
                owner: ownerString,
                creator: creatorString,
                created_at: formattedDate,
                likes: likeCount,
              });
            } else {
              console.error('Failed to fetch metadata for NFT:', nft);
              setError('Failed to load NFT metadata.');
            }
          } catch (error) {
            console.error('Error fetching metadata for NFT:', nft, error);
            setError('Error loading NFT metadata.');
          }
        } else if (response.status === 404) {
          setError('NFT not found.');
        } else {
          setError('Failed to fetch NFT details.');
        }
      } catch (error) {
        setError('Error fetching NFT details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetailsWithMetadata(nftId);
  }, [nftId]);

  if (loading) {
    return <div>Loading NFT details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!nftDetails) {
    return <div>No NFT details available.</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row', 
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: 'white',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          flex: '0 0 50%',
          paddingRight: '20px',
          borderRight: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2>NFT Details</h2>
        {nftDetails.imageUrl && (
          <img
            src={nftDetails.imageUrl}
            alt={nftDetails.name}
            style={{
              maxWidth: '300px',
              maxHeight: '150px',
              marginBottom: '20px',
              objectFit: 'contain',
            }}
          />
        )}
        <p style={{ marginBottom: '0px', fontSize: '0.9em'  }}>ID: {nftDetails.id}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.9em'  }}>Name: {nftDetails.name}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em'  }}>Description: {nftDetails.description}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em'  }}>Owner: {nftDetails.owner}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em'  }}>Creator: {nftDetails.creator}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em'  }}>Created At: {nftDetails.created_at}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em'  }}>Likes: {nftDetails.likes}</p>
      </div>
      <div
        style={{
          flex: '0 0 50%',
          paddingLeft: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2>Buy/Sell/Auction</h2>
        {/* Placeholder for buying/selling and auction components */}
      </div>
    </div>
  );
}

export default NFTDetailsPage;
