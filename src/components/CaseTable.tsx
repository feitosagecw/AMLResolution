import { useNavigate, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react'
import type { AMLCase } from '../types/case'
import styles from './CaseTable.module.css'
import clsx from 'clsx'

interface CaseTableProps {
  cases: AMLCase[]
  loading?: boolean
}

export function CaseTable({ cases, loading }: CaseTableProps) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Função para navegar ao detalhe preservando os filtros atuais
  const goToCase = (userId: number) => {
    // Pega os query params atuais (filtros) da URL
    const currentFilters = location.search.replace('?', '')
    navigate(`/cases/${userId}`, { state: { fromFilters: currentFilters } })
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Carregando casos...</span>
      </div>
    )
  }

  if (cases.length === 0) {
    return (
      <div className={styles.empty}>
        <AlertTriangle size={48} />
        <h3>Nenhum caso encontrado</h3>
        <p>Tente ajustar os filtros de busca</p>
      </div>
    )
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Data Criação</th>
            <th>Analista</th>
            <th>Dias Pendente</th>
            <th>Status</th>
            <th>Alto Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((caseItem, index) => (
            <tr 
              key={caseItem.user_id}
              className={styles.row}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <td>
                <span className={clsx(styles.userId, 'mono')}>
                  {caseItem.user_id}
                </span>
              </td>
              <td>
                <span className={styles.date}>
                  {format(new Date(caseItem.created_at), "dd MMM yyyy", { locale: ptBR })}
                </span>
                <span className={styles.time}>
                  {format(new Date(caseItem.created_at), "HH:mm", { locale: ptBR })}
                </span>
              </td>
              <td>
                <span className={styles.analyst}>{caseItem.analyst}</span>
              </td>
              <td>
                <span className={clsx(
                  styles.days,
                  caseItem.days_since_creation > 30 && styles.daysWarning,
                  caseItem.days_since_creation > 60 && styles.daysDanger
                )}>
                  {caseItem.days_since_creation} dias
                </span>
              </td>
              <td>
                <div className={styles.statusCell}>
                  <span className={clsx(styles.status, styles[caseItem.status])}>
                    {caseItem.status === 'blocked' && <ShieldAlert size={12} />}
                    {caseItem.status}
                  </span>
                  {caseItem.status === 'blocked' && caseItem.status_reason && (
                    <span className={styles.statusReason} title={caseItem.status_reason}>
                      {caseItem.status_reason}
                    </span>
                  )}
                </div>
              </td>
              <td>
                {caseItem.high_value === 'yes' ? (
                  <span className={styles.highValue}>
                    <TrendingUp size={14} />
                    Alto Valor
                  </span>
                ) : (
                  <span className={styles.normalValue}>Normal</span>
                )}
              </td>
              <td>
                <button 
                  className={styles.actionBtn}
                  onClick={() => goToCase(caseItem.user_id)}
                  title="Ver detalhes"
                >
                  <Eye size={18} />
                  <span>Analisar</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


