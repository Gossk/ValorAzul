import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
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

// ---------- Tipos exportados ----------
export interface CurrentUser {
  name: string;
  email: string;
  role: 'Administrador';
  uid: string;
}

// Estado inicial placeholder (se llena en useEffect)
const DEFAULT_USER: CurrentUser = {
  name: 'Cargando...',
  email: '',
  role: 'Administrador',
  uid: '',
};

// Exportamos una variable mutable para que Configuracion y Usuarios lo lean
export let CURRENT_USER: CurrentUser = { ...DEFAULT_USER };

// ---------- Meteor animation ----------

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

// ---------- Nav config ----------

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

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Resumen general del sistema' },
  '/clientes': { title: 'Clientes', subtitle: 'Gestión de clientes registrados' },
  '/simulador': { title: 'Simulador', subtitle: 'Simulador de crédito vehicular' },
  '/historial': { title: 'Historial', subtitle: 'Registro de simulaciones y créditos' },
  '/ayuda': { title: 'Ayuda', subtitle: 'Centro de soporte y preguntas frecuentes' },
  '/usuarios': { title: 'Usuarios', subtitle: 'Gestión de usuarios del sistema' },
  '/configuracion': { title: 'Configuración', subtitle: 'Administra tu perfil, empresa y preferencias' },
};

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, subtitle } = pageTitles[location.pathname] ?? { title: '', subtitle: '' };
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ ...DEFAULT_USER });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---- Auth listener: carga datos del usuario logueado desde Firestore ----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        navigate('/login');
        return;
      }

      // Buscar perfil en colección "clientes" (donde Register guarda datos)
      const profileDoc = await getDoc(doc(db, 'clientes', firebaseUser.uid));
      let name = 'Administrador';
      let email = firebaseUser.email || '';

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        name = data.nombre || name;
        email = data.email || email;
      }

      const user: CurrentUser = {
        name,
        email,
        role: 'Administrador',
        uid: firebaseUser.uid,
      };

      // Actualizar la variable exportada para otros componentes
      CURRENT_USER = user;
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [navigate]);

  // ---- Logout ----
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // ---- Canvas animation (identical to original) ----
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
        className={`nav-link ${active ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      >
        <Icon size={20} />
        {!collapsed && <span>{item.label}</span>}
        {item.badge && !collapsed ? <span className="nav-badge">{item.badge}</span> : null}
      </Link>
    );
  };

  return (
    <>
      {/* Canvas background */}
      <canvas ref={canvasRef} className="bg-canvas" />

      <div className="app-layout">
        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
          <Menu size={24} />
        </button>

        {mobileOpen && (
          <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
          <div className="sidebar-top">
            <button className="mobile-close" onClick={() => setMobileOpen(false)}>
              <X size={22} />
            </button>
            <div className="brand">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="sidebarLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <path d="M2 4 L16 28 L30 4 L24 4 L16 18 L8 4 Z" fill="url(#sidebarLogo)" />
              </svg>
              {!collapsed && (
                <div className="brand-text">
                  <span className="brand-name">VALOR</span>
                  <span className="brand-sub">AZUL</span>
                </div>
              )}
            </div>
            <button
              className="collapse-btn desktop-only"
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              {!collapsed && <span className="nav-section-label">MENÚ</span>}
              {mainNav.map(renderLink)}
            </div>
            <div className="nav-section">
              {!collapsed && <span className="nav-section-label">CONFIGURACIÓN</span>}
              {visibleConfigNav.map(renderLink)}
            </div>
          </nav>

          <div className="sidebar-bottom">
            <div className="user-card">
              <div className="avatar-circle">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="user-info">
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.role}</span>
                </div>
              )}
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={18} />
              {!collapsed && <span>Salir</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className={`main ${collapsed ? 'collapsed' : ''}`}>
          <header className="page-header">
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-subtitle">{subtitle}</p>
            </div>
            <div className="header-actions">
              <button className="icon-btn" title="Notificaciones">
                <Bell size={20} />
              </button>
              <div className="avatar-circle small">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default Layout;
