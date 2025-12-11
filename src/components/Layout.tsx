import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileSearch, Shield, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import styles from './Layout.module.css'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <button className={styles.toggleBtn} onClick={toggleSidebar} title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}>
        {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
      </button>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.logo}>
          <Shield size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>AML<span className={styles.logoAccent}>Resolution</span></span>
        </div>
        
        <nav className={styles.nav}>
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <FileSearch size={20} />
            <span>Casos Pendentes</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.active : ''}`
            }
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </nav>
        
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.initials || 'U'}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name || 'Usuário'}</span>
              <span className={styles.userRole}>{user?.role || 'Analista'}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} title="Sair" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
