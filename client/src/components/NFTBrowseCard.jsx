import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

function NFTBrowseCard({ imageUrl, id, name, description, owner, creator, created_at }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const { walletAddress } = useWallet();
  const navigate = useNavigate();

  const shortCreator = creator && creator.length > 24
    ? creator.slice(0, 24) + '...'
    : creator;

  const shortOwner = owner && owner.length > 24
    ? owner.slice(0, 24) + '...'
    : owner;

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/likes/nft/${id}`);
        const data = await response.json();
        setLikes(data.like_count);
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    fetchLikes();
  }, [id]);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!walletAddress) return;
      try {
        const response = await fetch(`http://localhost:5000/api/likes?nft_id=${id}&user_id=${walletAddress}`);
        const data = await response.json();
        setLiked(data.liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [id, walletAddress]);

  const handleLikeToggle = async () => {
    if (!walletAddress) return;

    try {
      const method = liked ? 'DELETE' : 'POST';
      const response = await fetch('http://localhost:5000/api/likes', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: walletAddress, nft_id: id }),
      });
      const data = await response.json();
      if (data) {
        setLiked(!liked);
        setLikes(likes + (liked ? -1 : 1));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleViewDetailsClick = () => {
    navigate(`/nft/${id}`);
  };

  return (
    <div style={cardStyle}>
      <div style={imageFrameStyle}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} style={imageStyle} />
        ) : (
          <div style={noImageStyle}>No Image</div>
        )}
      </div>
      <div style={contentStyle}>
        <h3 style={idStyle}>{id || 'Untitled'}</h3>
        <h3 style={nameStyle}>{name || 'Untitled'}</h3>
        <p style={descriptionStyle}>{description || 'No description provided.'}</p>
        <p style={ownerStyle}>Owner:</p>
        <p style={ownerStyle}>{shortOwner}</p>
        <p style={creatorStyle}>Creator:</p>
        <p style={creatorStyle}>{shortCreator}</p>
        <p style={creationTimeStyle}>Created At: {created_at}</p>
        <button
          onClick={handleLikeToggle}
          style={{
            ...likeButtonStyle,
            backgroundColor: liked
              ? '#007bff'
              : walletAddress
              ? '#add8e6'
              : '#d3d3d3',
            cursor: walletAddress ? 'pointer' : 'not-allowed',
          }}
          disabled={!walletAddress}
        >
          {liked ? 'LOLed' : 'LOL'} {" : "} {likes}
        </button>
      </div>
      <button onClick={handleViewDetailsClick} style={viewDetailsButtonStyle}>
        View Details
      </button>
    </div>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  margin: '10px',
  width: '256px',
  backgroundColor: '#f9f9f9',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const imageFrameStyle = {
  width: '256px',
  height: '256px',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#eee',
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const noImageStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  color: '#888',
  fontSize: '14px',
};

const contentStyle = {
  padding: '15px',
};

const idStyle = {
  margin: '0 0 5px 0',
  fontSize: '1em',
  fontWeight: 'bold',
  color: '#777',
};

const nameStyle = {
  margin: '0 0 10px 0',
  fontSize: '1.2em',
  fontWeight: 'bold',
};

const descriptionStyle = {
  margin: '0 0 10px 0',
  fontSize: '0.9em',
  color: '#555',
};

const ownerStyle = {
  margin: '0 0 5px 0',
  fontSize: '0.85em',
  color: '#777',
};

const creatorStyle = {
  margin: '0 0 5px 0',
  fontSize: '0.85em',
  color: '#777',
};

const creationTimeStyle = {
  margin: '0 0 5px 0',
  fontSize: '0.8em',
  color: '#999',
};

const likeButtonStyle = {
  padding: '8px 15px',
  borderRadius: '5px',
  color: 'white',
  fontSize: '0.9em',
  marginTop: '10px',
  border: 'none',
};

const viewDetailsButtonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 15px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1em',
  marginTop: '10px',
};

export default NFTBrowseCard;
