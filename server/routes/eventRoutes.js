import express from 'express';
import pool from '../database/database.js';

const router = express.Router();

router.get('/api/minted-tokens', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM minted_tokens ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching minted tokens:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/api/listings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM listings ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/api/purchases', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM purchases ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/api/cancellations', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cancellations ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching cancellations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/api/auctions', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM auctions ORDER BY start_time DESC');
      res.json(rows);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/api/auction-deletions', async (req, res) => {
try {
    const { rows } = await pool.query('SELECT * FROM auction_deletions ORDER BY auction_id DESC');
    res.json(rows);
} catch (error) {
    console.error('Error fetching auction deletions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

router.get('/api/auction-results', async (req, res) => {
try {
    const { rows } = await pool.query('SELECT * FROM auction_results ORDER BY auction_id DESC');
    res.json(rows);
} catch (error) {
    console.error('Error fetching auction results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

router.get('/api/total-minted', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT COUNT(*) FROM minted_tokens');
      res.json({ totalMinted: rows[0].count });
    } catch (error) {
      console.error('Error counting minted NFTs:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/api/total-sold', async (req, res) => {
try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM purchases');
    res.json({ totalSold: rows[0].count });
} catch (error) {
    console.error('Error counting sold NFTs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

router.get('/api/total-auctions-ended', async (req, res) => {
try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM auction_results');
    res.json({ totalAuctionsEnded: rows[0].count });
} catch (error) {
    console.error('Error counting successful auction results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

export default router;