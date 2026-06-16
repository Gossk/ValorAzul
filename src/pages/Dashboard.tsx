import {
  Calendar,
  ChartNoAxesColumn,
  CircleDollarSign,
  ClipboardList,
  User,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import Layout from '../components/Layout';
import { estadoSimulaciones, historial, simulacionesPorMes } from '../data/mockData';
import './Dashboard.css';

const recientes = historial.slice(0, 4);
const totalSimulaciones = estadoSimulaciones.reduce((acc, item) => acc + item.value, 0);

const badgeClass: Record<string, string> = {
  Aprobada: 'badge-green',
  'En evaluación': 'badge-blue',
  Rechazada: 'badge-red',
};

function Dashboard() {
  return (
    <Layout title="Dashboard" subtitle="Resumen general del sistema">
      <div className="date-box">
        <Calendar size={17} />
        15 de junio, 2026
      </div>

      <section className="stats stagger">
        <div className="stat-card glass-card">
          <div className="stat-icon blue glow"><User size={26} /></div>
          <div>
            <p>Clientes registrados</p>
            <h2>124</h2>
            <span>↑ 12% <small>vs último mes</small></span>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon green glow"><ClipboardList size={26} /></div>
          <div>
            <p>Simulaciones realizadas</p>
            <h2>342</h2>
            <span>↑ 18% <small>vs último mes</small></span>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon purple glow"><CircleDollarSign size={26} /></div>
          <div>
            <p>Créditos aprobados</p>
            <h2>76</h2>
            <span>↑ 8% <small>vs último mes</small></span>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon orange glow"><ChartNoAxesColumn size={26} /></div>
          <div>
            <p>Última simulación</p>
            <h2>Hace 15 min</h2>
            <small>Cliente: Juan Pérez</small>
          </div>
        </div>
      </section>

      <section className="middle-grid">
        <div className="panel chart-panel glass-card fade-in">
          <div className="panel-header">
            <h3>Simulaciones por mes</h3>
            <button className="btn">Últimos 6 meses</button>
          </div>

          <div className="rechart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulacionesPorMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSimulaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#10204a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                  labelStyle={{ color: '#F0F4FF' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area
                  type="monotone"
                  dataKey="simulaciones"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorSimulaciones)"
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0d1b35', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel status-panel glass-card fade-in">
          <h3>Estado de simulaciones</h3>
          <div className="status-content">
            <div className="donut-chart">
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie
                    data={estadoSimulaciones}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {estadoSimulaciones.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#10204a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                    labelStyle={{ color: '#F0F4FF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>{totalSimulaciones}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="legend">
              {estadoSimulaciones.map((item) => (
                <p key={item.name}>
                  <span className="dot" style={{ background: item.color }}></span>
                  {item.name}
                  <b>{Math.round((item.value / totalSimulaciones) * 100)}% ({item.value})</b>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel table-panel glass-card fade-in">
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
              {recientes.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td>{item.cliente}</td>
                  <td>{item.vehiculo}</td>
                  <td>S/ {item.monto.toLocaleString('es-PE')}</td>
                  <td><span className={`badge ${badgeClass[item.estado]}`}>{item.estado}</span></td>
                  <td>{item.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel activity-panel glass-card fade-in">
          <h3>Actividad reciente</h3>

          <div className="activity"><User size={20} /><div><b>Nuevo cliente registrado</b><p>María Fernández</p></div><small>Hace 10 min</small></div>
          <div className="activity"><ClipboardList size={20} /><div><b>Simulación creada</b><p>Toyota RAV4 2023</p></div><small>Hace 25 min</small></div>
          <div className="activity"><CircleDollarSign size={20} /><div><b>Crédito aprobado</b><p>Juan Pérez - S/ 85,000</p></div><small>Hace 40 min</small></div>
        </div>
      </section>
    </Layout>
  );
}

export default Dashboard;
