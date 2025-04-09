import express from 'express';
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
const ipfsClient = { create };
import sharp from 'sharp';
import pool from '../database/database.js';

const IPFS_GATEWAY = 'http://127.0.0.1:5001';

const router = express.Router();

router.post('/api/mint', async (req, res) => {
  const { name, description, imageData, signature, signerAddress, timestamp } = req.body;

  console.log('Received Mint Request for Signer:', signerAddress);

  const messageToVerify = JSON.stringify({
    name: name,
    description: description,
    imageData: imageData,
    timestamp: timestamp, 
  });

  try {

    const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);

    if (recoveredAddress.toLowerCase() === signerAddress.toLowerCase()) {
      console.log('Signature Verified! Signer Address:', recoveredAddress);

      try {

        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
  
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
  
        const ipfs = ipfsClient.create({ url: IPFS_GATEWAY });
  
        const imageUploadResult = await ipfs.add(pngBuffer);
        const imageIpfsHash = imageUploadResult.cid.toString();
        const imageUrl = `ipfs://${imageIpfsHash}`; 
  
        console.log('Image converted to PNG and uploaded to IPFS. Hash:', imageIpfsHash, 'URL:', imageUrl);
  
        const metadata = {
          name: name,
          description: description,
          image: imageUrl, 
          creator: recoveredAddress,
          creationTime: Date.now(),
        };
  
        const metadataString = JSON.stringify(metadata);
  
        const metadataBuffer = Buffer.from(metadataString);
  
        const metadataUploadResult = await ipfs.add(metadataBuffer);
        const metadataIpfsHash = metadataUploadResult.cid.toString();
  
        console.log('Metadata uploaded to IPFS. Hash:', metadataIpfsHash);

        res.status(200).json({ metadataUri: `ipfs://${metadataIpfsHash}` });

  
      } catch (error) {
        console.error('Error processing image data, converting to PNG, or uploading to IPFS:', error);
        return res.status(500).json({ error: 'Error processing image data.' });
      }
    } else {
      console.error(
        'Signature Verification Failed! Recovered Address:',
        recoveredAddress,
        'Expected Address:',
        signerAddress
      );
      res.status(401).json({ error: 'Invalid signature.' });
    }
  } catch (error) {
    console.error('Error during signature verification:', error);
    res.status(500).json({ error: 'Error verifying signature.' });
  }
});


router.post('/api/nfts', async (req, res) => {
  const { tokenId, owner, url} = req.body;
  
  if (!tokenId || !owner || !url) {
    return res.status(400).json({ error: 'Missing required fields: tokenId, owner, and url.' });
  }
  
  try {
    const query = `
      INSERT INTO nfts (token_id, owner, metadata)
      VALUES ($1, $2, $3)
      ON CONFLICT (token_id) DO NOTHING; 
      `;
    const values = [tokenId, owner, url];
    const result = await pool.query(query, values);
  
    console.log('NFT data inserted into database:', { tokenId, owner, url});
    res.status(201).json({ message: 'NFT data stored in database.', result: result.rowCount });
  
  } catch (error) {
    console.error('Error inserting data into database:', error);
    res.status(500).json({ error: 'Failed to store NFT data in database.' });
  }

  });

  router.put('/api/nfts/:tokenId', async (req, res) => {
    const { tokenId } = req.params; 
    const { owner } = req.body; 
  
    if (!owner) {
      return res.status(400).json({ error: 'Missing required field: owner.' });
    }
  
    try {
      const query = `
        UPDATE nfts 
        SET owner = $1
        WHERE token_id = $2;
      `;
      const values = [owner, tokenId];
      const result = await pool.query(query, values);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "NFT with the given tokenId not found." });
      }
  
      console.log('NFT owner updated in the database:', { tokenId, owner });
      res.status(200).json({ message: 'NFT owner updated successfully', result: result.rowCount });
    } catch (error) {
      console.error('Error updating data in database:', error);
      res.status(500).json({ error: 'Failed to update NFT data in database.' });
    }
  });
  


  router.get('/api/nfts/:id', async (req, res) => {
    const nftId = req.params.id;
    
    try {
      const query = 'SELECT * FROM nfts WHERE token_id = $1';
      const values = [nftId];
      const result = await pool.query(query, values);
  
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'NFT not found' });
      }
    } catch (error) {
      console.error('Error fetching NFT:', error);
      res.status(500).json({ error: 'Failed to fetch NFT' });
    }
  });


  router.get('/api/nfts', async (req, res) => {
    try {
      const query = 'SELECT * FROM nfts';
      const result = await pool.query(query);
  
      if (result.rows.length > 0) {
        res.status(200).json(result.rows);
      } else {
        res.status(404).json({ error: 'No NFTs found' });
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      res.status(500).json({ error: 'Failed to fetch NFTs' });
    }
  });
  


  router.get('/api/nfts/owner/:owner', async (req, res) => {
    const { owner } = req.params;
  
    if (!owner) {
      return res.status(400).json({ error: 'Missing required path parameter: owner' });
    }
  
    try {
      const query = `
        SELECT token_id, owner, metadata
        FROM nfts
        WHERE owner = $1;
      `;
      const values = [owner];
      const result = await pool.query(query, values);
  
      console.log('NFT data retrieved for owner:', owner);
      res.status(200).json(result.rows); 
  
    } catch (error) {
      console.error('Error retrieving NFT data:', error);
      res.status(500).json({ error: 'Failed to retrieve NFT data.' });
    }
  });

export default router;