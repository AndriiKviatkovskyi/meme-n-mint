import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { useWallet } from '../context/WalletContext'; 


const providerOptions = {

};

let web3Modal;

function MetamaskConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { setWalletData, clearWalletData } = useWallet();

  useEffect(() => {
    web3Modal = new Web3Modal({
      network: "amoy", 
      cacheProvider: false,
      providerOptions,
    });
  }, []);


  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const provider = await web3Modal.connect();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();

      setWalletData(address, ethersProvider);
      console.log("Connected Wallet Address:", address);

    } catch (error) {
      console.error("Wallet Connection Error:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [setWalletData]);

  const disconnectWallet = useCallback(async () => {
    try {
      await web3Modal.clearCachedProvider();
      
      clearWalletData();
      console.log("Wallet Disconnected");
    } catch (error) {
      console.error("Wallet Disconnect Error:", error);
    }
  }, [clearWalletData]);


  // useEffect(() => {
  //   if (web3Modal.cachedProvider) {
  //     connectWallet();
  //   }
  // }, [connectWallet]);


  return (
    <div>
      {useWallet().isConnected ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '10px' }}>Connected Wallet Address: {useWallet().walletAddress}</p>
          <button onClick={disconnectWallet} style={{ margin: '0 auto', display: 'block' }}>Disconnect Wallet</button>
        </div>
      ) : (
        <button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}

export default MetamaskConnection;