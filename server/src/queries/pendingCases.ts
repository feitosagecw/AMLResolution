/**
 * Query para buscar casos pendentes de resolução AML
 * 
 * Retorna todos os casos que:
 * - São do tipo money_laundering
 * - Foram marcados como suspicious
 * - Têm prioridade low
 * - Não são do tenant 2
 * - São a análise mais recente do usuário
 */
export const PENDING_CASES_QUERY = `
WITH SelectedUsers AS (
  SELECT DISTINCT
    an.user_id,
    an.created_at,
    INITCAP(
      REPLACE(
        REPLACE(SPLIT(u.email, '@')[OFFSET(0)], '_', ' '),
        '.', ' '
      )
    ) AS analyst,
    DATE_DIFF(CURRENT_DATE(), DATE(an.created_at), DAY) AS days_since_creation,
    u.status
  FROM \`infinitepay-production.maindb.offense_analyses\` an
  JOIN \`infinitepay-production.maindb.users\` u
    ON u.id = an.analyst_id
  JOIN \`infinitepay-production.maindb.offenses\` o
    ON o.id = an.offense_id
  LEFT JOIN \`infinitepay-production.maindb.offense_actions\` act
    ON act.offense_analysis_id = an.id
  WHERE
    o.name = 'money_laundering'
    AND an.tenant_id <> 2
    AND an.conclusion = 'suspicious'
    AND an.priority = 'low'
    AND (
      (an.automatic_pipeline = FALSE)
      OR
      (an.automatic_pipeline = TRUE AND an.analyst_id IN (38445329, 38608296))
    )
    AND NOT EXISTS (
      SELECT 1
      FROM \`infinitepay-production.maindb.offense_analyses\` an2
      JOIN \`infinitepay-production.maindb.offenses\` o2
        ON o2.id = an2.offense_id
      WHERE
        an2.user_id = an.user_id
        AND o2.name = 'money_laundering'
        AND an2.created_at > an.created_at
    )
),

TransactionSums AS (
  SELECT
    t.merchant_id AS user_id,
    SUM(t.amount) AS TransactionTotalAmount
  FROM \`infinitepay-production.maindb.transactions\` t
  WHERE t.status = 'approved'
  GROUP BY t.merchant_id
),

TransactionSums90 AS (
  SELECT
    t.merchant_id AS user_id,
    SUM(t.amount) AS TransactionTotalAmount90
  FROM \`infinitepay-production.maindb.transactions\` t
  WHERE
    t.status = 'approved'
    AND t.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
  GROUP BY t.merchant_id
)

SELECT
  su.user_id,
  su.created_at,
  su.analyst,
  su.days_since_creation,
  su.status,
  CASE
    WHEN COALESCE(ts90.TransactionTotalAmount90, 0) >= 500000
      OR COALESCE(ts.TransactionTotalAmount,   0) >= 1500000
    THEN 'yes'
    ELSE 'no'
  END AS high_value
FROM SelectedUsers su
LEFT JOIN TransactionSums   ts   ON ts.user_id   = su.user_id
LEFT JOIN TransactionSums90 ts90 ON ts90.user_id = su.user_id
ORDER BY su.created_at DESC
`;

/**
 * Query para buscar um caso específico por user_id
 */
export const CASE_BY_USER_ID_QUERY = `
WITH UserCase AS (
  SELECT DISTINCT
    an.user_id,
    an.created_at,
    INITCAP(
      REPLACE(
        REPLACE(SPLIT(u.email, '@')[OFFSET(0)], '_', ' '),
        '.', ' '
      )
    ) AS analyst,
    DATE_DIFF(CURRENT_DATE(), DATE(an.created_at), DAY) AS days_since_creation,
    u.status
  FROM \`infinitepay-production.maindb.offense_analyses\` an
  JOIN \`infinitepay-production.maindb.users\` u
    ON u.id = an.analyst_id
  JOIN \`infinitepay-production.maindb.offenses\` o
    ON o.id = an.offense_id
  WHERE
    an.user_id = @userId
    AND o.name = 'money_laundering'
    AND an.tenant_id <> 2
    AND an.conclusion = 'suspicious'
    AND an.priority = 'low'
  ORDER BY an.created_at DESC
  LIMIT 1
),

TransactionSums AS (
  SELECT
    t.merchant_id AS user_id,
    SUM(t.amount) AS TransactionTotalAmount
  FROM \`infinitepay-production.maindb.transactions\` t
  WHERE t.merchant_id = @userId AND t.status = 'approved'
  GROUP BY t.merchant_id
),

TransactionSums90 AS (
  SELECT
    t.merchant_id AS user_id,
    SUM(t.amount) AS TransactionTotalAmount90
  FROM \`infinitepay-production.maindb.transactions\` t
  WHERE
    t.merchant_id = @userId
    AND t.status = 'approved'
    AND t.created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
  GROUP BY t.merchant_id
)

SELECT
  uc.user_id,
  uc.created_at,
  uc.analyst,
  uc.days_since_creation,
  uc.status,
  CASE
    WHEN COALESCE(ts90.TransactionTotalAmount90, 0) >= 500000
      OR COALESCE(ts.TransactionTotalAmount,   0) >= 1500000
    THEN 'yes'
    ELSE 'no'
  END AS high_value
FROM UserCase uc
LEFT JOIN TransactionSums   ts   ON ts.user_id   = uc.user_id
LEFT JOIN TransactionSums90 ts90 ON ts90.user_id = uc.user_id
`;


