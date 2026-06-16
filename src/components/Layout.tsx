import { useEffect, useRef, useState, type ReactNode } from 'react';
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

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
}

function spawnMeteor(width: number): Meteor {
  const speed = 4 + Math.random() * 4;
  const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35;
  return {
    x: Math.random() * width,
    y: -80 - Math.random() * 120,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    length: 80 + Math.random() * 70,
  };
}

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; r: number; opacity: number }[] = [];
    let meteors: Meteor[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    for (let i = 0; i < 15; i++) {
      meteors.push(spawnMeteor(window.innerWidth));
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const nebula = ctx.createRadialGradient(w * 0.4, h * 0.35, 0, w * 0.5, h * 0.5, w * 0.85);
      nebula.addColorStop(0, '#6b21a8');
      nebula.addColorStop(0.15, '#581c87');
      nebula.addColorStop(0.35, '#3b0764');
      nebula.addColorStop(0.55, '#1e0533');
      nebula.addColorStop(0.75, '#0d0120');
      nebula.addColorStop(1, '#050010');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, w, h);

      const nebula2 = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, w * 0.4);
      nebula2.addColorStop(0, 'rgba(139,92,246,0.3)');
      nebula2.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
      }

      meteors = meteors.map((m) => {
        const nx = m.x + m.vx;
        const ny = m.y + m.vy;
        const tailX = m.x - Math.cos(Math.atan2(m.vy, m.vx)) * m.length;
        const tailY = m.y - Math.sin(Math.atan2(m.vy, m.vx)) * m.length;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, 'rgba(180,150,255,0)');
        grad.addColorStop(1, 'rgba(220,210,255,1)');
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const headGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 6);
        headGlow.addColorStop(0, 'rgba(230,220,255,0.95)');
        headGlow.addColorStop(1, 'rgba(180,150,255,0)');
        ctx.beginPath();
        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = headGlow;
        ctx.fill();

        if (nx > w + 100 || ny > h + 100) return spawnMeteor(w);
        return { ...m, x: nx, y: ny };
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

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
    <>
      {/* Canvas fuera del grid — z-index 0 en el root stacking context */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Grid principal — z-index 1 en el root, siempre encima del canvas */}
      <div
        className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
          <div>
            <div className="brand">
              <div className="logo-container">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818CF8" />
                      <stop offset="50%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <path d="M2 4 L16 28 L30 4 L24 4 L16 18 L8 4 Z" fill="url(#sidebarLogoGrad)" />
                </svg>
                <div className="logo-text">
                  <span className="logo-name">VALOR</span>
                  <span className="logo-sub">AZUL</span>
                </div>
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

            <div className="user-box" data-tooltip={CURRENT_USER.name}>
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
    </>
  );
}

export default Layout;
