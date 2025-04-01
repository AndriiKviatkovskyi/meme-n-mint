import express from 'express';
import { ethers } from 'ethers';
import sharp from 'sharp';
import pool from '../database/database.js';

const IPFS_GATEWAY = 'http://127.0.0.1:5001';

const router = express.Router();

router.get('/api/usernames', async (req, res) => {
    const { walletAddress } = req.query;
  
    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing required query parameter: walletAddress' });
    }
  
    try {
      const query = `
        SELECT username
        FROM wallets_usernames
        WHERE wallet = $1;
      `;
  
      const values = [walletAddress];
      const result = await pool.query(query, values);
  
      if (result.rows.length === 0 || !result.rows[0].username) {
        return res.status(200).json({ username: walletAddress });
      } else {
        return res.status(200).json({ username: result.rows[0].username });
      }
  
    } catch (error) {
      console.error('Error fetching username:', error);
      return res.status(500).json({ error: 'Failed to retrieve username.' });
    }
  });

  
  router.post('/api/usernames', async (req, res) => {
    const { walletAddress } = req.query;
    const { desiredUsername } = req.body;
  
    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing required query parameter: walletAddress' });
    }
  
    if (!desiredUsername) {
      return res.status(400).json({ error: 'Missing required field in request body: desiredUsername' });
    }
  
    try {
      const checkUsernameQuery = `
        SELECT wallet
        FROM wallets_usernames
        WHERE username = $1 AND wallet <> $2;
      `;
      const checkUsernameValues = [desiredUsername, walletAddress];
      const usernameCheckResult = await pool.query(checkUsernameQuery, checkUsernameValues);
  
      if (usernameCheckResult.rows.length > 0) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
  
      const updateUsernameQuery = `
        INSERT INTO wallets_usernames (wallet, username)
        VALUES ($1, $2)
        ON CONFLICT (wallet) DO UPDATE SET username = $2;
      `;
      const updateUsernameValues = [walletAddress, desiredUsername];
      await pool.query(updateUsernameQuery, updateUsernameValues);
  
      return res.status(200).json({ message: 'Username updated successfully.' });
  
    } catch (error) {
      console.error('Error updating username:', error);
      return res.status(500).json({ error: 'Failed to update username.' });
    }
  });

export default router;