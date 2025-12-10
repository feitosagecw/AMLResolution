import { BigQuery } from '@google-cloud/bigquery';

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
  projectId: 'infinitepay-production',
});

export async function executeQuery<T>(query: string, params?: Record<string, unknown>): Promise<T[]> {
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
    console.error('BigQuery error:', error);
    throw error;
  }
}
