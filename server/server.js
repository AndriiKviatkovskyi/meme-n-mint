import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mintRoutes from './routes/nftRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import likesRoutes from './routes/likesRoutes.js';
import pool from './database/database.js';

const app = express();
const PORT = 5000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

app.use('/', mintRoutes);
app.use('/', profileRoutes);
app.use('/', likesRoutes);

async function createNftTable() {
  try {
    const nftTable = `
      CREATE TABLE IF NOT EXISTS nfts (
          token_id INTEGER PRIMARY KEY,
          owner VARCHAR(255) NOT NULL,
          metadata TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE
      );
    `;
    await pool.query(nftTable);
    console.log('NFT table created or already exists.');

    const updateTrigger = `
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await pool.query(updateTrigger);
    console.log('Function update_updated_at created or replaced.');

    const nftUpdateTrigger = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_nfts_updated_at') THEN
          CREATE TRIGGER update_nfts_updated_at
          BEFORE UPDATE ON nfts
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at();
        END IF;
      END $$;
    `;

    await pool.query(nftUpdateTrigger);
    console.log('Trigger update_nfts_updated_at created or already exists.');
  } catch (error) {
    console.error('Error creating NFT table:', error);
  }
}

async function createUsernamesTable() {
  try {
    const usernamesTable = `
      CREATE TABLE IF NOT EXISTS wallets_usernames (
        wallet VARCHAR(255) PRIMARY KEY,
        username VARCHAR(50) UNIQUE
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

createNftTable();
createUsernamesTable();
createLikesTable();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
