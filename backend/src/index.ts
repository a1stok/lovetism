import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { env } from './config/env.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = env?.PORT || process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
