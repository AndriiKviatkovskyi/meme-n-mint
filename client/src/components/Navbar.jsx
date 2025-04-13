import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import MoreMenu from './MoreMenu';
import Logo from './Logo';
import { useWallet } from '../context/WalletContext';

function Navbar() {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { walletAddress, isConnected, provider } = useWallet();
  const [balance, setBalance] = useState(null);

  const toggleMoreMenu = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletAddress && provider) {
        try {
          const balanceWei = await provider.getBalance(walletAddress);
          const balancePOL = ethers.formatUnits(balanceWei, 18);
          setBalance(balancePOL);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance(); 

  }, [walletAddress, provider]);


  return (
    <div style={{
      backgroundColor: 'white',
      padding: '10px 20px',
      borderBottom: '1px solid lightgray',
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>

      <Logo />

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <NavbarButton to="/browse">Browse</NavbarButton>
        <NavbarButton to="/stats">Stats</NavbarButton>
        <NavbarButton to="/activity">Activity</NavbarButton>
        <NavbarButton to="/mint">Meme and Mint!</NavbarButton>
        <NavbarButton to="/profile">Profile</NavbarButton>

        {/* More Menu Button */}
        <div style={{ position: 'relative', marginLeft: '20px' }}>
          <button
            style={{
              backgroundColor: 'white',
              color: 'darkblue',
              border: 'none',
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '5px',
              transition: 'background-color 0.3s, color 0.3s',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'darkblue';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = 'darkblue';
            }}
            onClick={toggleMoreMenu}
          >
            <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>&#8942;</span> {/* Three Vertical Dots Icon */}
          </button>
          {isMoreMenuOpen && <MoreMenu onClose={() => setIsMoreMenuOpen(false)} />}
        </div>
      </div>

      {/* Balance Display */}
      <div style={{
        marginLeft: '50px',
        color: 'darkblue',
        fontWeight: 'bold',
        minWidth: '150px',
        textAlign: 'right',
        padding: '8px 15px',
        border: '1px solid lightblue',
        borderRadius: '8px',
        backgroundColor: '#f0f0f0',
        marginRight: 'auto',   
      }}>
        {isConnected && balance !== null ? (
          `Balance: ${parseFloat(balance).toFixed(2)} POL` 
        ) : isConnected ? (
          "Fetching Balance..."
        ) : (
          "NO WALLET CONNECTED" 
        )}
      </div>
    </div>
  );
}

const NavbarButton = ({ to, children }) => (
  <Link to={to} style={{ textDecoration: 'none', margin: '0 10px' }}>
    <button
      style={{
        backgroundColor: 'white',
        color: 'darkblue',
        border: 'none',
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: '5px',
        transition: 'background-color 0.3s, color 0.3s',
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = 'darkblue';
        e.target.style.color = 'white';
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = 'white';
        e.target.style.color = 'darkblue';
      }}
    >
      {children}
    </button>
  </Link>
);

export default Navbar;