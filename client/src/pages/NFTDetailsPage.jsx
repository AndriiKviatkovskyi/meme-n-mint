import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import axios from 'axios';
import {NFT_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ADDRESS, POLYGONSCAN_API_KEY} from '../constants/constants';

function NFTDetailsPage() {
  const { nftId } = useParams();
  const [nftDetails, setNftDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected, walletAddress, walletAddress: account, provider, signer } = useWallet();
  const [ownerAddress, setOwnerAddress] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [listings, setListings] = useState([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listPrice, setListPrice] = useState('');


  useEffect(() => {
    const fetchNFTDetailsWithMetadata = async (id) => {
      if (!provider) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const nftContract = await getNFTContractForView();
        const tokenUri = await nftContract.tokenURI(id);
        const owner = await nftContract.ownerOf(id);
        if (2 > 1) {
          setOwnerAddress(owner);
          try {
            const uri = tokenUri.replace("ipfs://", "");
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

              let ownerString = owner;
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
                const response = await fetch(`http://localhost:5000/api/likes/nft/${id}`);
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
                id: id,
                name: metadata.name,
                description: metadata.description,
                owner: ownerString,
                creator: creatorString,
                created_at: formattedDate,
                likes: likeCount,
              });
            } else {
              console.error('Failed to fetch metadata for NFT');
              setError('Failed to load NFT metadata.');
            }
          } catch (error) {
            console.error('Error fetching metadata for NFT:', error);
            setError('Error loading NFT metadata.');
          }
        } else if (response.status === 404) {
          setError('NFT not found.');
        } else {
          setError('Failed to fetch NFT details.');
        }
      } catch (error) {
        setError('Error fetching NFT details:', error);
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetailsWithMetadata(nftId);
  }, [walletAddress, nftId]);

  const fetchListings = async () => {
    if (!provider) {
      return;
    }
    try {
      const marketplaceContract = await getMarketplaceContractForView();
      console.log(nftDetails.id);
      const rawListingId = await marketplaceContract.getListingId(nftDetails.id);
      if(Number(rawListingId) === 0){
        return;
      } else {
      const [nftContractAddress, tokenIdValue, price, seller, isSold] = await marketplaceContract.getListing(nftDetails.id);
      let data = {};
      let value = parseFloat(ethers.formatUnits(price, 18));
      if(isSold === false){
        data = {
          tokenid: Number(tokenIdValue),
          price: value,
          seller: seller,
        };
      }
      console.log(data);
      setListings([data]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (nftDetails) {
      setIsOwner(ownerAddress?.toLowerCase() === walletAddress?.toLowerCase());
      fetchListings();
    }
  }, [nftDetails, ownerAddress, walletAddress]);



  const handleBuyNow = async () => {

    const buyer = walletAddress;

    if (!listings[0] || !buyer || isNaN(listings[0].price) || listings[0].price <= 0) {
        console.error('Missing required information to buy NFT.');
        return;
    }

    const messageToSign = JSON.stringify({
        price: listings[0].price,
        buyer,
        timestamp: Date.now(),
    });

    const signature = await getSignature(messageToSign);

    if (!signature) {
        console.error('User signature failed or was rejected.');
        return;
    }

    try {
        const verifyResponse = await fetch('http://localhost:5000/api/listings/verify-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageToSign, signature, address: buyer }),
        });

        const verifyResult = await verifyResponse.json();
        if (!verifyResponse.ok || !verifyResult.verified) {
            console.error('Signature verification failed on backend:', verifyResult.error);
            return;
        }

        console.log('Signature verified successfully.');

        const price = ethers.parseEther(listings[0].price.toString());


        const nftContract = await getNFTContract();

        
        const isApproved = await nftContract.isApprovedForAll(walletAddress, MARKETPLACE_CONTRACT_ADDRESS);

        if (!isApproved) {
          console.log("Marketplace is not yet approved. Proceeding with approval...");
          const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_CONTRACT_ADDRESS, true);
          await approveTx.wait();
          console.log("Marketplace has been approved.");
        } else {
          console.log("Marketplace is already approved.");
        }

        const contract = await getMarketplaceContract();
        const tx = await contract.buyItem(NFT_CONTRACT_ADDRESS, listings[0].tokenid, {
          value: price,
        });
        const receipt = await tx.wait();
        console.log('NFT purchase successful. Tx hash:', tx.hash);

        fetchListings();

        // const response = await fetch(`http://localhost:5000/api/listings/${listings[0].listingid}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         isSold: true,
        //     }),
        // });

        // if (response.ok) {
        //     const data = await response.json();
        //     console.log('Listing updated to sold successfully:', data.message);
        //     fetchListings();
        // } else {
        //     const errorData = await response.json();
        //     console.error('Failed to update DB listing:', errorData.error);
        // }

        // const nftResponse = await fetch(`http://localhost:5000/api/nfts/${listings[0].tokenid}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         owner: buyer,
        //     }),
        // });

        // if (nftResponse.ok) {
        //     const nftData = await nftResponse.json();
        //     console.log('NFT ownership updated successfully:', nftData.message);
        //     setIsOwner(true);
        //     fetchListings();
        // } else {
        //     const nftErrorData = await nftResponse.json();
        //     console.error('Failed to update NFT owner:', nftErrorData.error);
        // }

    } catch (error) {
        console.error('Error during purchase process:', error);
    }
  };

  const handleCancelSale = async () => {
    console.log('Cancel sale clicked');
    
    if (listings.length > 0 && listings[0]) {
      //const listingIdToDelete = listings[0].listingid;
      const tokenIdToDelete = listings[0].tokenid;
      const seller = walletAddress;
      const messageToSign = JSON.stringify({
        tokenId: listings[0].tokenid,
        seller,
        timestamp: Date.now(),
      });
  
      const signature = await getSignature(messageToSign);
  
      if (!signature) {
        console.error('User signature failed or was rejected.');
        return;
      }
  
      try {
        const verifyResponse = await fetch('http://localhost:5000/api/listings/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageToSign, signature, address: seller }),
        });
  
        const verifyResult = await verifyResponse.json();
        if (!verifyResponse.ok || !verifyResult.verified) {
          console.error('Signature verification failed on backend:', verifyResult.error);
          return;
        }
  
        console.log('Signature verified successfully.');
  
        const contract = await getMarketplaceContract();

        try {
          const listingData = await contract.getListing(tokenIdToDelete);
          // console.log('Listing data from Marketplace.sol:', {
          //   nftContractAddress: listingData[0],
          //   tokenIdValue: listingData[1].toString(),
          //   price: listingData[2].toString(),
          //   seller: listingData[3],
          //   isSold: listingData[4],
          // });
        } catch (error) {
          console.error('Error fetching listing data from contract:', error);

        }


        const tx = await contract.cancelListing(NFT_CONTRACT_ADDRESS, tokenIdToDelete);
        const receipt = await tx.wait();
        console.log('Sale cancelled on-chain. Tx hash:', tx.hash);
        console.log(receipt.logs);
        const event = receipt.logs.find(log => log.fragment.name === "ItemCancelled");
        if (!event) {
          console.error("❌ No ItemCancelled event found.");
          return;
        }
  
        // const dbResponse = await fetch(`http://localhost:5000/api/listings/${listingIdToDelete}`, {
        //   method: 'DELETE',
        // });
  
        // if (dbResponse.ok) {
        //   const data = await dbResponse.json();
        //   console.log('Listing deleted from DB successfully:', data.message);
        //   fetchListings(); 
        // } else {
        //   const errorData = await dbResponse.json();
        //   console.error('Failed to delete listing from DB:', errorData.error);
        // }
        setListings([]);
        fetchListings();
      } catch (error) {
        console.error('Error during cancel sale process:', error);
      } finally {
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
    console.log(provider);
    console.log(account);
    if (!provider || !account) {
      console.log("No provider or account");
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

  const getMarketplaceABI = async () => {
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${MARKETPLACE_CONTRACT_ADDRESS}&apikey=${POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status !== "1") {
            throw new Error("Failed to fetch ABI from Polygonscan");
        }
        return JSON.parse(response.data.result);
  }

  const getNFTABI = async () => {
    const url = `https://api-amoy.polygonscan.com/api?module=contract&action=getabi&address=${NFT_CONTRACT_ADDRESS}&apikey=${POLYGONSCAN_API_KEY}`;
        const response = await axios.get(url);
        if (response.data.status !== "1") {
            throw new Error("Failed to fetch ABI from Polygonscan");
        }
        return JSON.parse(response.data.result);
  }

  async function getMarketplaceContract() {
      const abi = await getMarketplaceABI(MARKETPLACE_CONTRACT_ADDRESS);
      return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, abi, signer);
  }

  async function getMarketplaceContractForView() {
    const abi = await getMarketplaceABI(MARKETPLACE_CONTRACT_ADDRESS);
    return new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, abi, provider);
  }


  async function getNFTContract() {
    const abi = await getNFTABI(NFT_CONTRACT_ADDRESS);
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, signer);
  }

  async function getNFTContractForView() {
    const abi = await getNFTABI(NFT_CONTRACT_ADDRESS);
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, provider);
  }

  const handleListNFT = async () => {
    console.log('List NFT for sale with price:', listPrice);
  
    const tokenId = nftDetails?.id;
    const seller = walletAddress;
    const price = parseFloat(listPrice);
    const isSold = false;
  
    if (!tokenId || !seller || isNaN(price) || price <= 0) {
      console.error('Missing required information to list NFT.');
      return;
    }
  
    const messageToSign = JSON.stringify({
      tokenId,
      price,
      seller,
      timestamp: Date.now(),
    });

    const signature = await getSignature(messageToSign);
  
    if (!signature) {
      console.error('User signature failed or was rejected.');
      return;
    }
  
    try {
      const verifyResponse = await fetch('http://localhost:5000/api/listings/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSign, signature, address: seller }),
      });
  
      const verifyResult = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyResult.verified) {
        console.error('Signature verification failed on backend:', verifyResult.error);
        return;
      }
  
      console.log('Signature verified successfully.');
  
      const contract = await getMarketplaceContract();

      const nftContract = await getNFTContract();

      
      const isApproved = await nftContract.isApprovedForAll(walletAddress, MARKETPLACE_CONTRACT_ADDRESS);

      if (!isApproved) {
        console.log("Marketplace is not yet approved. Proceeding with approval...");
        const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_CONTRACT_ADDRESS, true);
        await approveTx.wait();
        console.log("Marketplace has been approved.");
      } else {
        console.log("Marketplace is already approved.");
      }


      const tx = await contract.listItem(NFT_CONTRACT_ADDRESS, tokenId, ethers.parseEther(price.toString()));
      const receipt = await tx.wait();
      console.log('NFT listed on-chain. Tx hash:', tx.hash);
      console.log(receipt.logs);
      const event = receipt.logs.find(log => log.fragment.name === "ItemListed");
      if (!event) {
          console.error("❌ No ItemListed event found.");
          return;
      }
  
      // const listingId = event.args[0].toString();

      // const dbResponse = await fetch('http://localhost:5000/api/listings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     listingId,
      //     tokenId,
      //     price,
      //     seller,
      //     isSold,
      //   }),
      // });
  
      // if (dbResponse.ok) {
      //   const data = await dbResponse.json();
      //   console.log('Listing added to DB successfully:', data.message);
      //   fetchListings();
      // } else {
      //   const errorData = await dbResponse.json();
      //   console.error('Failed to create DB listing:', errorData.error);
      // }
      fetchListings();
    } catch (error) {
      console.error('Error during listing process:', error);
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
    backgroundColor: '#ADD8E6',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#F08080', 
  };

  const listButtonHoverStyle = {
    backgroundColor: '#1288b0', 
  };

  const cancelButtonHoverStyle = {
    backgroundColor: '#B22222', 
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
    backgroundColor: '#ADD8E6',
  };

  const modalListButtonHoverStyle = {
    backgroundColor: '#1288b0', 
  };

  const modalCancelButtonStyle = {
    ...modalButtonStyle,
    backgroundColor: '#F08080', 
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

        {listings.length > 0 && isOwner && (
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
