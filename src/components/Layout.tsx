import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Car,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';

import './Layout.css';

export const CURRENT_USER = {
  name: 'Administrador',
  email: 'admin@valorazul.com',
  role: 'Administrador' as const,
};

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  badge?: number;
}

const mainNav: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/clientes', icon: User, label: 'Clientes' },
  { to: '/simulador', icon: Car, label: 'Simulador' },
  { to: '/historial', icon: FileText, label: 'Historial', badge: 3 },
  { to: '/ayuda', icon: HelpCircle, label: 'Ayuda' },
];

const configNav: NavItem[] = [
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
];

interface LayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

function Layout({ title, subtitle, children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleConfigNav = configNav.filter(
    (item) => item.to !== '/usuarios' || CURRENT_USER.role === 'Administrador'
  );

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;
    const active = location.pathname === item.to;
    return (
      <Link
        key={item.to}
        to={item.to}
        className={active ? 'active' : ''}
        data-tooltip={item.label}
        onClick={() => setMobileOpen(false)}
      >
        <Icon size={18} />
        <span className="link-label">{item.label}</span>
        {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
      </Link>
    );
  };

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="brand">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="brand-svg" aria-hidden="true">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="50%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path
                d="M2 4 L16 28 L30 4 L24 4 L16 18 L8 4 Z"
                fill="url(#logoGrad)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </svg>
            <div className="brand-text">
              <span className="brand-name">VALOR</span>
              <span className="brand-sub">AZUL</span>
            </div>
            <button className="mobile-close" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <p className="menu-title">PRINCIPAL</p>
          <nav className="menu">{mainNav.map(renderLink)}</nav>

          <p className="menu-title config">CONFIGURACIÓN</p>
          <nav className="menu">{visibleConfigNav.map(renderLink)}</nav>
        </div>

        <div className="sidebar-footer">
          <button className="collapse-btn" onClick={() => setCollapsed((c) => !c)} title="Colapsar menú">
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            <span className="link-label">Colapsar</span>
          </button>

          <div className="user-box" data-tooltip={`${CURRENT_USER.name}`}>
            <div className="avatar">{CURRENT_USER.name.charAt(0)}</div>
            <div className="link-label">
              <strong>{CURRENT_USER.name}</strong>
              <p>{CURRENT_USER.email}</p>
            </div>
            <button className="logout-btn link-label" onClick={() => navigate('/')} title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <main className="main">
        <header className="header">
          <div className="header-left">
            <button className="icon-btn menu-toggle" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="ping"></span>
            </button>
            <div className="admin-avatar">{CURRENT_USER.name.charAt(0)}</div>
            <span className="header-user">{CURRENT_USER.name}</span>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
