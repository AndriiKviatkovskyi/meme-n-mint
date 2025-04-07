import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NFTCard({ imageUrl, id, name, description, creator, created_at, likes }) {
  const creationDate = new Date(created_at);
  const navigate = useNavigate();

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
        <p style={creatorStyle}>Creator: {creator}</p>
        <p style={creationTimeStyle}>Created At: {created_at}</p>
        <p style={likesStyle}>Likes: {likes || 0}</p>
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
  width: '300px',
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

const likesStyle = {
  margin: '0',
  fontSize: '0.9em',
  color: '#333',
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

export default NFTCard;