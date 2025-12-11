import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CasesProvider } from './contexts/CasesContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { CaseList } from './pages/CaseList'
import { CaseDetail } from './pages/CaseDetail'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        color: 'var(--text-muted)'
      }}>
        Carregando...
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/cases" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/cases" replace />} />
        <Route path="cases" element={<CaseList />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cases/:userId" element={<CaseDetail />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <CasesProvider>
        <AppRoutes />
      </CasesProvider>
    </AuthProvider>
  )
}

export default App
