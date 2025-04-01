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
  const { tokenId, owner, url, likes } = req.body;
  
  if (!tokenId || !owner || !url) {
    return res.status(400).json({ error: 'Missing required fields: tokenId, owner, and url.' });
  }
  
  try {
    const query = `
      INSERT INTO nfts (token_id, owner, metadata, likes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (token_id) DO NOTHING; 
      `;
    const values = [tokenId, owner, url, likes];
    const result = await pool.query(query, values);
  
    console.log('NFT data inserted into database:', { tokenId, owner, url, likes });
    res.status(201).json({ message: 'NFT data stored in database.', result: result.rowCount });
  
  } catch (error) {
    console.error('Error inserting data into database:', error);
    res.status(500).json({ error: 'Failed to store NFT data in database.' });
  }

  });

export default router;