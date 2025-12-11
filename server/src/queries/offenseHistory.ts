/**
 * Query para buscar histórico de offenses do usuário
 * 
 * Retorna todas as análises de offenses do usuário:
 * - Data da offense (formato padronizado YYYY-MM-DD)
 * - Conclusão (normal, suspicious)
 * - Prioridade
 * - Descrição
 * - Analista responsável
 * - Nome da offense
 * 
 * Parâmetros:
 * - @userId: ID do usuário a ser consultado
 * 
 * Nota: A data é convertida para formato padronizado ISO para ordenação correta
 */
export const OFFENSE_HISTORY_QUERY = `
SELECT
  CASE 
    WHEN SAFE.PARSE_DATE('%d-%m-%Y', date) IS NOT NULL 
      THEN FORMAT_DATE('%Y-%m-%d', SAFE.PARSE_DATE('%d-%m-%Y', date))
    WHEN SAFE.PARSE_DATE('%d/%m/%Y', SPLIT(date, ' ')[OFFSET(0)]) IS NOT NULL 
      THEN FORMAT_DATE('%Y-%m-%d', SAFE.PARSE_DATE('%d/%m/%Y', SPLIT(date, ' ')[OFFSET(0)]))
    WHEN SAFE.PARSE_DATE('%Y-%m-%d', SPLIT(date, ' ')[OFFSET(0)]) IS NOT NULL 
      THEN SPLIT(date, ' ')[OFFSET(0)]
    ELSE date
  END AS data_offense,
  date AS data_offense_original,
  conclusion,
  priority,
  description,
  analyst,
  name AS offense_name
FROM \`infinitepay-production.metrics_amlft.lavandowski_offense_analysis_data\`
WHERE user_id = @userId
AND analysis_type IN ("manual", "automatic")
ORDER BY 
  CASE 
    WHEN SAFE.PARSE_DATE('%d-%m-%Y', date) IS NOT NULL 
      THEN SAFE.PARSE_DATE('%d-%m-%Y', date)
    WHEN SAFE.PARSE_DATE('%d/%m/%Y', SPLIT(date, ' ')[OFFSET(0)]) IS NOT NULL 
      THEN SAFE.PARSE_DATE('%d/%m/%Y', SPLIT(date, ' ')[OFFSET(0)])
    WHEN SAFE.PARSE_DATE('%Y-%m-%d', SPLIT(date, ' ')[OFFSET(0)]) IS NOT NULL 
      THEN SAFE.PARSE_DATE('%Y-%m-%d', SPLIT(date, ' ')[OFFSET(0)])
    ELSE CURRENT_DATE()
  END DESC
`;

