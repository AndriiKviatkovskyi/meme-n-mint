import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';

function NFTDetailsPage() {
  const { nftId } = useParams();
  const [nftDetails, setNftDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected, walletAddress: account, provider, signer } = useWallet();
  const [ownerAddress, setOwnerAddress] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [listings, setListings] = useState([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const NFT_CONTRACT_ADDRESS = "0x05Ef3B28E9755dE0547aDd736bC2B311B300B811";
  const MARKETPLACE_CONTRACT_ADDRESS = "0x034FdA0732D0BdB75d87AA0607152c29751bb979";
  

  useEffect(() => {
    const fetchNFTDetailsWithMetadata = async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/nfts/${id}`);
        if (response.ok) {
          const nft = await response.json();
          setOwnerAddress(nft.owner);
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
                    console.error('Failed to fetch owner username');
                  }
                } catch (error) {
                  console.error('Error fetching owner username:', error);
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

  const fetchListings = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/listings/unsold/${nftDetails.id}`);
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else {
        console.error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  useEffect(() => {
    if (nftDetails) {
      setIsOwner(ownerAddress?.toLowerCase() === walletAddress?.toLowerCase());
      fetchListings();
    }
  }, [nftDetails, ownerAddress, walletAddress]);

  const handleBuyNow = () => {
    console.log('Buy now clicked');
  };

  const handleCancelSale = async () => {
    console.log('Cancel sale clicked');
    console.log(listings);
    if (listings.length > 0 && listings[0].listingid) {
      const listingIdToDelete = listings[0].listingid;
      try {
        const response = await fetch(`http://localhost:5000/api/listings/${listingIdToDelete}`, {
          method: 'DELETE',
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log('Listing deleted successfully:', data.message);
          fetchListings();
        } else {
          const errorData = await response.json();
          console.error('Failed to delete listing:', errorData.error);
        }
      } catch (error) {
        console.error('Error deleting listing:', error);
      }
    } else {
      console.error('No listing ID available to cancel.');
    }
  };
  

  const handleListForSaleClick = () => {
    setIsListModalOpen(true);
  };

  const handleCloseListModal = () => {
    setIsListModalOpen(false);
    setListPrice('');
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
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${MARKETPLACE_CONTRACT_ADDRESS}&apikey=${POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status !== "1") {
            throw new Error("Failed to fetch ABI from Polygonscan");
        }
        return JSON.parse(response.data.result);
  }

  async function getContract() {
      const abi = await getABI(MARKETPLACE_CONTRACT_ADDRESS);
      return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, abi, signer);
  }

  const handleListNFT = async () => {
    console.log('List NFT for sale with price:', listPrice);
    const listingId = Math.floor(Math.random() * 1000) + 1;
    const tokenId = nftDetails?.id;
    const seller = walletAddress;
    const price = parseFloat(listPrice); 
    const isSold = false;
  
    if (!tokenId || !seller || isNaN(price) || price <= 0) {
      console.error('Missing required information to list NFT.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          tokenId,
          price,
          seller,
          isSold,
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Listing added successfully:', data.message);
        fetchListings();
      } else {
        const errorData = await response.json();
        console.error('Failed to create listing:', errorData.error);
      }
    } catch (error) {
      console.error('Error sending listing request:', error);
    } finally {
      handleCloseListModal();
    }
  };

  const handlePriceChange = (event) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setListPrice(value);
    }
  };

  const buttonStyle = {
    width: '50%',
    padding: '10px 15px',
    margin: '5px 0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const listButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ADD8E6', // Light blue
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#F08080', 
  };

  const listButtonHoverStyle = {
    backgroundColor: '#1288b0', // Darker light blue
  };

  const cancelButtonHoverStyle = {
    backgroundColor: '#B22222', // Darker red
  };

  const modalButtonStyle = {
    width: '80%',
    padding: '12px 8px',
    margin: '10px 5px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    textAlign: 'center', 
  };

  const modalListButtonStyle = {
    ...modalButtonStyle,
    backgroundColor: '#ADD8E6', // Light blue
  };

  const modalListButtonHoverStyle = {
    backgroundColor: '#1288b0', // Darker light blue
  };

  const modalCancelButtonStyle = {
    ...modalButtonStyle,
    backgroundColor: '#F08080', // Light red
  };

  const modalCancelButtonHoverStyle = {
    ...modalButtonStyle,
    backgroundColor: '#e24422',
  };

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
          gap: '0px',
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
        <p style={{ marginBottom: '0px', fontSize: '0.9em' }}>ID: {nftDetails.id}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.9em' }}>Name: {nftDetails.name}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em' }}>Description: {nftDetails.description}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em' }}>Owner: {nftDetails.owner}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em' }}>Creator: {nftDetails.creator}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em' }}>Created At: {nftDetails.created_at}</p>
        <p style={{ marginBottom: '0px', fontSize: '0.8em' }}>Likes: {nftDetails.likes}</p>
      </div>
      <div
        style={{
          flex: '0 0 50%',
          paddingLeft: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2>Buy/Sell/Auction</h2>
        {listings.length === 0 && !isOwner && (
          <p>NFT not listed for sale</p>
        )}

        {listings.length === 0 && isOwner && (
          <button
            onClick={handleListForSaleClick}
            style={{ ...listButtonStyle, '&:hover': listButtonHoverStyle }}
            onMouseOver={(e) => Object.assign(e.target.style, listButtonHoverStyle)}
            onMouseOut={(e) => Object.assign(e.target.style, listButtonStyle)}
          >
            List for sale
          </button>
        )}

        {listings.length > 0 && !isOwner && listings[0] && (
          <button
            onClick={handleBuyNow}
            style={{ ...listButtonStyle, '&:hover': listButtonHoverStyle }}
            onMouseOver={(e) => Object.assign(e.target.style, listButtonHoverStyle)}
            onMouseOut={(e) => Object.assign(e.target.style, listButtonStyle)}
          >
            Buy for {listings[0].price} POL
          </button>
        )}

        {listings.length > 0 && isOwner && listings[0] && (
          <button
            onClick={handleCancelSale}
            style={{ ...cancelButtonStyle, '&:hover': cancelButtonHoverStyle, backgroundColor: '#F08080' }}
            onMouseOver={(e) => Object.assign(e.target.style, cancelButtonHoverStyle)}
            onMouseOut={(e) => Object.assign(e.target.style, cancelButtonStyle)}
          >
            Cancel Sale
          </button>
        )}

        {isListModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                minWidth: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <h3>List NFT for Sale</h3>
              <input
                type="text"
                value={listPrice}
                onChange={handlePriceChange}
                placeholder="Enter sale price (in POL)"
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  width: '100%',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={handleListNFT}
                style={{
                  ...modalListButtonStyle,
                  '&:hover': modalListButtonHoverStyle,
                }}
                onMouseOver={(e) => Object.assign(e.target.style, modalListButtonHoverStyle)}
                onMouseOut={(e) => Object.assign(e.target.style, modalListButtonStyle)}
              >
                List NFT
              </button>
              <button
                onClick={handleCloseListModal}
                style={{
                  ...modalCancelButtonStyle,
                  '&:hover': modalCancelButtonHoverStyle,
                }}
                onMouseOver={(e) => Object.assign(e.target.style, modalCancelButtonHoverStyle)}
                onMouseOut={(e) => Object.assign(e.target.style, modalCancelButtonStyle)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NFTDetailsPage;
