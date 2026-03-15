import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { env } from './config/env.js';
import partnershipsRouter from './routes/partnerships.js';
import datesRouter from './routes/dates.js';
import weatherRouter from './routes/weather.js';
import savedDatesRouter from './routes/saved-dates.js';

dotenv.config();

const app = express();

app.use(cors({ origin: env?.FRONTEND_URL ?? true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/partnerships', partnershipsRouter);
app.use('/api/dates', datesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/saved-dates', savedDatesRouter);

const PORT = env?.PORT ?? process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
