import { useMemo, useState } from 'react';
import { CircleDollarSign, ClipboardList, Download, User, XCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import Layout from '../components/Layout';
import { historial, simulacionesPorMes, type EstadoSimulacion } from '../data/mockData';
import './Historial.css';

const badgeClass: Record<EstadoSimulacion, string> = {
  Aprobada: 'badge-green',
  'En evaluación': 'badge-blue',
  Rechazada: 'badge-red',
};

const timelineIcon: Record<EstadoSimulacion, typeof CircleDollarSign> = {
  Aprobada: CircleDollarSign,
  'En evaluación': ClipboardList,
  Rechazada: XCircle,
};

const clientesUnicos = Array.from(new Set(historial.map((h) => h.cliente)));

function Historial() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [cliente, setCliente] = useState('Todos');

  const parseFecha = (fecha: string) => {
    const [d, m, y] = fecha.split('/').map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  const filtrados = useMemo(() => {
    return historial.filter((h) => {
      const matchEstado = estado === 'Todos' || h.estado === estado;
      const matchCliente = cliente === 'Todos' || h.cliente === cliente;
      const fechaTime = parseFecha(h.fecha);
      const matchDesde = !desde || fechaTime >= new Date(desde).getTime();
      const matchHasta = !hasta || fechaTime <= new Date(hasta).getTime();
      return matchEstado && matchCliente && matchDesde && matchHasta;
    });
  }, [desde, hasta, estado, cliente]);

  const handleExportCSV = () => {
    const headers = ['Cliente', 'Vehículo', 'Tipo', 'Monto', 'Cuota', 'Plazo', 'Estado', 'Fecha'];
    const rows = filtrados.map((h) => [h.cliente, h.vehiculo, h.tipo, h.monto, h.cuota, h.plazo, h.estado, h.fecha]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historial_valorazul.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Historial" subtitle="Registro de simulaciones y créditos">
      <div className="historial-filters fade-in">
        <div className="filter-group">
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Aprobada">Aprobada</option>
            <option value="En evaluación">En evaluación</option>
            <option value="Rechazada">Rechazada</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Cliente</label>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option value="Todos">Todos</option>
            {clientesUnicos.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary export-btn" onClick={handleExportCSV}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="panel glass-card chart-panel fade-in">
        <h3>Volumen de simulaciones por mes</h3>
        <div className="rechart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulacionesPorMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#10204a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                labelStyle={{ color: '#F0F4FF' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="simulaciones" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="historial-grid">
        <div className="panel glass-card timeline-panel fade-in">
          <h3>Actividad reciente</h3>
          <div className="timeline">
            {historial.slice(0, 8).map((item) => {
              const Icon = timelineIcon[item.estado];
              return (
                <div className="timeline-item" key={item.id}>
                  <div className={`timeline-icon ${badgeClass[item.estado]}`}>
                    <Icon size={16} />
                  </div>
                  <div className="timeline-content">
                    <strong>{item.cliente}</strong>
                    <p>{item.vehiculo}</p>
                    <span className={`badge ${badgeClass[item.estado]}`}>{item.estado}</span>
                  </div>
                  <small>{item.fecha}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel glass-card table-panel fade-in">
          <h3>Historial completo ({filtrados.length})</h3>
          <div className="table-wrap">
            <table className="historial-table">
              <thead>
                <tr>
                  <th><User size={14} /> Cliente</th>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Cuota</th>
                  <th>Plazo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td>{item.cliente}</td>
                    <td>{item.vehiculo}</td>
                    <td>{item.tipo}</td>
                    <td>S/ {item.monto.toLocaleString('es-PE')}</td>
                    <td>S/ {item.cuota.toLocaleString('es-PE')}</td>
                    <td>{item.plazo}m</td>
                    <td><span className={`badge ${badgeClass[item.estado]}`}>{item.estado}</span></td>
                    <td>{item.fecha}</td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">No hay registros para los filtros seleccionados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Historial;
