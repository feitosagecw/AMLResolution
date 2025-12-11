import { Router } from 'express';
import { executeQuery } from '../config/bigquery.js';
import { PENDING_CASES_QUERY, CASE_BY_USER_ID_QUERY, USER_INFO_QUERY, OFFENSE_HISTORY_QUERY } from '../queries/index.js';

export const casesRouter = Router();

// ============================================
// CACHE EM MEMÓRIA
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let casesCache: CacheEntry<AMLCaseResponse[]> | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos
const CACHE_REFRESH_THRESHOLD_MS = 20 * 60 * 1000; // Refresh em background após 20 minutos
let isRefreshing = false; // Flag para evitar múltiplos refreshes simultâneos

interface AMLCase {
  user_id: number;
  created_at: { value: string };
  analyst: string;
  days_since_creation: number;
  status: string;
  high_value: string;
}

interface AMLCaseResponse {
  user_id: number;
  created_at: string;
  analyst: string;
  days_since_creation: number;
  status: string;
  high_value: 'yes' | 'no';
  resolution_status: 'pending';
}

function transformCase(row: AMLCase): AMLCaseResponse {
  return {
    user_id: row.user_id,
    created_at: row.created_at?.value || String(row.created_at),
    analyst: row.analyst,
    days_since_creation: row.days_since_creation,
    status: row.status,
    high_value: row.high_value as 'yes' | 'no',
    resolution_status: 'pending'
  };
}

function isCacheValid(): boolean {
  if (!casesCache) return false;
  return Date.now() - casesCache.timestamp < CACHE_TTL_MS;
}

function shouldRefreshInBackground(): boolean {
  if (!casesCache) return false;
  return Date.now() - casesCache.timestamp > CACHE_REFRESH_THRESHOLD_MS;
}

function getCacheAge(): number {
  if (!casesCache) return 0;
  return Math.floor((Date.now() - casesCache.timestamp) / 1000);
}

/**
 * Refresh em background - não bloqueia a resposta
 */
function triggerBackgroundRefresh(): void {
  if (isRefreshing) return;
  
  isRefreshing = true;
  console.log('🔄 Starting background refresh...');
  
  fetchCasesFromBigQuery()
    .then(() => {
      console.log('✅ Background refresh completed');
    })
    .catch((error) => {
      console.error('❌ Background refresh failed:', error);
    })
    .finally(() => {
      isRefreshing = false;
    });
}

/**
 * Pré-carrega o cache quando o servidor inicia
 * Chame isso depois do app.listen()
 */
export function preloadCache(): void {
  console.log('🚀 Preloading cases cache...');
  triggerBackgroundRefresh();
}

/**
 * Remove um caso do cache após resolução
 * @param userId - ID do usuário a ser removido
 * @returns true se o caso foi removido, false se não estava no cache
 */
export function removeCaseFromCache(userId: number): boolean {
  if (!casesCache) return false;
  
  const initialLength = casesCache.data.length;
  casesCache.data = casesCache.data.filter(c => c.user_id !== userId);
  
  const removed = casesCache.data.length < initialLength;
  if (removed) {
    console.log(`🗑️ Case ${userId} removed from cache. Remaining: ${casesCache.data.length} cases`);
  }
  
  return removed;
}

async function fetchCasesFromBigQuery(): Promise<AMLCaseResponse[]> {
  console.log('🔄 Fetching cases from BigQuery...');
  const startTime = Date.now();
  
  const rows = await executeQuery<AMLCase>(PENDING_CASES_QUERY);
  const cases = rows.map(transformCase);
  
  const duration = Date.now() - startTime;
  console.log(`✅ Query completed in ${duration}ms - ${cases.length} cases`);
  
  // Atualiza o cache
  casesCache = {
    data: cases,
    timestamp: Date.now()
  };
  
  return cases;
}

// ============================================
// ROTAS
// ============================================

/**
 * GET /api/cases
 * Retorna casos do cache ou busca do BigQuery
 * Query params:
 *   - refresh=true: força atualização do cache
 */
casesRouter.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    
    let cases: AMLCaseResponse[];
    let fromCache = false;
    
    if (!forceRefresh && isCacheValid()) {
      cases = casesCache!.data;
      fromCache = true;
      console.log(`📦 Returning ${cases.length} cached cases (age: ${getCacheAge()}s)`);
      
      // Trigger background refresh se cache está ficando antigo
      if (shouldRefreshInBackground()) {
        triggerBackgroundRefresh();
      }
    } else {
      cases = await fetchCasesFromBigQuery();
    }
    
    res.json({
      success: true,
      data: cases,
      count: cases.length,
      cached: fromCache,
      cacheAge: getCacheAge(),
      cachedAt: casesCache?.timestamp ? new Date(casesCache.timestamp).toISOString() : null
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cases',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/cases/refresh
 * Força atualização do cache
 */
casesRouter.post('/refresh', async (_req, res) => {
  try {
    const cases = await fetchCasesFromBigQuery();
    
    res.json({
      success: true,
      data: cases,
      count: cases.length,
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cases',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cases/stats
 * Retorna estatísticas dos casos (usa cache)
 */
casesRouter.get('/stats', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    
    let cases: AMLCaseResponse[];
    
    if (!forceRefresh && isCacheValid()) {
      cases = casesCache!.data;
    } else {
      cases = await fetchCasesFromBigQuery();
    }
    
    const stats = {
      total: cases.length,
      pending: cases.length,
      in_review: 0,
      resolved: 0,
      high_value_count: cases.filter(c => c.high_value === 'yes').length,
      avg_days_pending: cases.length > 0 
        ? Math.round(cases.reduce((acc, c) => acc + c.days_since_creation, 0) / cases.length)
        : 0
    };
    
    res.json({
      success: true,
      data: stats,
      cached: isCacheValid(),
      cacheAge: getCacheAge()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cases/:userId
 * Retorna um caso específico por user_id
 */
casesRouter.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user_id'
      });
    }

    // Primeiro tenta buscar do cache
    if (isCacheValid()) {
      const cachedCase = casesCache!.data.find(c => c.user_id === userId);
      if (cachedCase) {
        console.log(`📦 Returning cached case ${userId}`);
        return res.json({
          success: true,
          data: cachedCase,
          cached: true
        });
      }
    }

    // Se não encontrou no cache, busca do BigQuery
    const rows = await executeQuery<AMLCase>(CASE_BY_USER_ID_QUERY, { userId });
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    const caseData = transformCase(rows[0]);
    
    res.json({
      success: true,
      data: caseData,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch case',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// INFORMAÇÕES DO USUÁRIO
// ============================================

interface UserInfoRow {
  endereco: string | null;
  id_cliente: number;
  nome: string | null;
  merchant_name: string | null;
  email: string | null;
  idade: number | null;
  status: string | null;
  status_reason: string | null;
  role_type: string;
  categoria_negocio: string;
  document_number: string;
  created_at_ch: { value: string } | null;
  created_at_me: { value: string } | null;
  cidade: string | null;
  estado: string | null;
}

interface UserInfoResponse {
  endereco: string | null;
  id_cliente: number;
  nome: string | null;
  merchant_name: string | null;
  email: string | null;
  idade: number | null;
  status: string | null;
  status_reason: string | null;
  role_type: string;
  categoria_negocio: string;
  document_number: string;
  created_at_ch: string | null;
  created_at_me: string | null;
  cidade: string | null;
  estado: string | null;
}

function transformUserInfo(row: UserInfoRow): UserInfoResponse {
  return {
    endereco: row.endereco,
    id_cliente: row.id_cliente,
    nome: row.nome,
    merchant_name: row.merchant_name,
    email: row.email,
    idade: row.idade,
    status: row.status,
    status_reason: row.status_reason,
    role_type: row.role_type,
    categoria_negocio: row.categoria_negocio,
    document_number: row.document_number,
    created_at_ch: row.created_at_ch?.value || null,
    created_at_me: row.created_at_me?.value || null,
    cidade: row.cidade,
    estado: row.estado
  };
}

/**
 * GET /api/cases/:userId/user-info
 * Retorna informações detalhadas do usuário associado ao caso
 */
casesRouter.get('/:userId/user-info', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user_id'
      });
    }

    console.log(`🔍 Fetching user info for ${userId}...`);
    const startTime = Date.now();
    
    const rows = await executeQuery<UserInfoRow>(USER_INFO_QUERY, { userId });
    
    const duration = Date.now() - startTime;
    console.log(`✅ User info query completed in ${duration}ms`);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userInfo = transformUserInfo(rows[0]);
    
    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// HISTÓRICO DE OFFENSES
// ============================================

interface OffenseHistoryRow {
  data_offense: { value: string } | string;
  data_offense_original: string | null;
  conclusion: string | null;
  priority: string | null;
  description: string | null;
  analyst: string | null;
  offense_name: string | null;
}

interface OffenseHistoryResponse {
  data_offense: string;
  conclusion: string | null;
  priority: string | null;
  description: string | null;
  analyst: string | null;
  offense_name: string | null;
}

function transformOffenseHistory(row: OffenseHistoryRow): OffenseHistoryResponse {
  // Extrai a data padronizada (formato YYYY-MM-DD)
  const dateStr = typeof row.data_offense === 'object' && row.data_offense?.value 
    ? row.data_offense.value 
    : String(row.data_offense || '');
    
  return {
    data_offense: dateStr,
    conclusion: row.conclusion,
    priority: row.priority,
    description: row.description,
    analyst: row.analyst,
    offense_name: row.offense_name
  };
}

/**
 * GET /api/cases/:userId/offense-history
 * Retorna histórico de offenses do usuário
 */
casesRouter.get('/:userId/offense-history', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user_id'
      });
    }

    console.log(`📜 Fetching offense history for ${userId}...`);
    const startTime = Date.now();
    
    const rows = await executeQuery<OffenseHistoryRow>(OFFENSE_HISTORY_QUERY, { userId });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Offense history query completed in ${duration}ms - ${rows.length} records`);

    const history = rows.map(transformOffenseHistory);
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching offense history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offense history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
