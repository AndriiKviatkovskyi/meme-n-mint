import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

  router.post('/api/listings/verify-signature', async (req, res) => {
    try {
      const { message, signature, address } = req.body;
  
      if (!message || !signature || !address) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
  
      const recoveredAddress = ethers.verifyMessage(message, signature);
  
      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        return res.json({ verified: true });
      } else {
        return res.status(401).json({ verified: false, error: 'Signature does not match address.' });
      }
    } catch (err) {
      console.error('Signature verification error:', err);
      return res.status(500).json({ error: 'Internal server error during verification.' });
    }
  });

export default router;