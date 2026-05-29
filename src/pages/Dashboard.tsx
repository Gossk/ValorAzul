import { Link } from 'react-router-dom';

import {
  Bell,
  Calendar,
  Car,
  ChartNoAxesColumn,
  CircleDollarSign,
  ClipboardList,
  FileText,
  HelpCircle,
  Home,
  Menu,
  Settings,
  User,
  Users,
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-icon">V</div>
            <div>
              <h2>Valor Azul</h2>
              <p>Crédito Vehicular</p>
            </div>
          </div>

          <p className="menu-title">PRINCIPAL</p>

          <nav className="menu">
            <Link className="active" to="/dashboard"><Home size={18} /> Dashboard</Link>
            <Link to="/clientes"><User size={18} /> Registro de Clientes</Link>
            <Link to="/simulador"><Car size={18} /> Simulador de Crédito</Link>
            <Link to="/historial"><FileText size={18} /> Historial</Link>
            <Link to="/ayuda"><HelpCircle size={18} /> Ayuda</Link>
          </nav>

          <p className="menu-title config">CONFIGURACIÓN</p>

          <nav className="menu">
            <Link to="#"><Users size={18} /> Usuarios</Link>
            <Link to="#"><Settings size={18} /> Configuración</Link>
          </nav>
        </div>

        <div className="user-box">
          <div className="avatar">A</div>
          <div>
            <strong>Administrador</strong>
            <p>admin@valorazul.com</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left">
            <Menu size={24} />
            <div>
              <h1>Dashboard</h1>
              <p>Resumen general del sistema</p>
            </div>
          </div>

          <div className="header-actions">
            <Bell size={22} />
            <div className="admin-avatar">A</div>
            <span>Administrador</span>
          </div>
        </header>

        <div className="date-box">
          <Calendar size={17} />
          6 de mayo, 2026
        </div>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon blue"><User size={26} /></div>
            <div>
              <p>Clientes registrados</p>
              <h2>124</h2>
              <span>↑ 12% <small>vs último mes</small></span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green"><ClipboardList size={26} /></div>
            <div>
              <p>Simulaciones realizadas</p>
              <h2>342</h2>
              <span>↑ 18% <small>vs último mes</small></span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple"><CircleDollarSign size={26} /></div>
            <div>
              <p>Créditos aprobados</p>
              <h2>76</h2>
              <span>↑ 8% <small>vs último mes</small></span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange"><ChartNoAxesColumn size={26} /></div>
            <div>
              <p>Última simulación</p>
              <h2>Hace 15 min</h2>
              <small>Cliente: Juan Pérez</small>
            </div>
          </div>
        </section>

        <section className="middle-grid">
          <div className="panel chart-panel">
            <div className="panel-header">
              <h3>Simulaciones por mes</h3>
              <button>Últimos 6 meses</button>
            </div>

            <div className="line-chart">
              <svg viewBox="0 0 700 250" preserveAspectRatio="none">
                <line x1="0" y1="40" x2="700" y2="40" />
                <line x1="0" y1="90" x2="700" y2="90" />
                <line x1="0" y1="140" x2="700" y2="140" />
                <line x1="0" y1="190" x2="700" y2="190" />
                <polyline points="0,185 140,160 280,135 420,110 560,70 700,110" />
                <circle cx="0" cy="185" r="5" />
                <circle cx="140" cy="160" r="5" />
                <circle cx="280" cy="135" r="5" />
                <circle cx="420" cy="110" r="5" />
                <circle cx="560" cy="70" r="5" />
                <circle cx="700" cy="110" r="5" />
              </svg>

              <div className="months">
                <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
              </div>
            </div>
          </div>

          <div className="panel status-panel">
            <h3>Estado de simulaciones</h3>
            <div className="status-content">
              <div className="donut">
                <div>
                  <strong>342</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className="legend">
                <p><span className="dot green-dot"></span>Aprobadas <b>35% (120)</b></p>
                <p><span className="dot blue-dot"></span>En evaluación <b>45% (154)</b></p>
                <p><span className="dot yellow-dot"></span>Rechazadas <b>20% (68)</b></p>
              </div>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel table-panel">
            <h3>Simulaciones recientes</h3>

            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Juan Pérez</td><td>Toyota Corolla 2023</td><td>S/ 85,000</td><td><span className="badge ok">Aprobada</span></td><td>06/05/2026</td></tr>
                <tr><td>María López</td><td>Hyundai Tucson 2022</td><td>S/ 120,000</td><td><span className="badge eval">En evaluación</span></td><td>06/05/2026</td></tr>
                <tr><td>Carlos Ramírez</td><td>Kia Sportage 2023</td><td>S/ 95,000</td><td><span className="badge ok">Aprobada</span></td><td>05/05/2026</td></tr>
                <tr><td>Ana Torres</td><td>Nissan Kicks 2022</td><td>S/ 65,000</td><td><span className="badge bad">Rechazada</span></td><td>05/05/2026</td></tr>
              </tbody>
            </table>
          </div>

          <div className="panel activity-panel">
            <h3>Actividad reciente</h3>

            <div className="activity"><User size={20} /><div><b>Nuevo cliente registrado</b><p>María Fernández</p></div><small>Hace 10 min</small></div>
            <div className="activity"><ClipboardList size={20} /><div><b>Simulación creada</b><p>Toyota RAV4 2023</p></div><small>Hace 25 min</small></div>
            <div className="activity"><CircleDollarSign size={20} /><div><b>Crédito aprobado</b><p>Juan Pérez - S/ 85,000</p></div><small>Hace 40 min</small></div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard