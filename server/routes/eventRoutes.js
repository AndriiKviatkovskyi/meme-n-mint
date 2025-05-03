import express from 'express';
import pool from '../database/database.js';
import { formatUnits } from 'ethers';

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

router.get('/api/total-raised', async (req, res) => {
  try {
    const auctionQuery = 'SELECT COALESCE(SUM(highest_bid), 0) AS auction_total FROM auction_results';
    const purchaseQuery = 'SELECT COALESCE(SUM(price), 0) AS purchase_total FROM purchases';

    const auctionResult = await pool.query(auctionQuery);
    const purchaseResult = await pool.query(purchaseQuery);

    const auctionTotalWei = auctionResult.rows[0].auction_total;
    const purchaseTotalWei = purchaseResult.rows[0].purchase_total;

    const totalWei = BigInt(auctionTotalWei) + BigInt(purchaseTotalWei);

    const totalPol = parseFloat(formatUnits(totalWei.toString(), 18)) / 10;

    res.json({ totalPolDividedBy10: totalPol });
  } catch (error) {
    console.error('Error calculating total sales:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;