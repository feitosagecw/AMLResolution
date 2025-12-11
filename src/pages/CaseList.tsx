import { useState, useMemo } from 'react'
import { FileSearch, AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import { SearchFilters } from '../components/SearchFilters'
import { CaseTable } from '../components/CaseTable'
import { useCasesContext } from '../contexts/CasesContext'
import { getUniqueAnalysts } from '../services/casesService'
import type { CaseFilters } from '../types/case'
import styles from './CaseList.module.css'

export function CaseList() {
  const { cases, loading, error, cached, cacheAge, refresh } = useCasesContext()
  
  const [filters, setFilters] = useState<CaseFilters>({
    search: '',
    status: 'all',
    high_value: 'all',
    analyst: 'all',
    days_range: null,
    sortBy: 'days_since_creation',
    sortOrder: 'desc'
  })

  const analysts = useMemo(() => getUniqueAnalysts(cases), [cases])

  const filteredCases = useMemo(() => {
    // Primeiro filtra
    const filtered = cases.filter((caseItem) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (!caseItem.user_id.toString().includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all' && caseItem.status !== filters.status) {
        return false
      }

      // High value filter
      if (filters.high_value !== 'all' && caseItem.high_value !== filters.high_value) {
        return false
      }

      // Analyst filter
      if (filters.analyst !== 'all' && caseItem.analyst !== filters.analyst) {
        return false
      }

      return true
    })

    // Depois ordena
    return filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'days_since_creation':
          comparison = a.days_since_creation - b.days_since_creation
          break
        case 'user_id':
          comparison = a.user_id - b.user_id
          break
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison
    })
  }, [cases, filters])

  const formatCacheAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s atrás`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}min atrás`
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertTriangle size={48} />
        <h2>Erro ao carregar casos</h2>
        <p>{error}</p>
        <button onClick={refresh} className={styles.retryBtn}>
          <RefreshCw size={18} />
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <>
      <div className={styles.backgroundPattern} />
      <div className={styles.caseList}>
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <FileSearch size={28} />
          </div>
          <div className={styles.headerInfo}>
            <h1>Casos Pendentes</h1>
            <p>
              {loading 
                ? 'Carregando casos...'
                : `${filteredCases.length} caso${filteredCases.length !== 1 ? 's' : ''} encontrado${filteredCases.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <div className={styles.headerActions}>
            {cached && (
              <span className={styles.cacheInfo}>
                <Clock size={14} />
                Atualizado {formatCacheAge(cacheAge)}
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
          </div>
        </header>

        <SearchFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          analysts={analysts}
        />

        <CaseTable cases={filteredCases} loading={loading} />
      </div>
    </>
  )
}
