import React from 'react';

function MoreMenu({ onClose }) {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: 'white',
      border: '1px solid lightgray',
      borderRadius: '5px',
      padding: '10px',
      zIndex: 10,
      minWidth: '150px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    }}
     onMouseLeave={onClose}
    >
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <MoreMenuItem>Settings (Placeholder)</MoreMenuItem>
        <MoreMenuItem>FAQ (Placeholder)</MoreMenuItem>
        <MoreMenuItem>Blog (Placeholder)</MoreMenuItem>
        <MoreMenuItem>Social Media (Placeholder)</MoreMenuItem>
        {}
      </ul>
    </div>
  );
}

const MoreMenuItem = ({ children }) => (
  <li style={{ padding: '8px 15px', cursor: 'pointer', color: 'darkblue', borderRadius: '3px' }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
  >
    {children}
  </li>
);

export default MoreMenu;