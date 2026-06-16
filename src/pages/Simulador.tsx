import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car, Home, User, FileText, HelpCircle,
  Settings, Users, Bell, Menu, Calculator,
  TrendingUp, DollarSign, BarChart2, Calendar,
  AlertCircle,
} from 'lucide-react'
import './Dashboard.css'
import './Simulador.css'

interface CronogramaItem {
  mes: number
  tipo: 'normal' | 'gracia_total' | 'gracia_parcial'
  cuotaBase: number
  cuotaTotal: number
  interes: number
  amortizacion: number
  seguroDesgravamen: number
  seguroVehicular: number
  saldo: number
}

interface Resumen {
  totalInteres: number
  totalAmortizacion: number
  totalCuotasBase: number
  totalSeguroDesgravamen: number
  totalSeguroVehicular: number
  totalCostos: number
  totalPagar: number
  van: number
  tirMensual: number
  tcea: number
  tea: number
  tem: number
  cuotaMensual: number
  prestamo: number
  plazoMeses: number
  mesesGracia: number
  mesesAmortizacion: number
}

const fmt = (n: number) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Simulador() {
  // — Datos del vehículo —
  const [precioVehiculo,     setPrecioVehiculo]     = useState(50000)
  const [cuotaInicialPorc,   setCuotaInicialPorc]   = useState(0.20)
  const [tipoMoneda,         setTipoMoneda]         = useState(1)
  const [tipoCambio,         setTipoCambio]         = useState(3.5)
  const [tipoPlazo,          setTipoPlazo]          = useState(1)
  const [plazoMeses,         setPlazoMeses]         = useState(60)
  const [plazoAnios,         setPlazoAnios]         = useState(5)

  // — Tipo de tasa —
  const [tipoTasa,           setTipoTasa]           = useState(1)   // 1=TEA, 2=TNA
  const [tasaTEA,            setTasaTEA]            = useState(0.11)
  const [tasaTNA,            setTasaTNA]            = useState(0.10)
  const [capitalizacion,     setCapitalizacion]     = useState(12)  // frecuencia/año

  // — Seguros —
  const [tasaDesgravamen,    setTasaDesgravamen]    = useState(0.0035)
  const [tasaVehicularAnual, setTasaVehicularAnual] = useState(0.036)

  // — Período de gracia —
  const [tieneGracia,        setTieneGracia]        = useState(false)
  const [mesesGracia,        setMesesGracia]        = useState(0)
  const [tipoGracia,         setTipoGracia]         = useState(1)   // 1=Total, 2=Parcial

  // — Costos iniciales —
  const [costosNotariales,   setCostosNotariales]   = useState(200)
  const [costosRegistrales,  setCostosRegistrales]  = useState(150)
  const [tasacion,           setTasacion]           = useState(100)
  const [otrosGastos,        setOtrosGastos]        = useState(50)

  // — Resultados —
  const [cronograma,         setCronograma]         = useState<CronogramaItem[]>([])
  const [resumen,            setResumen]            = useState<Resumen | null>(null)
  const [mostrarResultados,  setMostrarResultados]  = useState(false)
  const [activeTab,          setActiveTab]          = useState<'resumen' | 'cronograma'>('resumen')
  const [errorGracia,        setErrorGracia]        = useState('')

  // ── CÁLCULO TEA/TEM ────────────────────────────────────────────────────────
  const calcularTEM = (): { tea: number; tem: number } => {
    if (tipoTasa === 1) {
      const tea = tasaTEA
      const tem = Math.pow(1 + tea, 1 / 12) - 1
      return { tea, tem }
    } else {
      // TNA → TEA → TEM
      const tea = Math.pow(1 + tasaTNA / capitalizacion, capitalizacion) - 1
      const tem = Math.pow(1 + tea, 1 / 12) - 1
      return { tea, tem }
    }
  }

  // ── SIMULACIÓN PRINCIPAL ───────────────────────────────────────────────────
  const simular = () => {
    setErrorGracia('')

    // Precio en soles
    let precio = tipoMoneda === 2 ? precioVehiculo * tipoCambio : precioVehiculo
    const plazoFinal = tipoPlazo === 1 ? plazoMeses : plazoAnios * 12

    // Validación período de gracia
    if (tieneGracia && mesesGracia >= plazoFinal) {
      setErrorGracia('Los meses de gracia deben ser menores que el plazo total.')
      return
    }

    const { tea, tem: TEM } = calcularTEM()
    const prestamoInicial = precio - precio * cuotaInicialPorc
    let saldo = prestamoInicial

    const segVehMensual = (precio * tasaVehicularAnual) / 12
    const totalCostosIniciales = costosNotariales + costosRegistrales + tasacion + otrosGastos
    const gracia = tieneGracia ? mesesGracia : 0
    const mesesAmortiza = plazoFinal - gracia

    // ── CUOTA BASE INICIAL (algoritmo exacto) ──────────────────────────────
    // Con gracia (total o parcial): se calcula sobre prestamo original y meses que amortizan
    // Sin gracia: se calcula sobre prestamo original y plazo completo
    let cuotaBase = tieneGracia
      ? prestamoInicial * (TEM * Math.pow(1 + TEM, mesesAmortiza)) / (Math.pow(1 + TEM, mesesAmortiza) - 1)
      : prestamoInicial * (TEM * Math.pow(1 + TEM, plazoFinal))    / (Math.pow(1 + TEM, plazoFinal)    - 1)

    const nuevoCron: CronogramaItem[] = []
    const cuotasPorMes: number[] = []

    let totInt = 0, totAmort = 0, totDesg = 0, totPagado = 0

    for (let mes = 1; mes <= plazoFinal; mes++) {
      let intMes: number, desgMes: number, amort: number, cuotaTotal: number
      let tipo: CronogramaItem['tipo'] = 'normal'

      if (mes <= gracia) {
        // ── PERÍODO DE GRACIA ──────────────────────────────
        intMes = saldo * TEM

        if (tipoGracia === 1) {
          // GRACIA TOTAL: intereses se capitalizan al saldo, no paga nada
          tipo      = 'gracia_total'
          desgMes   = 0
          amort     = 0
          saldo     = saldo + intMes   // capitalización
          cuotaTotal = 0
        } else {
          // GRACIA PARCIAL: paga intereses + seguros, no amortiza
          tipo      = 'gracia_parcial'
          desgMes   = saldo * tasaDesgravamen
          amort     = 0
          cuotaTotal = intMes + segVehMensual + desgMes
        }
      } else {
        // ── PERÍODO NORMAL ─────────────────────────────────
        // Gracia TOTAL: al llegar al primer mes normal recalcular cuota base
        // con el saldo ya capitalizado (que creció durante la gracia)
        if (mes === gracia + 1 && gracia > 0 && tipoGracia === 1) {
          cuotaBase = saldo * (TEM * Math.pow(1 + TEM, mesesAmortiza)) / (Math.pow(1 + TEM, mesesAmortiza) - 1)
        }

        intMes  = saldo * TEM
        desgMes = saldo * tasaDesgravamen
        amort = cuotaBase - intMes
        saldo = saldo - amort
        if (saldo < 0.01) saldo = 0
        cuotaTotal = cuotaBase + segVehMensual + desgMes
      }

      cuotasPorMes.push(cuotaTotal)

      totInt   += intMes
      totAmort += amort
      totDesg  += desgMes
      totPagado += cuotaTotal

      nuevoCron.push({
        mes, tipo,
        cuotaBase:         tipo === 'gracia_total' ? 0 : +cuotaBase.toFixed(2),
        cuotaTotal:        +cuotaTotal.toFixed(2),
        interes:           +intMes.toFixed(2),
        amortizacion:      +amort.toFixed(2),
        seguroDesgravamen: +desgMes.toFixed(2),
        seguroVehicular:   tipo === 'gracia_total' ? 0 : +segVehMensual.toFixed(2),
        saldo:             +saldo.toFixed(2),
      })
    }

    const totalSegVeh = segVehMensual * plazoFinal

    // ── VAN ────────────────────────────────────────────────
    // flujo_0 = prestamo - costos_iniciales (según algoritmo)
    const flujo0 = prestamoInicial - totalCostosIniciales
    let van = flujo0
    for (let i = 0; i < plazoFinal; i++) {
      van += (-cuotasPorMes[i]) / Math.pow(1 + TEM, i + 1)
    }

    // ── TIR (detección automática de rango + bisección) ───
    const vanAt = (tasa: number): number => {
      let v = flujo0
      for (let i = 0; i < plazoFinal; i++) {
        v += (-cuotasPorMes[i]) / Math.pow(1 + tasa, i + 1)
      }
      return v
    }
    // 1) Barrer para encontrar rango donde VAN cambia de signo
    let tirLow = 0.000001
    let tirHigh = 0.001
    while (tirHigh < 2.0 && vanAt(tirLow) * vanAt(tirHigh) >= 0) {
      tirLow  = tirHigh
      tirHigh += 0.001
    }
    // 2) Bisección fina dentro del rango hallado
    let tirMensual = (tirLow + tirHigh) / 2
    for (let iter = 0; iter < 300; iter++) {
      const mid = (tirLow + tirHigh) / 2
      const v   = vanAt(mid)
      if (Math.abs(v) < 0.0001) { tirMensual = mid; break }
      if (vanAt(tirLow) * v < 0) tirHigh = mid
      else tirLow = mid
      tirMensual = mid
    }

    const tcea = Math.pow(1 + tirMensual, 12) - 1

    setResumen({
      totalInteres:          +totInt.toFixed(2),
      totalAmortizacion:     +totAmort.toFixed(2),
      totalCuotasBase:       +(cuotaBase * mesesAmortiza).toFixed(2),
      totalSeguroDesgravamen:+totDesg.toFixed(2),
      totalSeguroVehicular:  +totalSegVeh.toFixed(2),
      totalCostos:           +totalCostosIniciales.toFixed(2),
      totalPagar:            +(totPagado + totalCostosIniciales).toFixed(2),
      van:                   +van.toFixed(2),
      tirMensual:            +(tirMensual * 100).toFixed(4),
      tcea:                  +(tcea * 100).toFixed(4),
      tea:                   +(tea * 100).toFixed(4),
      tem:                   +(TEM * 100).toFixed(4),
      cuotaMensual:          +nuevoCron.find(c => c.tipo === 'normal')!.cuotaTotal.toFixed(2),
      prestamo:              +prestamoInicial.toFixed(2),
      plazoMeses:            plazoFinal,
      mesesGracia:           gracia,
      mesesAmortizacion:     mesesAmortiza,
    })

    setCronograma(nuevoCron)
    setMostrarResultados(true)
    setActiveTab('resumen')
  }

  const capMap: Record<number, string> = {
    360: 'Diaria (360 días)', 12: 'Mensual', 4: 'Trimestral', 2: 'Semestral', 1: 'Anual',
  }

  return (
    <div className="dashboard-layout">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="logo-container">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="simLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <path d="M2 4 L16 28 L30 4 L24 4 L16 18 L8 4 Z" fill="url(#simLogoGrad)" />
              </svg>
              <div className="logo-text">
                <span className="logo-name">VALOR</span>
                <span className="logo-sub">AZUL</span>
              </div>
            </div>
          </div>

          <p className="menu-title">PRINCIPAL</p>
          <nav className="menu">
            <Link to="/dashboard"><Home size={18} /> Dashboard</Link>
            <Link to="/clientes"><User size={18} /> Registro de Clientes</Link>
            <Link to="/simulador" className="active"><Car size={18} /> Simulador de Crédito</Link>
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

      {/* ── MAIN ── */}
      <main className="main">

        <header className="header">
          <div className="header-left">
            <Menu size={24} />
            <div>
              <h1>Simulador de Crédito</h1>
              <p>Calcula tu financiamiento vehicular</p>
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
          {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {/* ── FORMULARIO ── */}
        <div className="sim-grid">

          {/* Datos del Vehículo */}
          <div className="panel">
            <div className="sim-card-header">
              <Car size={18} color="#2563eb" />
              <h3>Datos del Vehículo</h3>
            </div>

            <Field label="Precio del vehículo">
              <div className="sim-ig">
                <span className="sim-pre">{tipoMoneda === 1 ? 'S/' : '$'}</span>
                <input type="number" value={precioVehiculo}
                  onChange={e => setPrecioVehiculo(+e.target.value)} />
              </div>
            </Field>

            <Field label="Moneda">
              <select className="sim-sel" value={tipoMoneda}
                onChange={e => setTipoMoneda(+e.target.value)}>
                <option value={1}>Soles (S/)</option>
                <option value={2}>Dólares ($)</option>
              </select>
            </Field>

            {tipoMoneda === 2 && (
              <Field label="Tipo de cambio">
                <div className="sim-ig">
                  <input type="number" step="0.01" value={tipoCambio}
                    onChange={e => setTipoCambio(+e.target.value)} />
                  <span className="sim-suf">
                    = S/ {fmt(precioVehiculo * tipoCambio)}
                  </span>
                </div>
              </Field>
            )}

            <Field label="Cuota inicial (decimal)">
              <div className="sim-ig">
                <input type="number" step="0.01" min="0" max="0.99"
                  value={cuotaInicialPorc}
                  onChange={e => setCuotaInicialPorc(+e.target.value)} />
                <span className="sim-suf">
                  = S/ {fmt((tipoMoneda === 2 ? precioVehiculo * tipoCambio : precioVehiculo) * cuotaInicialPorc)}
                </span>
              </div>
            </Field>

            <Field label="Plazo">
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="sim-sel" style={{ flex: 1 }} value={tipoPlazo}
                  onChange={e => setTipoPlazo(+e.target.value)}>
                  <option value={1}>Meses</option>
                  <option value={2}>Años</option>
                </select>
                <input className="sim-solo" style={{ flex: 1 }} type="number"
                  value={tipoPlazo === 1 ? plazoMeses : plazoAnios}
                  onChange={e => tipoPlazo === 1
                    ? setPlazoMeses(+e.target.value)
                    : setPlazoAnios(+e.target.value)} />
              </div>
            </Field>
          </div>

          {/* Estructura Financiera */}
          <div className="panel">
            <div className="sim-card-header">
              <TrendingUp size={18} color="#16a34a" />
              <h3>Estructura Financiera</h3>
            </div>

            <Field label="Tipo de tasa">
              <select className="sim-sel" value={tipoTasa}
                onChange={e => setTipoTasa(+e.target.value)}>
                <option value={1}>TEA — Tasa Efectiva Anual</option>
                <option value={2}>TNA — Tasa Nominal Anual</option>
              </select>
            </Field>

            {tipoTasa === 1 ? (
              <Field label="TEA (ej: 0.11 = 11%)">
                <div className="sim-ig">
                  <input type="number" step="0.001" value={tasaTEA}
                    onChange={e => setTasaTEA(+e.target.value)} />
                  <span className="sim-suf">{(tasaTEA * 100).toFixed(1)}%</span>
                </div>
              </Field>
            ) : (
              <>
                <Field label="TNA (ej: 0.10 = 10%)">
                  <div className="sim-ig">
                    <input type="number" step="0.001" value={tasaTNA}
                      onChange={e => setTasaTNA(+e.target.value)} />
                    <span className="sim-suf">{(tasaTNA * 100).toFixed(1)}%</span>
                  </div>
                </Field>
                <Field label="Capitalización">
                  <select className="sim-sel" value={capitalizacion}
                    onChange={e => setCapitalizacion(+e.target.value)}>
                    {Object.entries(capMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                {/* Mostrar TEA equivalente calculada */}
                <div className="sim-total-row">
                  <span>TEA equivalente</span>
                  <strong>
                    {((Math.pow(1 + tasaTNA / capitalizacion, capitalizacion) - 1) * 100).toFixed(4)}%
                  </strong>
                </div>
              </>
            )}

            <Field label="Seg. Desgravamen mensual">
              <div className="sim-ig">
                <input type="number" step="0.0001" value={tasaDesgravamen}
                  onChange={e => setTasaDesgravamen(+e.target.value)} />
                <span className="sim-suf">{(tasaDesgravamen * 100).toFixed(2)}%</span>
              </div>
            </Field>

            <Field label="Seg. Vehicular anual">
              <div className="sim-ig">
                <input type="number" step="0.001" value={tasaVehicularAnual}
                  onChange={e => setTasaVehicularAnual(+e.target.value)} />
                <span className="sim-suf">{(tasaVehicularAnual * 100).toFixed(1)}%</span>
              </div>
            </Field>

            {/* Período de gracia */}
            <div className="sim-card-header" style={{ marginTop: 16 }}>
              <Calendar size={16} color="#7c3aed" />
              <h3 style={{ fontSize: 14, color: '#7c3aed' }}>Período de Gracia</h3>
            </div>

            <Field label="¿Desea período de gracia?">
              <select className="sim-sel" value={tieneGracia ? 1 : 2}
                onChange={e => { setTieneGracia(+e.target.value === 1); setErrorGracia('') }}>
                <option value={2}>No</option>
                <option value={1}>Sí</option>
              </select>
            </Field>

            {tieneGracia && (<>
              <Field label="Meses de gracia">
                <input className="sim-solo" type="number" min="1" value={mesesGracia}
                  onChange={e => { setMesesGracia(+e.target.value); setErrorGracia('') }} />
              </Field>
              <Field label="Tipo de gracia">
                <select className="sim-sel" value={tipoGracia}
                  onChange={e => setTipoGracia(+e.target.value)}>
                  <option value={1}>Total — intereses se capitalizan, no paga nada</option>
                  <option value={2}>Parcial — solo paga intereses y seguros</option>
                </select>
              </Field>
              {errorGracia && (
                <div className="sim-error">
                  <AlertCircle size={15} /> {errorGracia}
                </div>
              )}
            </>)}
          </div>

          {/* Costos y Gastos */}
          <div className="panel">
            <div className="sim-card-header">
              <DollarSign size={18} color="#f59e0b" />
              <h3>Costos y Gastos Iniciales</h3>
            </div>
            {([
              ['Costos Notariales',  costosNotariales,  setCostosNotariales],
              ['Costos Registrales', costosRegistrales, setCostosRegistrales],
              ['Tasación',           tasacion,          setTasacion],
              ['Otros Gastos',       otrosGastos,       setOtrosGastos],
            ] as [string, number, (n: number) => void][]).map(([lbl, val, set]) => (
              <Field key={lbl} label={lbl}>
                <div className="sim-ig">
                  <span className="sim-pre">S/</span>
                  <input type="number" value={val} onChange={e => set(+e.target.value)} />
                </div>
              </Field>
            ))}
            <div className="sim-total-row">
              <span>Total costos iniciales</span>
              <strong>S/ {fmt(costosNotariales + costosRegistrales + tasacion + otrosGastos)}</strong>
            </div>
          </div>
        </div>

        <button className="sim-btn" onClick={simular}>
          <Calculator size={18} /> Simular Financiamiento
        </button>

        {/* ── RESULTADOS ── */}
        {mostrarResultados && resumen && (<>

          <section className="stats">
            <div className="stat-card">
              <div className="stat-icon blue"><DollarSign size={26} /></div>
              <div>
                <p>Cuota mensual aprox.</p>
                <h2>S/ {fmt(resumen.cuotaMensual)}</h2>
                <small>Incluye seguros</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Car size={26} /></div>
              <div>
                <p>Monto financiado</p>
                <h2>S/ {fmt(resumen.prestamo)}</h2>
                <small>Plazo: {resumen.plazoMeses} meses</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><TrendingUp size={26} /></div>
              <div>
                <p>TCEA</p>
                <h2>{resumen.tcea}%</h2>
                <small>Tasa de Costo Efectivo Anual</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><BarChart2 size={26} /></div>
              <div>
                <p>Total a pagar</p>
                <h2>S/ {fmt(resumen.totalPagar)}</h2>
                <small>Incluye costos iniciales</small>
              </div>
            </div>
          </section>

          <div className="panel sim-results-panel">
            <div className="sim-tabs">
              <button className={activeTab === 'resumen'    ? 'sim-tab active' : 'sim-tab'}
                onClick={() => setActiveTab('resumen')}>Resumen financiero</button>
              <button className={activeTab === 'cronograma' ? 'sim-tab active' : 'sim-tab'}
                onClick={() => setActiveTab('cronograma')}>Cronograma de pagos</button>
            </div>

            {activeTab === 'resumen' && (
              <div className="sim-resumen-grid">
                {/* Tasas */}
                <div className="sim-resumen-section-title">Tasas</div>
                {([
                  ['TEA',     `${resumen.tea}%`],
                  ['TEM',     `${resumen.tem}%`],
                  ['TIR Mensual', `${resumen.tirMensual}%`],
                  ['TCEA',    `${resumen.tcea}%`],
                ] as [string, string][]).map(([lbl, val]) => (
                  <div key={lbl} className="sim-resumen-row">
                    <span className="sim-rl">{lbl}</span>
                    <span className="sim-rv">{val}</span>
                  </div>
                ))}

                {/* Plazos */}
                <div className="sim-resumen-section-title">Plazos</div>
                {([
                  ['Plazo total',           `${resumen.plazoMeses} meses`],
                  ['Meses de gracia',       `${resumen.mesesGracia} meses`],
                  ['Meses de amortización', `${resumen.mesesAmortizacion} meses`],
                ] as [string, string][]).map(([lbl, val]) => (
                  <div key={lbl} className="sim-resumen-row">
                    <span className="sim-rl">{lbl}</span>
                    <span className="sim-rv">{val}</span>
                  </div>
                ))}

                {/* Totales */}
                <div className="sim-resumen-section-title">Totales</div>
                {([
                  ['Total interés',           `S/ ${fmt(resumen.totalInteres)}`],
                  ['Total amortización',      `S/ ${fmt(resumen.totalAmortizacion)}`],
                  ['Total cuotas base',       `S/ ${fmt(resumen.totalCuotasBase)}`],
                  ['Total seg. desgravamen',  `S/ ${fmt(resumen.totalSeguroDesgravamen)}`],
                  ['Total seg. vehicular',    `S/ ${fmt(resumen.totalSeguroVehicular)}`],
                  ['Total costos iniciales',  `S/ ${fmt(resumen.totalCostos)}`],
                  ['Total a pagar',           `S/ ${fmt(resumen.totalPagar)}`],
                ] as [string, string][]).map(([lbl, val]) => (
                  <div key={lbl} className="sim-resumen-row">
                    <span className="sim-rl">{lbl}</span>
                    <span className="sim-rv">{val}</span>
                  </div>
                ))}

                {/* Indicadores */}
                <div className="sim-resumen-section-title">Indicadores</div>
                <div className="sim-resumen-row">
                  <span className="sim-rl">VAN</span>
                  <span className="sim-rv" style={{ color: resumen.van >= 0 ? '#16a34a' : '#dc2626' }}>
                    S/ {fmt(resumen.van)} {resumen.van >= 0 ? '✓ Conviene' : '✗ No conviene'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'cronograma' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="sim-table">
                  <thead>
                    <tr>
                      {['Mes', 'Tipo', 'Cuota Base', 'Cuota Total', 'Interés', 'Amortización', 'Seg. Desgrav.', 'Seg. Veh.', 'Saldo'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cronograma.map((item, i) => (
                      <tr key={item.mes} className={i % 2 !== 0 ? 'sim-alt' : ''}>
                        <td><span className="badge eval">{item.mes}</span></td>
                        <td>
                          {item.tipo === 'gracia_total'   && <span className="badge red">G. Total</span>}
                          {item.tipo === 'gracia_parcial' && <span className="badge orange">G. Parcial</span>}
                          {item.tipo === 'normal'         && <span className="badge green">Normal</span>}
                        </td>
                        <td>S/ {fmt(item.cuotaBase)}</td>
                        <td><strong>S/ {fmt(item.cuotaTotal)}</strong></td>
                        <td className="sim-red">S/ {fmt(item.interes)}</td>
                        <td className="sim-green">S/ {fmt(item.amortizacion)}</td>
                        <td>S/ {fmt(item.seguroDesgravamen)}</td>
                        <td>S/ {fmt(item.seguroVehicular)}</td>
                        <td style={{ color: '#64748b' }}>S/ {fmt(item.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>)}
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sim-field">
      <label>{label}</label>
      {children}
    </div>
  )
}