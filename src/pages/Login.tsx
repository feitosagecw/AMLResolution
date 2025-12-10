import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './Login.module.css'

export function Login() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const email = inputRef.current?.value.trim() || ''

    if (!email) {
      setError('Digite seu email')
      return
    }

    if (!email.includes('@')) {
      setError('Email inválido')
      return
    }

    setIsLoading(true)

    try {
      // Verificar se o backend está acessível
      const response = await fetch('http://localhost:3001/health')
      if (!response.ok) {
        throw new Error('Backend não está respondendo')
      }

      await login(email)
      navigate('/')
    } catch {
      setError('Erro ao conectar. Verifique se o servidor está rodando.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern} />
      
      <div className={styles.card}>
        <div className={styles.logo}>
          <Shield size={48} className={styles.logoIcon} />
          <h1>AML<span>Resolution</span></h1>
        </div>

        <p className={styles.subtitle}>
          Plataforma de Resolução de Casos Anti-Lavagem de Dinheiro
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email corporativo</label>
            <input
              ref={inputRef}
              id="email"
              type="email"
              name="email"
              placeholder="seu.nome@infinitepay.io"
              className={styles.input}
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              <LogIn size={20} />
            )}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Acesso restrito a analistas autorizados</p>
        </div>
      </div>
    </div>
  )
}
