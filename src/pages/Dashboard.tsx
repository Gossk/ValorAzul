import { useEffect, useState } from 'react';
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

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ensureSeedData } from '../data/firestoreSeeder';

import './Dashboard.css';

interface ClienteFS {
  nombre: string;
  estado: string;
}

interface RegistroFS {
  cliente: string;
  vehiculo: string;
  monto: number;
  estado: string;
  fecha: string;
}

const ESTADO_COLORS: Record<string, string> = {
  Aprobada: '#22c55e',
  'En evaluación': '#3b82f6',
  Rechazada: '#facc15',
};

const badgeClass: Record<string, string> = {
  Aprobada: 'badge-green',
  'En evaluación': 'badge-blue',
  Rechazada: 'badge-red',
};

function Dashboard() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [historial, setHistorial] = useState<RegistroFS[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await ensureSeedData();

        const clientesSnap = await getDocs(collection(db, 'clientes_negocio'));
        const listaClientes: ClienteFS[] = [];
        clientesSnap.forEach((docSnap) => {
          const d = docSnap.data();
          listaClientes.push({ nombre: d.nombre || '', estado: d.estado || '' });
        });
        setClientes(listaClientes);

        const historialSnap = await getDocs(collection(db, 'historial'));
        const listaHist: RegistroFS[] = [];
        historialSnap.forEach((docSnap) => {
          const d = docSnap.data();
          listaHist.push({
            cliente: d.cliente || '',
            vehiculo: d.vehiculo || '',
            monto: d.monto || 0,
            estado: d.estado || '',
            fecha: d.fecha || '',
          });
        });
        setHistorial(listaHist);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // ---- Stats derivados ----
  const totalClientes = clientes.length;
  const totalSimulaciones = historial.length;
  const aprobados = historial.filter((h) => h.estado === 'Aprobada').length;
  const recientes = historial.slice(0, 4);

  // ---- Simulaciones por mes ----
  const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const simulacionesPorMes = (() => {
    const meses: Record<string, number> = {};
    for (const h of historial) {
      const parts = h.fecha.split('/');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        const key = nombresMes[m - 1] || 'N/A';
        meses[key] = (meses[key] || 0) + 1;
      }
    }
    return nombresMes
      .filter((n) => meses[n])
      .map((mes) => ({ mes, simulaciones: meses[mes] }));
  })();

  // ---- Estado simulaciones (pie) ----
  const estadoSimulaciones = (() => {
    const counts: Record<string, number> = { Aprobada: 0, 'En evaluación': 0, Rechazada: 0 };
    for (const h of historial) {
      if (counts[h.estado] !== undefined) counts[h.estado]++;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: ESTADO_COLORS[name] || '#888',
    }));
  })();
  const totalEstados = estadoSimulaciones.reduce((acc, item) => acc + item.value, 0);

  // ---- Fecha actual ----
  const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return <p style={{ color: 'rgba(255,255,255,0.6)', padding: 40, textAlign: 'center' }}>Cargando dashboard...</p>;
  }

  return (
    <>
      <div className="date-box">
        <Calendar size={16} /> {hoy}
      </div>

      <div className="stats stagger">
        <div className="glass-card stat-card">
          <div className="stat-icon blue"><User size={24} /></div>
          <div>
            <p>Clientes registrados</p>
            <h2>{totalClientes}</h2>
            <span>Desde Firestore</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon purple"><ChartNoAxesColumn size={24} /></div>
          <div>
            <p>Simulaciones realizadas</p>
            <h2>{totalSimulaciones}</h2>
            <span>Desde Firestore</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon green"><CircleDollarSign size={24} /></div>
          <div>
            <p>Créditos aprobados</p>
            <h2>{aprobados}</h2>
            <span>{totalSimulaciones > 0 ? Math.round((aprobados / totalSimulaciones) * 100) : 0}% del total</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon orange"><ClipboardList size={24} /></div>
          <div>
            <p>Última simulación</p>
            <h2>{recientes[0]?.fecha || '—'}</h2>
            <small>{recientes[0]?.cliente || ''}</small>
          </div>
        </div>
      </div>

      <div className="middle-grid">
        <div className="glass-card panel">
          <h3>Simulaciones por mes</h3>
          <div className="rechart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulacionesPorMes}>
                <defs>
                  <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'rgba(13,27,53,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 }}
                  itemStyle={{ color: '#f0f4ff' }}
                />
                <Area type="monotone" dataKey="simulaciones" stroke="#3b82f6" fill="url(#colorSim)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card panel">
          <h3>Estado de simulaciones</h3>
          <div className="status-content">
            <div className="donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estadoSimulaciones} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                    {estadoSimulaciones.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>{totalEstados}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="legend">
              {estadoSimulaciones.map((item) => (
                <p key={item.name}>
                  <span className="dot" style={{ background: item.color }} />
                  {item.name}
                  <b>{totalEstados > 0 ? Math.round((item.value / totalEstados) * 100) : 0}% ({item.value})</b>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="glass-card panel table-panel">
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
                <tr key={idx} className={idx % 2 === 0 ? 'row-even' : ''}>
                  <td>{item.cliente}</td>
                  <td>{item.vehiculo}</td>
                  <td>S/ {item.monto.toLocaleString('es-PE')}</td>
                  <td><span className={`badge ${badgeClass[item.estado] || ''}`}>{item.estado}</span></td>
                  <td>{item.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card panel">
          <h3>Actividad reciente</h3>
          {recientes.slice(0, 3).map((item, idx) => (
            <div key={idx} className="activity">
              <CircleDollarSign size={18} />
              <div>
                <b>{item.estado === 'Aprobada' ? 'Crédito aprobado' : item.estado === 'Rechazada' ? 'Crédito rechazado' : 'Simulación creada'}</b>
                <p>{item.cliente} — {item.vehiculo}</p>
              </div>
              <small>{item.fecha}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
