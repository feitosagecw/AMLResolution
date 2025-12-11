import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { casesRouter, preloadCache } from './routes/cases.js';
import { resolutionRouter } from './routes/resolution.js';
import { ensureAuthenticated, getAuthStatus } from './config/bigquery.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Health check com status de autenticação
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    gcloud_authenticated: getAuthStatus()
  });
});

// Endpoint para verificar status da autenticação
app.get('/api/auth/status', async (_req, res) => {
  const isAuthenticated = getAuthStatus();
  res.json({
    authenticated: isAuthenticated,
    message: isAuthenticated 
      ? 'gcloud está autenticado' 
      : 'gcloud NÃO está autenticado. Execute: gcloud auth login && gcloud auth application-default login'
  });
});

// Rotas de casos
app.use('/api/cases', casesRouter);

// Rotas de resolução
app.use('/api/resolution', resolutionRouter);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Verificar autenticação do gcloud na inicialização
  console.log('🔐 Verificando autenticação do gcloud...');
  const isAuthenticated = await ensureAuthenticated();
  
  if (isAuthenticated) {
    console.log('✅ Autenticação verificada! Pré-carregando cache...');
    // Pré-carregar o cache de casos em background
    preloadCache();
  } else {
    console.error('');
    console.error('⚠️  ATENÇÃO: O servidor iniciou, mas as consultas ao BigQuery não funcionarão!');
    console.error('   Para autenticar, execute os comandos abaixo e reinicie o servidor:');
    console.error('');
    console.error('   gcloud auth login');
    console.error('   gcloud auth application-default login');
    console.error('');
  }
});

