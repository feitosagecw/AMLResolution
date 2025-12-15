import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { removeCaseFromCache } from './cases.js';

const execAsync = promisify(exec);

export const resolutionRouter = Router();

// URL da API de Risk
const RISK_API_URL = 'https://infinitepay-risk-api.services.production.cloudwalk.network/monitoring/offense_analysis';

interface ResolutionRequest {
  user_id: number;
  conclusion: 'normal' | 'suspicious' | 'offense';
  priority: 'low' | 'mid' | 'high';
  description: string;
}

interface OffenseAnalysisPayload {
  user_id: number;
  description: string;
  analysis_type: 'manual';
  conclusion: 'normal' | 'suspicious' | 'offense';
  priority: 'low' | 'mid' | 'high';
  automatic_pipeline: boolean;
  offense_group: 'illegal_activity';
  offense_name: 'money_laundering';
  related_analyses: never[];
}

/**
 * Obtém o token de autenticação do Google Cloud
 */
async function getGCloudToken(): Promise<string> {
  try {
    const { stdout } = await execAsync('gcloud auth print-access-token');
    return stdout.trim();
  } catch (error) {
    console.error('Error getting gcloud token:', error);
    throw new Error('Failed to get authentication token. Make sure gcloud is installed and authenticated.');
  }
}

/**
 * POST /api/resolution
 * Envia a resolução do caso para a API de Risk
 */
resolutionRouter.post('/', async (req, res) => {
  try {
    const { user_id, conclusion, priority, description } = req.body as ResolutionRequest;

    // Validações
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    if (!conclusion || !['normal', 'suspicious', 'offense'].includes(conclusion)) {
      return res.status(400).json({
        success: false,
        error: 'conclusion must be "normal", "suspicious", or "offense"'
      });
    }

    if (!priority || !['low', 'mid', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'priority must be "low", "mid", or "high"'
      });
    }

    // Validação adicional: suspicious não pode ter priority low
    if (conclusion === 'suspicious' && priority === 'low') {
      return res.status(400).json({
        success: false,
        error: 'suspicious conclusion cannot have low priority'
      });
    }

    console.log(`📤 Sending resolution for user ${user_id}: ${conclusion} (priority: ${priority})`);

    // Obter token do gcloud
    const token = await getGCloudToken();

    // Montar payload
    const payload: OffenseAnalysisPayload = {
      user_id,
      description: description || '',
      analysis_type: 'manual',
      conclusion,
      priority,
      automatic_pipeline: true,
      offense_group: 'illegal_activity',
      offense_name: 'money_laundering',
      related_analyses: []
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Enviar para a API de Risk
    const response = await fetch(RISK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`❌ Risk API error (${response.status}):`, responseData);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to send resolution to Risk API',
        details: responseData
      });
    }

    console.log(`✅ Resolution sent successfully for user ${user_id}`);

    // Remove o caso do cache para que não apareça mais na lista
    const removedFromCache = removeCaseFromCache(user_id);

    res.json({
      success: true,
      message: 'Resolution sent successfully',
      data: responseData,
      removedFromCache
    });

  } catch (error) {
    console.error('Error sending resolution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send resolution',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


