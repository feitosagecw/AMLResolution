import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  ArrowRight,
  FileSearch,
  RefreshCw
} from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { CaseTable } from '../components/CaseTable'
import { BarChart, DonutChart, StatusChart, LineChart } from '../components/Charts'
import { useCasesContext } from '../contexts/CasesContext'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const { cases, loading, error, cached, cacheAge, refresh } = useCasesContext()

  const stats = useMemo(() => {
    if (cases.length === 0) return null
    
    return {
      total: cases.length,
      pending: cases.filter(c => c.resolution_status === 'pending').length,
      in_review: cases.filter(c => c.resolution_status === 'in_review').length,
      resolved: cases.filter(c => 
        c.resolution_status === 'resolved_suspicious' || 
        c.resolution_status === 'resolved_clean'
      ).length,
      high_value_count: cases.filter(c => c.high_value === 'yes').length,
      avg_days_pending: Math.round(
        cases.reduce((acc, c) => acc + c.days_since_creation, 0) / cases.length
      )
    }
  }, [cases])

  // Dados para gráfico de analistas
  const analystData = useMemo(() => {
    const counts: Record<string, number> = {}
    cases.forEach(c => {
      counts[c.analyst] = (counts[c.analyst] || 0) + 1
    })
    return Object.entries(counts).map(([label, value]) => ({ label, value }))
  }, [cases])

  // Dados para gráfico de alto valor
  const highValueData = useMemo(() => {
    const highValue = cases.filter(c => c.high_value === 'yes').length
    const normal = cases.filter(c => c.high_value === 'no').length
    return [
      { label: 'Alto Valor', value: highValue, color: '#ff4466' },
      { label: 'Normal', value: normal, color: '#00d4ff' },
    ]
  }, [cases])

  // Dados para gráfico de status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    cases.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  }, [cases])

  // Dados para gráfico de linha (alertas por data)
  const alertsByDateData = useMemo(() => {
    const counts: Record<string, number> = {}
    cases.forEach(c => {
      // Extrair apenas a data (sem hora)
      const date = c.created_at ? c.created_at.split('T')[0] : null
      if (date) {
        counts[date] = (counts[date] || 0) + 1
      }
    })
    
    // Ordenar por data e pegar os últimos 15 dias com dados
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15)
      .map(([date, value]) => {
        // Formatar data para exibição (DD/MM)
        const [year, month, day] = date.split('-')
        return {
          date: `${day}/${month}`,
          value
        }
      })
  }, [cases])

  const recentCases = useMemo(() => cases.slice(0, 5), [cases])
  
  const highPriorityCases = useMemo(() => 
    cases
      .filter(c => c.high_value === 'yes' || c.days_since_creation > 45)
      .slice(0, 5),
    [cases]
  )

  const formatCacheAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}min`
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertTriangle size={48} />
        <h2>Erro ao carregar dados</h2>
        <p>{error}</p>
        <p className={styles.hint}>Verifique se o servidor backend está rodando em http://localhost:3001</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.backgroundPattern} />
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div>
            <h1>Dashboard</h1>
            <p>Visão geral dos casos de AML pendentes de resolução</p>
          </div>
          <div className={styles.headerActions}>
            {cached && (
              <span className={styles.cacheInfo}>
                <Clock size={14} />
                Cache: {formatCacheAge(cacheAge)}
              </span>
            )}
            <button 
              onClick={refresh} 
              className={styles.refreshBtn}
              disabled={loading}
              title="Atualizar dados do BigQuery"
            >
              <RefreshCw size={18} className={loading ? styles.spinning : ''} />
              Atualizar
            </button>
            <Link to="/" className={styles.viewAllBtn}>
              <FileSearch size={18} />
              Ver Todos os Casos
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <div className={styles.statsGrid}>
          <StatCard
            title="Total de Casos"
            value={loading ? '...' : stats?.total ?? 0}
            icon={<AlertTriangle size={20} />}
            variant="info"
          />
          <StatCard
            title="Alto Valor"
            value={loading ? '...' : stats?.high_value_count ?? 0}
            icon={<TrendingUp size={20} />}
            variant="danger"
          />
        </div>

        {/* Gráficos */}
        {cases.length > 0 && (
          <div className={styles.chartsGrid}>
            <BarChart 
              title="📊 Casos por Analista" 
              data={analystData}
              maxItems={8}
            />
            <DonutChart 
              title="💰 Distribuição por Valor" 
              data={highValueData}
            />
            <StatusChart 
              title="📋 Status dos Usuários" 
              data={statusData}
            />
          </div>
        )}

        {/* Gráfico de Linha - Alertas por Data */}
        {cases.length > 0 && alertsByDateData.length > 0 && (
          <div className={styles.lineChartSection}>
            <LineChart 
              title="📈 Alertas por Data de Criação" 
              data={alertsByDateData}
            />
          </div>
        )}

        <div className={styles.sections}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>🔥 Alta Prioridade</h2>
              <span className={styles.badge}>{highPriorityCases.length} casos</span>
            </div>
            <p className={styles.sectionDesc}>
              Casos com alto valor ou pendentes há mais de 45 dias
            </p>
            <CaseTable cases={highPriorityCases} loading={loading} />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>📋 Casos Recentes</h2>
              <Link to="/" className={styles.sectionLink}>
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <p className={styles.sectionDesc}>
              Últimos casos criados no sistema
            </p>
            <CaseTable cases={recentCases} loading={loading} />
          </section>
        </div>

        {stats && (
          <div className={styles.avgDays}>
            <div className={styles.avgDaysContent}>
              <Clock size={24} />
              <div>
                <span className={styles.avgDaysValue}>{stats.avg_days_pending} dias</span>
                <span className={styles.avgDaysLabel}>tempo médio de pendência</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
