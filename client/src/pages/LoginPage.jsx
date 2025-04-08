import React from 'react';
import { useNavigate } from 'react-router-dom';
import MetamaskConnection from '../components/MetamaskConnection';
import { useWallet } from '../context/WalletContext';

function LoginPage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleContinueWithoutLogin = () => {
    navigate('/browse');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'white',
    }}>
      <h1 style={{ marginBottom: '20px' }}>Welcome to Meme Marketplace!</h1>

      <MetamaskConnection />

      <button
        style={{
          padding: '10px 20px',
          margin: '10px',
          backgroundColor: 'white',
          color: 'darkblue',
          border: '1px solid darkblue',
          cursor: 'pointer',
          borderRadius: '5px',
        }}
        onClick={handleContinueWithoutLogin}
      >
        Continue
      </button>
    </div>
  );
}

export default LoginPage;