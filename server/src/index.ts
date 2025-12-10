import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { casesRouter, preloadCache } from './routes/cases.js';
import { resolutionRouter } from './routes/resolution.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas de casos
app.use('/api/cases', casesRouter);

// Rotas de resolução
app.use('/api/resolution', resolutionRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Pré-carregar o cache de casos em background
  preloadCache();
});

