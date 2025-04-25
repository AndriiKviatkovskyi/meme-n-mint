import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const setWalletData = useCallback(async (address, connectedProvider) => {
    setWalletAddress(address);
    setIsConnected(true);
    setProvider(connectedProvider);
    try {
      const signerInstance = await connectedProvider.getSigner();
      setSigner(signerInstance);
    } catch (error) {
      console.error('Error getting signer:', error);
      setSigner(null);
    }
  }, []);
  
  const clearWalletData = useCallback(() => {
    setWalletAddress(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletData(accounts[0].address, provider);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();


    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await setWalletData(accounts[0], provider);
        } else {
          clearWalletData();
        }
      });

      window.ethereum.on('chainChanged', () => {
        clearWalletData();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [setWalletData, clearWalletData]);



  const contextValue = {
    walletAddress,
    setWalletAddress,
    isConnected,
    setIsConnected,
    provider,
    signer,
    setWalletData,
    clearWalletData
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  return useContext(WalletContext);
};