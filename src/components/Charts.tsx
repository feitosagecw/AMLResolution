import { useState } from 'react'
import styles from './Charts.module.css'

interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  title: string
  data: BarChartData[]
  maxItems?: number
  selectedLabel?: string | null
  onSelect?: (label: string | null) => void
}

const ITEMS_PER_PAGE = 7

export function BarChart({ title, data, maxItems, selectedLabel, onSelect }: BarChartProps) {
  const sortedData = maxItems !== undefined
    ? [...data].sort((a, b) => b.value - a.value).slice(0, maxItems)
    : [...data].sort((a, b) => b.value - a.value)
  
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(0)
  
  const startIndex = currentPage * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPageData = sortedData.slice(startIndex, endIndex)
  
  const maxValue = Math.max(...sortedData.map(d => d.value), 1)
  const isInteractive = !!onSelect

  const handleClick = (label: string) => {
    if (!onSelect) return
    // Toggle: se já está selecionado, deseleciona
    onSelect(selectedLabel === label ? null : label)
  }

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page)
    }
  }

  const goToPrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {selectedLabel && onSelect && (
          <button className={styles.clearFilterBtn} onClick={() => onSelect(null)}>
            ✕ Limpar filtro
          </button>
        )}
      </div>
      {isInteractive && (
        <p className={styles.chartHint}>Clique em um alerta para filtrar o gráfico de linha</p>
      )}
      <div className={styles.barChart}>
        {currentPageData.map((item, index) => {
          const isSelected = selectedLabel === item.label
          const isDimmed = selectedLabel && !isSelected
          
          return (
            <div 
              key={item.label} 
              className={`${styles.barRow} ${isInteractive ? styles.barRowClickable : ''} ${isSelected ? styles.barRowSelected : ''} ${isDimmed ? styles.barRowDimmed : ''}`}
              onClick={() => handleClick(item.label)}
            >
              <span className={styles.barLabel} title={item.label}>
                {isSelected && <span className={styles.selectedIndicator}>●</span>}
                {item.label}
              </span>
              <div className={styles.barTrack}>
                <div 
                  className={`${styles.barFill} ${isSelected ? styles.barFillSelected : ''}`}
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    animationDelay: `${index * 50}ms`
                  }}
                />
              </div>
              <span className={styles.barValue}>{item.value}</span>
            </div>
          )
        })}
      </div>
      
      {totalPages > 1 && (
        <div className={styles.carouselControls}>
          <button 
            className={styles.carouselBtn}
            onClick={goToPrevious}
            disabled={currentPage === 0}
            aria-label="Página anterior"
          >
            ‹
          </button>
          <div className={styles.carouselDots}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`${styles.carouselDot} ${currentPage === index ? styles.carouselDotActive : ''}`}
                onClick={() => goToPage(index)}
                aria-label={`Ir para página ${index + 1}`}
              />
            ))}
          </div>
          <button 
            className={styles.carouselBtn}
            onClick={goToNext}
            disabled={currentPage === totalPages - 1}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

interface DonutChartProps {
  title: string
  data: { label: string; value: number; color: string }[]
}

export function DonutChart({ title, data }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0)
  
  // Calcular os ângulos para o gradiente cônico
  let currentAngle = 0
  const segments = data.map(item => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0
    const startAngle = currentAngle
    currentAngle += percentage * 3.6 // 360 / 100 = 3.6
    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle
    }
  })

  const gradientStops = segments.map(seg => 
    `${seg.color} ${seg.startAngle}deg ${seg.endAngle}deg`
  ).join(', ')

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.donutContainer}>
        <div 
          className={styles.donutChart}
          style={{
            background: total > 0 
              ? `conic-gradient(${gradientStops})`
              : 'var(--bg-tertiary)'
          }}
        >
          <div className={styles.donutHole}>
            <span className={styles.donutTotal}>{total}</span>
            <span className={styles.donutLabel}>total</span>
          </div>
        </div>
        <div className={styles.donutLegend}>
          {segments.map(item => (
            <div key={item.label} className={styles.legendItem}>
              <span 
                className={styles.legendColor} 
                style={{ backgroundColor: item.color }}
              />
              <span className={styles.legendLabel}>{item.label}</span>
              <span className={styles.legendValue}>
                {item.value} ({item.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Gráfico de Linha
interface LineChartData {
  date: string
  value: number
}

interface LineChartProps {
  title: string
  data: LineChartData[]
  filterLabel?: string | null
}

export function LineChart({ title, data, filterLabel }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>{title}</h3>
        <div className={styles.emptyChart}>
          {filterLabel 
            ? `Nenhum dado encontrado para "${filterLabel}"`
            : 'Sem dados disponíveis'
          }
        </div>
      </div>
    )
  }

  const values = data.map(d => d.value)
  const total = values.reduce((acc, v) => acc + v, 0)
  const avg = Math.round(total / data.length)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)

  return (
    <div className={styles.lineChartCard}>
      <div className={styles.lineChartHeader}>
        <div className={styles.lineChartTitleArea}>
          <h3 className={styles.chartTitle}>{title}</h3>
          {filterLabel && (
            <span className={styles.activeFilterBadge}>
              Filtrando: <strong>{filterLabel}</strong>
            </span>
          )}
        </div>
        <div className={styles.lineChartStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{avg}</span>
            <span className={styles.statLabel}>Média</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{maxValue}</span>
            <span className={styles.statLabel}>Máx</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{minValue}</span>
            <span className={styles.statLabel}>Mín</span>
          </div>
        </div>
      </div>
      
      <div className={styles.lineChartContainer}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          const isMax = item.value === maxValue
          const isMin = item.value === minValue && minValue !== maxValue
          
          return (
            <div key={index} className={styles.lineBarWrapper}>
              <div className={styles.lineBarContainer}>
                <div 
                  className={`${styles.lineBar} ${isMax ? styles.lineBarMax : ''} ${isMin ? styles.lineBarMin : ''}`}
                  style={{ height: `${Math.max(barHeight, 5)}%` }}
                >
                  <span className={styles.lineBarValue}>{item.value}</span>
                </div>
              </div>
              <span className={styles.lineBarLabel}>{item.date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface StatsByStatusProps {
  title: string
  data: { status: string; count: number }[]
}

export function StatusChart({ title, data }: StatsByStatusProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0)
  
  const statusColors: Record<string, string> = {
    active: 'var(--status-active)',
    blocked: 'var(--status-blocked)',
    pending: 'var(--status-pending)',
    suspended: 'var(--status-suspended)',
    inactive: 'var(--status-inactive)',
  }

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.statusGrid}>
        {data.map(item => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={item.status} className={styles.statusItem}>
              <div className={styles.statusHeader}>
                <span 
                  className={styles.statusDot}
                  style={{ backgroundColor: statusColors[item.status] || 'var(--text-muted)' }}
                />
                <span className={styles.statusName}>{item.status}</span>
              </div>
              <div className={styles.statusBar}>
                <div 
                  className={styles.statusFill}
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: statusColors[item.status] || 'var(--text-muted)'
                  }}
                />
              </div>
              <div className={styles.statusValues}>
                <span className={styles.statusCount}>{item.count}</span>
                <span className={styles.statusPercent}>{percentage.toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


