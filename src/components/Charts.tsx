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
}

export function BarChart({ title, data, maxItems = 8 }: BarChartProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, maxItems)
  const maxValue = Math.max(...sortedData.map(d => d.value), 1)

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.barChart}>
        {sortedData.map((item, index) => (
          <div key={item.label} className={styles.barRow}>
            <span className={styles.barLabel} title={item.label}>
              {item.label}
            </span>
            <div className={styles.barTrack}>
              <div 
                className={styles.barFill}
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  animationDelay: `${index * 50}ms`
                }}
              />
            </div>
            <span className={styles.barValue}>{item.value}</span>
          </div>
        ))}
      </div>
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
}

export function LineChart({ title, data }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>{title}</h3>
        <div className={styles.emptyChart}>Sem dados disponíveis</div>
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
        <h3 className={styles.chartTitle}>{title}</h3>
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


