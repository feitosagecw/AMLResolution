import type { ReactNode } from 'react'
import styles from './StatCard.module.css'
import clsx from 'clsx'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  trend?: {
    value: number
    label: string
  }
}

export function StatCard({ title, value, icon, variant = 'default', trend }: StatCardProps) {
  return (
    <div className={clsx(styles.card, styles[variant])}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.icon}>{icon}</div>
      </div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <div className={clsx(styles.trend, trend.value >= 0 ? styles.trendUp : styles.trendDown)}>
          <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
          <span className={styles.trendLabel}>{trend.label}</span>
        </div>
      )}
    </div>
  )
}




