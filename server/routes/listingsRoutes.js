import express from 'express';
import { ethers } from 'ethers';
import sharp from 'sharp';
import pool from '../database/database.js';

const router = express.Router();

router.post("/api/listings", async (req, res) => {
    const { listingId, tokenId, price, seller, isSold } = req.body;
    try {
      const query = `
        INSERT INTO nft_listings (listingId, tokenId, price, seller, isSold)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (listingId) DO NOTHING;
      `;
      await pool.query(query, [listingId, tokenId, price, seller, isSold]);
      res.status(201).json({ message: "Listing added successfully" });
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });
  
 
  router.get("/api/listings", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM nft_listings");
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });
  

  router.get("/api/listings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM nft_listings WHERE listingId = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  router.get("/api/listings/unsold/:tokenId", async (req, res) => {
    const { tokenId } = req.params;
    try {
      const query = `
        SELECT * FROM nft_listings
        WHERE tokenId = $1 AND isSold = FALSE
      `;
      const result = await pool.query(query, [tokenId]);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching unsold listings:", error);
      res.status(500).json({ error: "Failed to fetch unsold listings" });
    }
  });
  

  router.delete("/api/listings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM nft_listings WHERE listingId = $1", [id]);
      res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

export default router;