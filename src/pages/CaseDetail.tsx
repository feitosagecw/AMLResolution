import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Send,
  RefreshCw,
  Building2,
  Mail,
  MapPin,
  FileText,
  CreditCard
} from 'lucide-react'
import { useCaseDetail, useUserInfo } from '../hooks/useCases'
import { useCasesContext } from '../contexts/CasesContext'
import { sendResolution } from '../services/casesService'
import type { ResolutionType, ResolutionPriority } from '../types/case'
import styles from './CaseDetail.module.css'
import clsx from 'clsx'

export function CaseDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  
  const userIdNumber = userId ? parseInt(userId, 10) : undefined
  const { caseData, loading, error } = useCaseDetail(userIdNumber)
  const { userInfo, loading: userInfoLoading, error: userInfoError, refetch: refetchUserInfo } = useUserInfo(userIdNumber)
  const { removeCase } = useCasesContext()
  
  const [resolutionType, setResolutionType] = useState<ResolutionType | null>(null)
  const [resolutionPriority, setResolutionPriority] = useState<ResolutionPriority | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Prioridades disponíveis por tipo de resolução
  const availablePriorities: Record<ResolutionType, ResolutionPriority[]> = {
    normalize: ['low', 'mid', 'high'],
    suspicious: ['mid', 'high']
  }

  const handleTypeSelect = (type: ResolutionType) => {
    setResolutionType(type)
    // Limpar prioridade se mudar o tipo
    setResolutionPriority(null)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <RefreshCw size={32} className={styles.spinner} />
        <p>Carregando caso...</p>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className={styles.notFound}>
        <AlertTriangle size={48} />
        <h2>Caso não encontrado</h2>
        <p>{error || `O caso com ID ${userId} não foi encontrado no sistema.`}</p>
        <Link to="/cases" className={styles.backLink}>
          <ArrowLeft size={18} />
          Voltar para lista
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolutionType || !resolutionPriority || !caseData) return

    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      // Mapear tipo de resolução para conclusion da API
      const conclusion = resolutionType === 'normalize' ? 'normal' : 'suspicious';
      
      const response = await sendResolution({
        user_id: caseData.user_id,
        conclusion,
        priority: resolutionPriority,
        description: notes
      });

      if (response.success) {
        setSubmitSuccess(true)
        // Remove o caso do cache do frontend também
        removeCase(caseData.user_id)
        // Aguardar um pouco para mostrar a mensagem de sucesso
        setTimeout(() => {
          navigate('/cases')
        }, 1500)
      } else {
        setSubmitError(response.error || 'Erro ao enviar resolução')
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar resolução')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.caseDetail}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Caso #{caseData.user_id}</h1>
          <p>Análise e resolução do caso</p>
        </div>
        {caseData.high_value === 'yes' && (
          <span className={styles.highValueBadge}>
            <TrendingUp size={16} />
            Alto Valor
          </span>
        )}
      </header>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          {/* Info Cards */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <User size={20} />
              </div>
              <div>
                <span className={styles.infoLabel}>User ID</span>
                <span className={clsx(styles.infoValue, 'mono')}>{caseData.user_id}</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Calendar size={20} />
              </div>
              <div>
                <span className={styles.infoLabel}>Data Criação</span>
                <span className={styles.infoValue}>
                  {format(new Date(caseData.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Clock size={20} />
              </div>
              <div>
                <span className={styles.infoLabel}>Dias Pendente</span>
                <span className={clsx(
                  styles.infoValue,
                  caseData.days_since_creation > 30 && styles.warning,
                  caseData.days_since_creation > 60 && styles.danger
                )}>
                  {caseData.days_since_creation} dias
                </span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <User size={20} />
              </div>
              <div>
                <span className={styles.infoLabel}>Analista Original</span>
                <span className={styles.infoValue}>{caseData.analyst}</span>
              </div>
            </div>
          </div>

          {/* Status atual - baseado no userInfo */}
          <div className={styles.statusSection}>
            <h3>Status do Usuário</h3>
            <div className={styles.statusCard}>
              {userInfoLoading ? (
                <div className={styles.userInfoLoading}>
                  <RefreshCw size={16} className={styles.spinnerSmall} />
                  Carregando status...
                </div>
              ) : userInfo ? (
                <>
                  <span className={clsx(styles.statusBadge, styles[userInfo.status || 'pending'])}>
                    {userInfo.status || 'Desconhecido'}
                  </span>
                  {userInfo.status_reason && (
                    <p>
                      <strong>Motivo:</strong> {userInfo.status_reason}
                    </p>
                  )}
                </>
              ) : (
                <span className={clsx(styles.statusBadge, styles.pending)}>
                  Não disponível
                </span>
              )}
            </div>
          </div>

          {/* Informações do Usuário */}
          <div className={styles.userInfoSection}>
            <h3>
              <User size={18} />
              Informações do Cliente
              <button className={styles.refreshUserBtn} onClick={refetchUserInfo} disabled={userInfoLoading}>
                <RefreshCw size={12} className={userInfoLoading ? styles.spinnerSmall : ''} />
                Atualizar
              </button>
            </h3>

            <div className={styles.userInfoCard}>
              {userInfoLoading ? (
                <div className={styles.userInfoLoading}>
                  <RefreshCw size={16} className={styles.spinnerSmall} />
                  Carregando informações do usuário...
                </div>
              ) : userInfoError ? (
                <div className={styles.userInfoError}>
                  <AlertTriangle size={16} />
                  {userInfoError}
                </div>
              ) : userInfo ? (
                <>
                  <div className={styles.userInfoHeader}>
                    <div className={styles.userAvatar}>
                      {userInfo.nome ? userInfo.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className={styles.userMainInfo}>
                      <h4>{userInfo.nome || 'Nome não disponível'}</h4>
                      <div>
                        <span className={clsx(
                          styles.userRoleBadge,
                          userInfo.role_type.includes('Merchant') && styles.merchant,
                          userInfo.role_type === 'Cardholder' && styles.cardholder
                        )}>
                          {userInfo.role_type.includes('Jurídica') && <Building2 size={12} />}
                          {userInfo.role_type.includes('Física') && <User size={12} />}
                          {userInfo.role_type === 'Cardholder' && <CreditCard size={12} />}
                          {userInfo.role_type}
                        </span>
                        {userInfo.status && (
                          <span className={clsx(
                            styles.userStatusBadge,
                            styles[userInfo.status]
                          )}>
                            {userInfo.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.userInfoGrid}>
                    <div className={styles.userInfoItem}>
                      <span className={styles.userInfoItemLabel}>
                        <FileText size={10} /> Documento
                      </span>
                      <span className={clsx(styles.userInfoItemValue, styles.mono)}>
                        {userInfo.document_number || 'Não informado'}
                      </span>
                    </div>

                    <div className={styles.userInfoItem}>
                      <span className={styles.userInfoItemLabel}>
                        <Mail size={10} /> Email
                      </span>
                      <span className={styles.userInfoItemValue}>
                        {userInfo.email || 'Não informado'}
                      </span>
                    </div>

                    <div className={styles.userInfoItem}>
                      <span className={styles.userInfoItemLabel}>Idade</span>
                      <span className={styles.userInfoItemValue}>
                        {userInfo.idade ? `${userInfo.idade} anos` : 'Não informado'}
                      </span>
                    </div>

                    <div className={styles.userInfoItem}>
                      <span className={styles.userInfoItemLabel}>Categoria do Negócio</span>
                      <span className={styles.userInfoItemValue}>
                        {userInfo.categoria_negocio}
                      </span>
                    </div>

                    {userInfo.merchant_name && (
                      <div className={styles.userInfoItem}>
                        <span className={styles.userInfoItemLabel}>
                          <Building2 size={10} /> Nome Fantasia
                        </span>
                        <span className={styles.userInfoItemValue}>
                          {userInfo.merchant_name}
                        </span>
                      </div>
                    )}

                    <div className={styles.userInfoItem}>
                      <span className={styles.userInfoItemLabel}>
                        <MapPin size={10} /> Cidade/Estado
                      </span>
                      <span className={styles.userInfoItemValue}>
                        {userInfo.cidade && userInfo.estado 
                          ? `${userInfo.cidade} - ${userInfo.estado}`
                          : 'Não informado'}
                      </span>
                    </div>

                    {userInfo.endereco && (
                      <div className={clsx(styles.userInfoItem, styles.full)}>
                        <span className={styles.userInfoItemLabel}>
                          <MapPin size={10} /> Endereço Completo
                        </span>
                        <span className={styles.userInfoItemValue}>
                          {userInfo.endereco}
                        </span>
                      </div>
                    )}

                    {userInfo.status_reason && (
                      <div className={clsx(styles.userInfoItem, styles.full)}>
                        <span className={styles.userInfoItemLabel}>Motivo do Status</span>
                        <span className={clsx(styles.userInfoItemValue, styles.muted)}>
                          {userInfo.status_reason}
                        </span>
                      </div>
                    )}

                    <div className={styles.userInfoItem}>
                      <span className={styles.userInfoItemLabel}>
                        <Calendar size={10} /> Criado em (Merchant)
                      </span>
                      <span className={styles.userInfoItemValue}>
                        {userInfo.created_at_me 
                          ? format(new Date(userInfo.created_at_me), "dd/MM/yyyy", { locale: ptBR })
                          : 'N/A'}
                      </span>
                    </div>

                    <div className={styles.userInfoItem}>
                      <span className={styles.userInfoItemLabel}>
                        <Calendar size={10} /> Criado em (Cardholder)
                      </span>
                      <span className={styles.userInfoItemValue}>
                        {userInfo.created_at_ch 
                          ? format(new Date(userInfo.created_at_ch), "dd/MM/yyyy", { locale: ptBR })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.userInfoLoading}>
                  Nenhuma informação disponível
                </div>
              )}
            </div>
          </div>

          {/* Links externos */}
          <div className={styles.externalLinks}>
            <h3>Links Externos</h3>
            <div className={styles.linkGrid}>
              <a 
                href={`https://tyrell-spotlight.services.production.cloudwalk.network/overview/${caseData.user_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${styles.externalLink} ${styles.spotlight}`}
              >
                <ExternalLink size={16} />
                Spotlight
              </a>
              <a 
                href={`https://admin.example.com/users/${caseData.user_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                <ExternalLink size={16} />
                Admin Panel
              </a>
              <a 
                href={`https://analytics.example.com/user/${caseData.user_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                <ExternalLink size={16} />
                Analytics
              </a>
              <a 
                href={`https://transactions.example.com/merchant/${caseData.user_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                <ExternalLink size={16} />
                Transações
              </a>
            </div>
          </div>
        </div>

        {/* Resolution Form */}
        <aside className={styles.sidebar}>
          <div className={styles.resolutionForm}>
            <h3>Resolução do Caso</h3>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Tipo de Resolução</label>
                <div className={styles.resolutionOptions}>
                  <button
                    type="button"
                    className={clsx(
                      styles.resolutionOption,
                      resolutionType === 'normalize' && styles.selected,
                      styles.normalize
                    )}
                    onClick={() => handleTypeSelect('normalize')}
                  >
                    <CheckCircle2 size={20} />
                    <span>Normalizar</span>
                    <small>Remover suspeita do usuário</small>
                  </button>
                  
                  <button
                    type="button"
                    className={clsx(
                      styles.resolutionOption,
                      resolutionType === 'suspicious' && styles.selected,
                      styles.suspicious
                    )}
                    onClick={() => handleTypeSelect('suspicious')}
                  >
                    <AlertTriangle size={20} />
                    <span>Suspeito</span>
                    <small>Confirmar suspeita de lavagem</small>
                  </button>
                </div>
              </div>

              {resolutionType && (
                <div className={styles.formGroup}>
                  <label>Prioridade</label>
                  <div className={styles.priorityOptions}>
                    {availablePriorities[resolutionType].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        className={clsx(
                          styles.priorityOption,
                          resolutionPriority === priority && styles.selected,
                          styles[priority]
                        )}
                        onClick={() => setResolutionPriority(priority)}
                      >
                        <span className={styles.priorityLabel}>{priority.toUpperCase()}</span>
                        <span className={styles.priorityDesc}>
                          {priority === 'low' && 'Baixa'}
                          {priority === 'mid' && 'Média'}
                          {priority === 'high' && 'Alta'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="notes">Observações</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva sua análise e os motivos da decisão..."
                  rows={5}
                  className={styles.textarea}
                />
              </div>

              {submitError && (
                <div className={styles.errorMessage}>
                  <XCircle size={16} />
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className={styles.successMessage}>
                  <CheckCircle2 size={16} />
                  Resolução enviada com sucesso! Redirecionando...
                </div>
              )}

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={!resolutionType || !resolutionPriority || isSubmitting || submitSuccess}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className={styles.spinnerSmall} />
                    Enviando...
                  </>
                ) : submitSuccess ? (
                  <>
                    <CheckCircle2 size={18} />
                    Enviado!
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Resolução
                  </>
                )}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  )
}
