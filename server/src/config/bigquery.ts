import { BigQuery } from '@google-cloud/bigquery';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Cliente BigQuery usando Application Default Credentials (ADC)
 * 
 * Para autenticar, rode no terminal:
 * gcloud auth application-default login
 * 
 * Isso vai abrir o navegador para você fazer login com sua conta Google
 * que tem acesso ao projeto infinitepay-monitoring
 */
export const bigquery = new BigQuery({
  projectId: 'infinitepay-monitoring',
});

// Estado de autenticação
let isAuthenticated = false;
let authCheckPromise: Promise<boolean> | null = null;

/**
 * Verifica se o gcloud está autenticado
 * Retorna true se autenticado, false caso contrário
 */
export async function checkGCloudAuth(): Promise<boolean> {
  try {
    // Verifica se consegue obter um token de acesso
    const { stdout } = await execAsync('gcloud auth print-access-token 2>/dev/null');
    const token = stdout.trim();
    
    if (token && token.length > 0) {
      // Também verifica a conta ativa
      const { stdout: accountOutput } = await execAsync('gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null');
      const account = accountOutput.trim();
      
      if (account) {
        console.log(`✅ gcloud autenticado como: ${account}`);
        isAuthenticated = true;
        return true;
      }
    }
    
    console.error('❌ gcloud não está autenticado!');
    console.error('   Execute: gcloud auth login');
    console.error('   E também: gcloud auth application-default login');
    isAuthenticated = false;
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação do gcloud:', error);
    console.error('   Certifique-se de que o gcloud CLI está instalado e autenticado.');
    console.error('   Execute: gcloud auth login');
    console.error('   E também: gcloud auth application-default login');
    isAuthenticated = false;
    return false;
  }
}

/**
 * Retorna o estado atual de autenticação
 */
export function getAuthStatus(): boolean {
  return isAuthenticated;
}

/**
 * Verifica autenticação na inicialização (singleton)
 */
export async function ensureAuthenticated(): Promise<boolean> {
  if (authCheckPromise) {
    return authCheckPromise;
  }
  
  authCheckPromise = checkGCloudAuth();
  return authCheckPromise;
}

export async function executeQuery<T>(query: string, params?: Record<string, unknown>): Promise<T[]> {
  // Verifica autenticação antes de executar
  if (!isAuthenticated) {
    const authOk = await checkGCloudAuth();
    if (!authOk) {
      throw new Error('gcloud não está autenticado. Execute: gcloud auth login && gcloud auth application-default login');
    }
  }

  try {
    const options: { query: string; params?: Record<string, unknown> } = { query };
    
    if (params) {
      options.params = params;
    }

    console.log('Executing BigQuery query...');
    const [rows] = await bigquery.query(options);
    console.log(`Query returned ${rows.length} rows`);
    
    return rows as T[];
  } catch (error) {
    // Se der erro de autenticação, marca como não autenticado
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('authentication') || errorMsg.includes('credentials') || errorMsg.includes('token')) {
      isAuthenticated = false;
      console.error('❌ Erro de autenticação no BigQuery. Execute: gcloud auth application-default login');
    }
    console.error('BigQuery error:', error);
    throw error;
  }
}
