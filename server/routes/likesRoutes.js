import express from 'express';
import pool from '../database/database.js';

const router = express.Router();

router.post('/api/likes', async (req, res) => {
    const { user_id, nft_id } = req.body;
  
    if (!user_id || !nft_id) {
      return res.status(400).json({ error: 'User ID and NFT ID are required' });
    }
  
    try {
      const checkLikeQuery = `
        SELECT * FROM likes WHERE user_id = $1 AND nft_id = $2;
      `;
      const checkLikeValues = [user_id, nft_id];
      const checkLikeResult = await pool.query(checkLikeQuery, checkLikeValues);
  
      if (checkLikeResult.rows.length > 0) {
        return res.status(400).json({ message: 'You have already liked this NFT' });
      }
  
      const insertLikeQuery = `
        INSERT INTO likes (user_id, nft_id, created_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        RETURNING id;
      `;
      const insertLikeValues = [user_id, nft_id];
      const insertLikeResult = await pool.query(insertLikeQuery, insertLikeValues);
  
      res.status(201).json({
        message: 'Like added successfully!',
        like_id: insertLikeResult.rows[0].id,
      });
    } catch (err) {
      console.error('Error adding like:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/api/likes', async (req, res) => {
    const { user_id, nft_id } = req.query;
  
    if (!user_id || !nft_id) {
      return res.status(400).json({ error: 'User ID and NFT ID are required' });
    }
  
    try {
      const checkLikeQuery = `
        SELECT * FROM likes WHERE user_id = $1 AND nft_id = $2;
      `;
      const checkLikeValues = [user_id, nft_id];
      const result = await pool.query(checkLikeQuery, checkLikeValues);
  
      if (result.rows.length > 0) {
        res.json({ liked: true });
      } else {
        res.json({ liked: false });
      }
    } catch (err) {
      console.error('Error checking like status:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/api/likes', async (req, res) => {
    const { user_id, nft_id } = req.body;
  
    if (!user_id || !nft_id) {
      return res.status(400).json({ error: 'User ID and NFT ID are required' });
    }
  
    try {
      const deleteLikeQuery = `
        DELETE FROM likes WHERE user_id = $1 AND nft_id = $2 RETURNING id;
      `;
      const deleteLikeValues = [user_id, nft_id];
      const result = await pool.query(deleteLikeQuery, deleteLikeValues);
  
      if (result.rowCount === 0) {
        return res.status(400).json({ message: 'Like not found or already removed' });
      }
  
      res.json({ message: 'Like removed successfully' });
    } catch (err) {
      console.error('Error removing like:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  router.get('/api/likes/nft/:nft_id', async (req, res) => {
    const { nft_id } = req.params;
  
    if (!nft_id) {
      return res.status(400).json({ error: 'Missing required parameter: nft_id' });
    }
  
    try {
      const countLikesQuery = `
        SELECT COUNT(*) AS like_count
        FROM likes
        WHERE nft_id = $1;
      `;
      const countLikesValues = [nft_id];
      const result = await pool.query(countLikesQuery, countLikesValues);

  
      res.status(200).json({ nft_id, like_count: parseInt(result.rows[0].like_count, 10) });
    } catch (err) {
      console.error('Error retrieving like count:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router;