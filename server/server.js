import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mintRoutes from './routes/nftRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import likesRoutes from './routes/likesRoutes.js';
import listingsRoutes from './routes/listingsRoutes.js';
import pool from './database/database.js';

const app = express();
const PORT = 5000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

app.use('/', mintRoutes);
app.use('/', profileRoutes);
app.use('/', likesRoutes);
app.use('/', listingsRoutes);

async function createUsernamesTable() {
  try {
    const usernamesTable = `
      CREATE TABLE IF NOT EXISTS wallets_usernames (
        wallet VARCHAR(255) PRIMARY KEY,
        username VARCHAR(100) UNIQUE
      );
    `;
    await pool.query(usernamesTable);
    console.log('Usernames table created or already exists.');
  } catch (error) {
    console.error('Error creating usernames table:', error);
  }
}

async function createLikesTable() {
  try {
    const likesTable = `
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        nft_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, nft_id)
      );
    `;
    await pool.query(likesTable);
    console.log('Likes table created or already exists.');
  } catch (error) {
    console.error('Error creating usernames table:', error);
  }
}

async function createMintedTokensTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS minted_tokens (
        token_id BIGINT PRIMARY KEY,
        token_uri TEXT,
        marketplace_address VARCHAR(255),
        minter VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('minted_tokens table ready.');
  } catch (error) {
    console.error('Error creating minted_tokens table:', error);
  }
}

async function createListingsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS listings (
        listing_id BIGINT PRIMARY KEY,
        nft_contract VARCHAR(255),
        token_id BIGINT,
        price NUMERIC,
        seller VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('listings table ready.');
  } catch (error) {
    console.error('Error creating listings table:', error);
  }
}

async function createPurchasesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        listing_id BIGINT PRIMARY KEY,
        nft_contract VARCHAR(255),
        token_id BIGINT,
        price NUMERIC,
        buyer VARCHAR(255),
        seller VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('purchases table ready.');
  } catch (error) {
    console.error('Error creating purchases table:', error);
  }
}

async function createCancellationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cancellations (
        listing_id BIGINT PRIMARY KEY,
        nft_contract VARCHAR(255),
        token_id BIGINT,
        seller VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('cancellations table ready.');
  } catch (error) {
    console.error('Error creating cancellations table:', error);
  }
}

createUsernamesTable();
createLikesTable();
createMintedTokensTable();
createListingsTable();
createPurchasesTable();
createCancellationsTable();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
