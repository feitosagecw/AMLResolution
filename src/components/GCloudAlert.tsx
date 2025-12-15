import { useState, useEffect } from 'react'
import { AlertTriangle, Terminal, RefreshCw, CheckCircle2, Copy, X } from 'lucide-react'
import styles from './GCloudAlert.module.css'

interface GCloudStatus {
  authenticated: boolean
  message: string
}

export function GCloudAlert() {
  const [status, setStatus] = useState<GCloudStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const checkStatus = async () => {
    setChecking(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/status')
      const data = await response.json()
      setStatus(data)
      
      // Se autenticado, esconder o alerta
      if (data.authenticated) {
        setDismissed(true)
      }
    } catch (error) {
      setStatus({
        authenticated: false,
        message: 'Não foi possível conectar ao servidor backend'
      })
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const copyCommand = () => {
    navigator.clipboard.writeText('gcloud auth login && gcloud auth application-default login')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Não mostrar se loading, autenticado ou dismissado
  if (loading || status?.authenticated || dismissed) {
    return null
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={() => setDismissed(true)}>
          <X size={20} />
        </button>
        
        <div className={styles.iconWrapper}>
          <AlertTriangle size={48} className={styles.warningIcon} />
        </div>
        
        <h2>Autenticação do Google Cloud Necessária</h2>
        
        <p className={styles.description}>
          O backend não está autenticado com o Google Cloud. 
          As consultas ao BigQuery não funcionarão até que você autentique.
        </p>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>Abra o terminal</h4>
              <p>Abra um terminal no seu computador</p>
            </div>
          </div>
          
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>Execute os comandos</h4>
              <div className={styles.commandBox}>
                <code>gcloud auth login && gcloud auth application-default login</code>
                <button 
                  className={styles.copyBtn} 
                  onClick={copyCommand}
                  title="Copiar comando"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>Faça login no navegador</h4>
              <p>Uma janela do navegador abrirá para você fazer login com sua conta Google</p>
            </div>
          </div>
          
          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepContent}>
              <h4>Reinicie o servidor</h4>
              <p>Após autenticar, reinicie o servidor backend</p>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.checkBtn}
            onClick={checkStatus}
            disabled={checking}
          >
            <RefreshCw size={18} className={checking ? styles.spinning : ''} />
            {checking ? 'Verificando...' : 'Verificar Novamente'}
          </button>
          
          <button 
            className={styles.dismissBtn}
            onClick={() => setDismissed(true)}
          >
            Continuar sem autenticar
          </button>
        </div>

        <div className={styles.terminalHint}>
          <Terminal size={16} />
          <span>Dica: Você pode executar esses comandos no terminal integrado do VS Code</span>
        </div>
      </div>
    </div>
  )
}



