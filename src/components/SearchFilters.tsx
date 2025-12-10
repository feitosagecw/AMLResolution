import { Search, Filter, X, ArrowUpDown } from 'lucide-react'
import type { CaseFilters, UserStatus, HighValue, SortField, SortOrder } from '../types/case'
import styles from './SearchFilters.module.css'

interface SearchFiltersProps {
  filters: CaseFilters
  onFiltersChange: (filters: CaseFilters) => void
  analysts: string[]
}

export function SearchFilters({ filters, onFiltersChange, analysts }: SearchFiltersProps) {
  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.high_value !== 'all' ||
    filters.analyst !== 'all'

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      high_value: 'all',
      analyst: 'all',
      days_range: null,
      sortBy: 'days_since_creation',
      sortOrder: 'desc'
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar por User ID..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <Filter size={16} />
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              status: e.target.value as UserStatus | 'all' 
            })}
            className={styles.select}
          >
            <option value="all">Todos os Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <select
          value={filters.high_value}
          onChange={(e) => onFiltersChange({ 
            ...filters, 
            high_value: e.target.value as HighValue | 'all' 
          })}
          className={styles.select}
        >
          <option value="all">Todos os Valores</option>
          <option value="yes">Alto Valor</option>
          <option value="no">Valor Normal</option>
        </select>

        <select
          value={filters.analyst}
          onChange={(e) => onFiltersChange({ ...filters, analyst: e.target.value })}
          className={styles.select}
        >
          <option value="all">Todos os Analistas</option>
          {analysts.map((analyst) => (
            <option key={analyst} value={analyst}>{analyst}</option>
          ))}
        </select>

        <div className={styles.sortGroup}>
          <ArrowUpDown size={16} />
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              sortBy: e.target.value as SortField 
            })}
            className={styles.select}
          >
            <option value="days_since_creation">Dias Pendente</option>
            <option value="created_at">Data Criação</option>
            <option value="user_id">User ID</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              sortOrder: e.target.value as SortOrder 
            })}
            className={styles.selectSmall}
          >
            <option value="desc">Maior → Menor</option>
            <option value="asc">Menor → Maior</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className={styles.clearBtn}>
            <X size={14} />
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}


