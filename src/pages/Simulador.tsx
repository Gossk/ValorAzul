import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Car, Bell, Menu, Calculator,
  TrendingUp, DollarSign, BarChart2, Calendar,
  AlertCircle, Search, Percent, Save, LogOut, X,
} from 'lucide-react'
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../context/AuthContext'
import {
  configNav,
  filtrarPorRol,
  mainNav,
} from '../components/navConfig'
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
  // — Detalle de lo que escogió el cliente —
  vehiculoNombre: string
  precioVehiculo: number
  monedaOriginal: string
  cuotaInicialPorc: number
  cuotaInicialMonto: number
  tipoGraciaLabel: string
}

interface Vehiculo {
  nombre: string
  precio: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo local de vehículos (referencial) para el autocompletado.
// Puedes agregar/quitar filas libremente sin tocar la lógica de cálculo.
// Los precios están en Soles (S/) referenciales.
// ─────────────────────────────────────────────────────────────────────────────
const VEHICULOS: Vehiculo[] = [
  // Toyota
  { nombre: 'Toyota Yaris',            precio: 65000  },
  { nombre: 'Toyota Yaris Cross',      precio: 92000  },
  { nombre: 'Toyota Corolla',          precio: 89000  },
  { nombre: 'Toyota Corolla Cross',    precio: 118000 },
  { nombre: 'Toyota RAV4',             precio: 145000 },
  { nombre: 'Toyota Rush',             precio: 95000  },
  { nombre: 'Toyota Hilux',            precio: 130000 },
  { nombre: 'Toyota Fortuner',         precio: 195000 },
  { nombre: 'Toyota Land Cruiser Prado', precio: 320000 },

  // Hyundai
  { nombre: 'Hyundai Accent',          precio: 62000  },
  { nombre: 'Hyundai Elantra',         precio: 78000  },
  { nombre: 'Hyundai Creta',           precio: 89000  },
  { nombre: 'Hyundai Tucson',          precio: 118000 },
  { nombre: 'Hyundai Santa Fe',        precio: 175000 },
  { nombre: 'Hyundai Palisade',        precio: 230000 },

  // Kia
  { nombre: 'Kia Picanto',             precio: 40000  },
  { nombre: 'Kia Rio',                 precio: 58000  },
  { nombre: 'Kia Seltos',              precio: 82000  },
  { nombre: 'Kia Sportage',            precio: 112000 },
  { nombre: 'Kia Sorento',             precio: 145000 },
  { nombre: 'Kia Carnival',            precio: 175000 },

  // Nissan
  { nombre: 'Nissan Versa',            precio: 60000  },
  { nombre: 'Nissan Sentra',           precio: 82000  },
  { nombre: 'Nissan Kicks',            precio: 78000  },
  { nombre: 'Nissan X-Trail',          precio: 120000 },
  { nombre: 'Nissan Frontier',         precio: 135000 },

  // Chevrolet
  { nombre: 'Chevrolet Sail',          precio: 48000  },
  { nombre: 'Chevrolet Onix',          precio: 55000  },
  { nombre: 'Chevrolet Tracker',       precio: 95000  },
  { nombre: 'Chevrolet Captiva',       precio: 118000 },

  // Volkswagen
  { nombre: 'Volkswagen Gol',          precio: 52000  },
  { nombre: 'Volkswagen Polo',         precio: 65000  },
  { nombre: 'Volkswagen Vento',        precio: 75000  },
  { nombre: 'Volkswagen T-Cross',      precio: 95000  },
  { nombre: 'Volkswagen Tiguan',       precio: 130000 },
  { nombre: 'Volkswagen Amarok',       precio: 155000 },

  // Suzuki
  { nombre: 'Suzuki Alto',             precio: 25000  },
  { nombre: 'Suzuki Swift',            precio: 54000  },
  { nombre: 'Suzuki Baleno',           precio: 58000  },
  { nombre: 'Suzuki Vitara',           precio: 90000  },
  { nombre: 'Suzuki S-Cross',          precio: 98000  },
  { nombre: 'Suzuki Jimny',            precio: 105000 },

  // Honda
  { nombre: 'Honda City',              precio: 80000  },
  { nombre: 'Honda Civic',             precio: 105000 },
  { nombre: 'Honda HR-V',              precio: 118000 },
  { nombre: 'Honda CR-V',              precio: 140000 },

  // Mazda
  { nombre: 'Mazda 2',                 precio: 65000  },
  { nombre: 'Mazda 3',                 precio: 92000  },
  { nombre: 'Mazda CX-30',             precio: 118000 },
  { nombre: 'Mazda CX-5',              precio: 138000 },
  { nombre: 'Mazda CX-9',              precio: 210000 },

  // Mitsubishi
  { nombre: 'Mitsubishi Mirage',       precio: 55000  },
  { nombre: 'Mitsubishi ASX',          precio: 95000  },
  { nombre: 'Mitsubishi Outlander',    precio: 125000 },
  { nombre: 'Mitsubishi Montero Sport',precio: 175000 },
  { nombre: 'Mitsubishi L200',         precio: 135000 },

  // Renault
  { nombre: 'Renault Kwid',            precio: 46000  },
  { nombre: 'Renault Logan',           precio: 55000  },
  { nombre: 'Renault Duster',          precio: 78000  },
  { nombre: 'Renault Koleos',          precio: 118000 },

  // Ford
  { nombre: 'Ford EcoSport',           precio: 85000  },
  { nombre: 'Ford Territory',          precio: 125000 },
  { nombre: 'Ford Ranger',             precio: 155000 },
  { nombre: 'Ford Explorer',           precio: 245000 },

  // Jeep
  { nombre: 'Jeep Renegade',           precio: 115000 },
  { nombre: 'Jeep Compass',            precio: 138000 },
  { nombre: 'Jeep Grand Cherokee',     precio: 275000 },

  // Otros
  { nombre: 'Subaru XV',               precio: 118000 },
  { nombre: 'Subaru Forester',         precio: 145000 },
  { nombre: 'Peugeot 208',             precio: 68000  },
  { nombre: 'Peugeot 2008',            precio: 105000 },
  { nombre: 'Citroën C3',              precio: 62000  },
  { nombre: 'BYD Song Plus',           precio: 158000 },
  { nombre: 'BYD Yuan Plus',           precio: 145000 },
  { nombre: 'MG ZS',                   precio: 78000  },
  { nombre: 'MG HS',                   precio: 108000 },
]

const fmt = (n: number) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const n = (s: string) => {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}

// — Sanitizadores de input —
// Solo dígitos y un único punto decimal, con tope de caracteres.
const soloNumeros = (value: string, maxLen = 12): string => {
  let limpio = value.replace(/[^0-9.]/g, '')
  const partes = limpio.split('.')
  if (partes.length > 2) {
    limpio = partes[0] + '.' + partes.slice(1).join('')
  }
  return limpio.slice(0, maxLen)
}

// Solo dígitos enteros (para plazos y meses de gracia).
const soloEnteros = (value: string, maxLen = 3): string =>
  value.replace(/[^0-9]/g, '').slice(0, maxLen)

// Solo letras, números de modelo y espacios para el buscador (permite "RAV4", "X-Trail").
const soloTextoVehiculo = (value: string): string =>
  value.replace(/[^a-zA-Z0-9À-ÿñÑ\s-]/g, '').slice(0, 40)

export default function Simulador() {
  const navigate = useNavigate()
  const location = useLocation()
  const { perfil, user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Menú compartido con el Layout principal (mismo aspecto en toda la app)
  const visibleMain   = filtrarPorRol(mainNav,   perfil?.rol)
  const visibleConfig = filtrarPorRol(configNav, perfil?.rol)

  // Estado del guardado en Firestore
  const [guardando,   setGuardando]   = useState(false)
  const [guardadoMsg, setGuardadoMsg] = useState('')

  // — Buscador de vehículo (lupa + autocompletado) —
  const [busquedaVehiculo,     setBusquedaVehiculo]     = useState('')
  const [mostrarSugerencias,   setMostrarSugerencias]   = useState(false)
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null)

  // — Formato de ingreso: false = decimal (0.20), true = porcentaje (20) —
  const [enPorcentaje,       setEnPorcentaje]       = useState(false)

  // — Datos del vehículo — (el precio se fija solo al seleccionar del buscador)
  const [precioVehiculo,     setPrecioVehiculo]     = useState('')
  const [cuotaInicialPorc,   setCuotaInicialPorc]   = useState('')
  const [tipoMoneda,         setTipoMoneda]         = useState(1)
  const [tipoCambio,         setTipoCambio]         = useState('')
  const [tipoPlazo,          setTipoPlazo]          = useState(1)
  const [plazoMeses,         setPlazoMeses]         = useState('')
  const [plazoAnios,         setPlazoAnios]         = useState('')

  // — Tipo de tasa —
  const [tipoTasa,           setTipoTasa]           = useState(1)
  const [tasaTEA,            setTasaTEA]            = useState('')
  const [tasaTNA,            setTasaTNA]            = useState('')
  const [capitalizacion,     setCapitalizacion]     = useState(12)

  // — Seguros —
  const [tasaDesgravamen,    setTasaDesgravamen]    = useState('')
  const [tasaVehicularAnual, setTasaVehicularAnual] = useState('')

  // — Período de gracia —
  const [tieneGracia,        setTieneGracia]        = useState(false)
  const [mesesGracia,        setMesesGracia]        = useState('')
  const [tipoGracia,         setTipoGracia]         = useState(1)

  // — Costos iniciales — (opcionales: vacío = S/ 0.00)
  const [costosNotariales,   setCostosNotariales]   = useState('')
  const [costosRegistrales,  setCostosRegistrales]  = useState('')
  const [tasacion,           setTasacion]           = useState('')
  const [otrosGastos,        setOtrosGastos]        = useState('')

  // — Resultados —
  const [cronograma,         setCronograma]         = useState<CronogramaItem[]>([])
  const [resumen,            setResumen]            = useState<Resumen | null>(null)
  const [mostrarResultados,  setMostrarResultados]  = useState(false)
  const [activeTab,          setActiveTab]          = useState<'resumen' | 'cronograma'>('resumen')
  const [error,              setError]              = useState('')

  // ── conversión decimal ⇄ porcentaje ─────────────────────────────────────
  // Convierte cualquier campo de tasa/cuota al valor decimal real para calcular.
  const dec = (s: string): number => enPorcentaje ? n(s) / 100 : n(s)

  // Al cambiar de modo, convierte los valores ya escritos para no perderlos.
  const cambiarModo = (porcentaje: boolean) => {
    if (porcentaje === enPorcentaje) return
    const convertir = (s: string): string => {
      if (s.trim() === '') return ''
      const v = parseFloat(s)
      if (!Number.isFinite(v)) return ''
      const nuevo = porcentaje ? v * 100 : v / 100
      // Elimina residuos de punto flotante (0.35000000000000003 → 0.35)
      return String(+nuevo.toFixed(8))
    }
    setCuotaInicialPorc(convertir(cuotaInicialPorc))
    setTasaTEA(convertir(tasaTEA))
    setTasaTNA(convertir(tasaTNA))
    setTasaDesgravamen(convertir(tasaDesgravamen))
    setTasaVehicularAnual(convertir(tasaVehicularAnual))
    setEnPorcentaje(porcentaje)
    setError('')
  }

  // ── buscador de vehículo ────────────────────────────────────────────────
  const sugerencias = busquedaVehiculo.trim().length > 0
    ? VEHICULOS.filter(v =>
        v.nombre.toLowerCase().includes(busquedaVehiculo.trim().toLowerCase())
      ).slice(0, 8)
    : []

  const handleBusquedaChange = (value: string) => {
    setBusquedaVehiculo(soloTextoVehiculo(value))
    setMostrarSugerencias(true)
    // Si el usuario edita el texto de búsqueda, el precio fijado ya no aplica
    setVehiculoSeleccionado(null)
    setPrecioVehiculo('')
  }

  const seleccionarVehiculo = (v: Vehiculo) => {
    setBusquedaVehiculo(v.nombre)
    setPrecioVehiculo(v.precio.toString())
    setVehiculoSeleccionado(v)
    setMostrarSugerencias(false)
    setError('')
  }

  // ── Reabrir una simulación previa (desde "Mis Simulaciones") ──────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('valorazul.reabrirSimulacion')
      if (!raw) return
      sessionStorage.removeItem('valorazul.reabrirSimulacion')
      const e = JSON.parse(raw)

      // Modo de ingreso (decimal / porcentaje)
      if (typeof e.enPorcentaje === 'boolean') setEnPorcentaje(e.enPorcentaje)

      // Vehículo seleccionado (recupera del catálogo si existe)
      if (e.vehiculoNombre) {
        const enCatalogo = VEHICULOS.find(v => v.nombre === e.vehiculoNombre)
        if (enCatalogo) {
          setVehiculoSeleccionado(enCatalogo)
          setBusquedaVehiculo(enCatalogo.nombre)
          setPrecioVehiculo(enCatalogo.precio.toString())
        } else {
          setBusquedaVehiculo(e.vehiculoNombre)
        }
      }
      if (e.precioVehiculo     !== undefined && e.precioVehiculo !== '') setPrecioVehiculo(String(e.precioVehiculo))
      if (e.cuotaInicialPorc   !== undefined) setCuotaInicialPorc(String(e.cuotaInicialPorc))
      if (e.tipoMoneda         !== undefined) setTipoMoneda(Number(e.tipoMoneda))
      if (e.tipoCambio         !== undefined) setTipoCambio(String(e.tipoCambio))
      if (e.tipoPlazo          !== undefined) setTipoPlazo(Number(e.tipoPlazo))
      if (e.plazoMeses         !== undefined) setPlazoMeses(String(e.plazoMeses))
      if (e.plazoAnios         !== undefined) setPlazoAnios(String(e.plazoAnios))
      if (e.tipoTasa           !== undefined) setTipoTasa(Number(e.tipoTasa))
      if (e.tasaTEA            !== undefined) setTasaTEA(String(e.tasaTEA))
      if (e.tasaTNA            !== undefined) setTasaTNA(String(e.tasaTNA))
      if (e.capitalizacion     !== undefined) setCapitalizacion(Number(e.capitalizacion))
      if (e.tasaDesgravamen    !== undefined) setTasaDesgravamen(String(e.tasaDesgravamen))
      if (e.tasaVehicularAnual !== undefined) setTasaVehicularAnual(String(e.tasaVehicularAnual))
      if (e.tieneGracia        !== undefined) setTieneGracia(!!e.tieneGracia)
      if (e.mesesGracia        !== undefined) setMesesGracia(String(e.mesesGracia))
      if (e.tipoGracia         !== undefined) setTipoGracia(Number(e.tipoGracia))
      if (e.costosNotariales   !== undefined) setCostosNotariales(String(e.costosNotariales))
      if (e.costosRegistrales  !== undefined) setCostosRegistrales(String(e.costosRegistrales))
      if (e.tasacion           !== undefined) setTasacion(String(e.tasacion))
      if (e.otrosGastos        !== undefined) setOtrosGastos(String(e.otrosGastos))
    } catch (err) {
      console.warn('[Simulador] No se pudo reabrir la simulación:', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── valores numéricos derivados para cálculos en tiempo real ──────────────
  const _precio    = n(precioVehiculo)
  const _cuotaDec  = dec(cuotaInicialPorc)
  const _cambio    = n(tipoCambio)
  const _tnaDec    = dec(tasaTNA)
  const _teaDec    = dec(tasaTEA)
  const _desgDec   = dec(tasaDesgravamen)
  const _vehDec    = dec(tasaVehicularAnual)
  const _notarial  = n(costosNotariales)
  const _registral = n(costosRegistrales)
  const _tasacion  = n(tasacion)
  const _otros     = n(otrosGastos)

  const precioFinalDisplay = tipoMoneda === 2 ? _precio * _cambio : _precio

  // Sufijo que muestra la representación contraria (apoyo visual al cliente)
  const sufijoTasa = (valorDec: number): string =>
    enPorcentaje
      ? `= ${+valorDec.toFixed(8)}`                 // en modo %, muestra el decimal
      : `${(valorDec * 100).toFixed(2)}%`           // en modo decimal, muestra el %

  // ── CÁLCULO TEA/TEM ────────────────────────────────────────────────────────
  const calcularTEM = (teaVal: number, tnaVal: number): { tea: number; tem: number } => {
    if (tipoTasa === 1) {
      const tea = teaVal
      const tem = Math.pow(1 + tea, 1 / 12) - 1
      return { tea, tem }
    } else {
      const tea = Math.pow(1 + tnaVal / capitalizacion, capitalizacion) - 1
      const tem = Math.pow(1 + tea, 1 / 12) - 1
      return { tea, tem }
    }
  }

  // ── VALIDACIÓN CENTRALIZADA ───────────────────────────────────────────────
  // Devuelve el primer mensaje de error encontrado, o '' si todo es válido.
  const validar = (): string => {
    const precioNum       = n(precioVehiculo)
    const cuotaInicialDec = dec(cuotaInicialPorc)
    const tipoCambioNum   = n(tipoCambio)
    const plazoMesesNum   = n(plazoMeses)
    const plazoAniosNum   = n(plazoAnios)
    const mesesGraciaNum  = n(mesesGracia)

    const ej = (decimal: string, porc: string) => enPorcentaje ? porc : decimal

    // — Campos obligatorios —
    if (precioVehiculo.trim() === '')
      return 'Selecciona un vehículo con el buscador para fijar el precio.'
    if (tipoMoneda === 2 && tipoCambio.trim() === '')
      return 'Ingresa el tipo de cambio para convertir de dólares a soles.'
    if (cuotaInicialPorc.trim() === '')
      return `Ingresa la cuota inicial (ej: ${ej('0.20', '20')} para 20%).`
    if (tipoPlazo === 1 && plazoMeses.trim() === '')
      return 'Ingresa el plazo en meses.'
    if (tipoPlazo === 2 && plazoAnios.trim() === '')
      return 'Ingresa el plazo en años.'
    if (tipoTasa === 1 && tasaTEA.trim() === '')
      return `Ingresa la TEA (ej: ${ej('0.11', '11')} para 11%).`
    if (tipoTasa === 2 && tasaTNA.trim() === '')
      return `Ingresa la TNA (ej: ${ej('0.10', '10')} para 10%).`
    if (tasaDesgravamen.trim() === '')
      return `Ingresa la tasa mensual del seguro de desgravamen (ej: ${ej('0.0035', '0.35')}).`
    if (tasaVehicularAnual.trim() === '')
      return `Ingresa la tasa anual del seguro vehicular (ej: ${ej('0.036', '3.6')}).`
    if (tieneGracia && mesesGracia.trim() === '')
      return 'Ingresa la cantidad de meses de gracia.'

    // — Rangos del vehículo —
    const precioFinal = tipoMoneda === 2 ? precioNum * tipoCambioNum : precioNum
    if (precioNum <= 0)
      return 'El precio del vehículo debe ser mayor a 0.'
    if (tipoMoneda === 2 && (tipoCambioNum < 3.0 || tipoCambioNum > 5.0))
      return 'El tipo de cambio debe estar entre 3.00 y 5.00.'
    if (precioFinal < 5000)
      return 'El precio del vehículo debe ser al menos S/ 5,000.'
    if (precioFinal > 500000)
      return 'El precio del vehículo no puede superar S/ 500,000.'

    // — Cuota inicial —
    if (cuotaInicialDec < 0.10)
      return `La cuota inicial mínima es el 10% del precio (ingresa ${ej('0.10', '10')} o más).`
    if (cuotaInicialDec >= 1)
      return 'La cuota inicial no puede ser igual o mayor al 100%.'

    // — Plazo (máximo 5 años) —
    const plazoFinal = tipoPlazo === 1 ? plazoMesesNum : plazoAniosNum * 12
    if (!Number.isInteger(plazoFinal) || plazoFinal < 6)
      return 'El plazo mínimo es 6 meses.'
    if (plazoFinal > 60)
      return 'El plazo máximo es 60 meses (5 años).'

    // — Tasas —
    const tasaEfectivaAnual = tipoTasa === 1
      ? dec(tasaTEA)
      : Math.pow(1 + dec(tasaTNA) / capitalizacion, capitalizacion) - 1
    if (tasaEfectivaAnual < 0.01)
      return `La tasa efectiva anual no puede ser menor al 1% (ingresa ${ej('0.01', '1')} o más).`
    if (tasaEfectivaAnual > 0.80)
      return 'La tasa efectiva anual no puede superar el 80%.'

    // — Seguros —
    const tasaDesgDec = dec(tasaDesgravamen)
    const tasaVehDec  = dec(tasaVehicularAnual)
    if (tasaDesgDec < 0.0001 || tasaDesgDec > 0.01)
      return `El seguro de desgravamen mensual debe estar entre 0.01% y 1.00% (${ej('0.0001 – 0.01', '0.01 – 1')}).`
    if (tasaVehDec < 0.01 || tasaVehDec > 0.08)
      return `El seguro vehicular anual debe estar entre 1% y 8% (${ej('0.01 – 0.08', '1 – 8')}).`

    // — Costos iniciales —
    const costos = [n(costosNotariales), n(costosRegistrales), n(tasacion), n(otrosGastos)]
    if (costos.some(c => c > 5000))
      return 'Ningún costo inicial puede superar S/ 5,000.'

    // — Período de gracia —
    if (tieneGracia) {
      if (mesesGraciaNum < 1)
        return 'Los meses de gracia deben ser al menos 1.'
      if (mesesGraciaNum > 6)
        return 'Los meses de gracia no pueden superar 6 meses.'
      if (mesesGraciaNum >= plazoFinal)
        return 'Los meses de gracia deben ser menores que el plazo total.'
    }

    return ''
  }

  // ── SIMULACIÓN PRINCIPAL ───────────────────────────────────────────────────
  const simular = () => {
    const msgError = validar()
    if (msgError) {
      setError(msgError)
      setMostrarResultados(false)
      return
    }
    setError('')

    const precioNum       = n(precioVehiculo)
    const cuotaInicialDec = dec(cuotaInicialPorc)
    const tipoCambioNum   = n(tipoCambio)
    const tasaDesgDec     = dec(tasaDesgravamen)
    const tasaVehDec      = dec(tasaVehicularAnual)
    const mesesGraciaNum  = n(mesesGracia)
    const plazoFinal      = tipoPlazo === 1 ? n(plazoMeses) : n(plazoAnios) * 12

    const precio = tipoMoneda === 2 ? precioNum * tipoCambioNum : precioNum
    const { tea, tem: TEM } = calcularTEM(dec(tasaTEA), dec(tasaTNA))
    const cuotaInicialMonto = precio * cuotaInicialDec
    const prestamoInicial = precio - cuotaInicialMonto
    let saldo = prestamoInicial

    const segVehMensual = (precio * tasaVehDec) / 12
    const totalCostosIniciales = n(costosNotariales) + n(costosRegistrales) + n(tasacion) + n(otrosGastos)
    const gracia = tieneGracia ? mesesGraciaNum : 0
    const mesesAmortiza = plazoFinal - gracia

    let cuotaBase = tieneGracia
      ? prestamoInicial * (TEM * Math.pow(1 + TEM, mesesAmortiza)) / (Math.pow(1 + TEM, mesesAmortiza) - 1)
      : prestamoInicial * (TEM * Math.pow(1 + TEM, plazoFinal))    / (Math.pow(1 + TEM, plazoFinal)    - 1)

    const nuevoCron: CronogramaItem[] = []
    const cuotasPorMes: number[] = []

    let totInt = 0, totAmort = 0, totDesg = 0, totSegVeh = 0, totPagado = 0

    for (let mes = 1; mes <= plazoFinal; mes++) {
      let intMes: number, desgMes: number, amort: number, cuotaTotal: number, segVehMes: number
      let tipo: CronogramaItem['tipo'] = 'normal'

      if (mes <= gracia) {
        intMes = saldo * TEM
        if (tipoGracia === 1) {
          // Gracia total: no paga nada, los intereses se capitalizan
          tipo       = 'gracia_total'
          desgMes    = 0
          segVehMes  = 0
          amort      = 0
          saldo      = saldo + intMes
          cuotaTotal = 0
        } else {
          // Gracia parcial: paga solo intereses y seguros (sin amortizar)
          tipo       = 'gracia_parcial'
          desgMes    = saldo * tasaDesgDec
          segVehMes  = segVehMensual
          amort      = 0
          cuotaTotal = intMes + segVehMes + desgMes
        }
      } else {
        // Con gracia total, la cuota se recalcula sobre el saldo capitalizado
        if (mes === gracia + 1 && gracia > 0 && tipoGracia === 1) {
          cuotaBase = saldo * (TEM * Math.pow(1 + TEM, mesesAmortiza)) / (Math.pow(1 + TEM, mesesAmortiza) - 1)
        }
        intMes    = saldo * TEM
        desgMes   = saldo * tasaDesgDec
        segVehMes = segVehMensual
        amort     = cuotaBase - intMes
        saldo     = saldo - amort
        if (saldo < 0.01) saldo = 0
        cuotaTotal = cuotaBase + segVehMes + desgMes
      }

      cuotasPorMes.push(cuotaTotal)
      totInt    += intMes
      totAmort  += amort
      totDesg   += desgMes
      totSegVeh += segVehMes
      totPagado += cuotaTotal

      // — Cuota base según método francés —
      //   • normal          → cuota francesa constante (interés + amortización)
      //   • gracia parcial  → solo se paga el interés del período (no amortiza),
      //                        por eso la cuota base = interés del mes
      //   • gracia total    → no se paga nada, cuota base = 0
      const cuotaBaseFila =
        tipo === 'gracia_total'   ? 0 :
        tipo === 'gracia_parcial' ? +intMes.toFixed(2) :
                                    +cuotaBase.toFixed(2)

      nuevoCron.push({
        mes, tipo,
        cuotaBase:         cuotaBaseFila,
        cuotaTotal:        +cuotaTotal.toFixed(2),
        interes:           +intMes.toFixed(2),
        amortizacion:      +amort.toFixed(2),
        seguroDesgravamen: +desgMes.toFixed(2),
        seguroVehicular:   +segVehMes.toFixed(2),
        saldo:             +saldo.toFixed(2),
      })
    }

    const flujo0 = prestamoInicial - totalCostosIniciales

    const vanAt = (tasa: number): number => {
      let v = flujo0
      for (let i = 0; i < plazoFinal; i++) {
        v += (-cuotasPorMes[i]) / Math.pow(1 + tasa, i + 1)
      }
      return v
    }

    const van = vanAt(TEM)

    // ── TIR: Newton-Raphson con protecciones numéricas ────────────────────────
    let tirMensual = TEM > 0 ? TEM : 0.01
    for (let iter = 0; iter < 1000; iter++) {
      let f = flujo0, df = 0
      for (let i = 0; i < plazoFinal; i++) {
        const t = i + 1
        f  += (-cuotasPorMes[i]) / Math.pow(1 + tirMensual, t)
        df += (t * cuotasPorMes[i]) / Math.pow(1 + tirMensual, t + 1)
      }
      if (Math.abs(df) < 1e-12) break            // evita división entre ~0
      const delta = f / df
      tirMensual -= delta
      if (!Number.isFinite(tirMensual) || tirMensual <= -0.999) {
        tirMensual = TEM                          // si diverge, usa la TEM como referencia
        break
      }
      if (Math.abs(delta) < 1e-15) break
    }

    const tcea = Math.pow(1 + tirMensual, 12) - 1

    const primerMesNormal = nuevoCron.find(c => c.tipo === 'normal')
    const cuotaMensualBase = primerMesNormal ? primerMesNormal.cuotaBase : +cuotaBase.toFixed(2)

    setResumen({
      totalInteres:           +totInt.toFixed(2),
      totalAmortizacion:      +totAmort.toFixed(2),
      totalCuotasBase:        +(cuotaBase * mesesAmortiza).toFixed(2),
      totalSeguroDesgravamen: +totDesg.toFixed(2),
      totalSeguroVehicular:   +totSegVeh.toFixed(2),
      totalCostos:            +totalCostosIniciales.toFixed(2),
      totalPagar:             +(totPagado + totalCostosIniciales).toFixed(2),
      van:                    +van.toFixed(2),
      tirMensual:             tirMensual * 100,
      tcea:                   tcea * 100,
      tea:                    +(tea * 100).toFixed(4),
      tem:                    +(TEM * 100).toFixed(6),
      cuotaMensual:           cuotaMensualBase,
      prestamo:               +prestamoInicial.toFixed(2),
      plazoMeses:             plazoFinal,
      mesesGracia:            gracia,
      mesesAmortizacion:      mesesAmortiza,
      vehiculoNombre:         vehiculoSeleccionado
                                ? vehiculoSeleccionado.nombre
                                : 'Vehículo no especificado',
      precioVehiculo:         +precio.toFixed(2),
      monedaOriginal:         tipoMoneda === 1 ? 'Soles (S/)' : `Dólares ($) — T.C. ${fmt(tipoCambioNum)}`,
      cuotaInicialPorc:       cuotaInicialDec * 100,
      cuotaInicialMonto:      +cuotaInicialMonto.toFixed(2),
      tipoGraciaLabel:        gracia === 0
                                ? 'Sin período de gracia'
                                : tipoGracia === 1 ? 'Gracia total' : 'Gracia parcial',
    })

    setCronograma(nuevoCron)
    setMostrarResultados(true)
    setActiveTab('resumen')
    setGuardadoMsg('')
  }

  // ── GUARDAR SIMULACIÓN EN FIRESTORE ────────────────────────────────────────
  // Guarda en DOS colecciones para satisfacer los dos roles:
  //   • simulaciones/{docId}  → lo que ve el CLIENTE en "Mis Simulaciones"
  //                              (con toda la entrada + resumen + cronograma).
  //   • historial/{docId}     → lo que ve el ADMIN en "Historial" y "Dashboard"
  //                              (compatible con el formato ya existente).
  // De esta forma cada simulación aparece automáticamente en las métricas
  // del administrador sin duplicar código.
  const guardarSimulacion = async () => {
    if (!user?.uid || !resumen) return
    setGuardando(true)
    setGuardadoMsg('')
    try {
      // 1) Detalle completo del cliente
      const entrada = {
        enPorcentaje,
        vehiculoNombre: vehiculoSeleccionado?.nombre ?? '',
        precioVehiculo, cuotaInicialPorc, tipoMoneda, tipoCambio,
        tipoPlazo, plazoMeses, plazoAnios,
        tipoTasa, tasaTEA, tasaTNA, capitalizacion,
        tasaDesgravamen, tasaVehicularAnual,
        tieneGracia, mesesGracia, tipoGracia,
        costosNotariales, costosRegistrales, tasacion, otrosGastos,
      }

      const fechaLegible = new Date().toLocaleDateString('es-PE')
      const nombreCliente = perfil?.nombre || perfil?.email || 'Cliente'

      // 2) Guardado detallado en `simulaciones` (dueño = user.uid)
      const simulacionRef = await addDoc(collection(db, 'simulaciones'), {
        uid:            user.uid,
        cliente:        nombreCliente,
        email:          perfil?.email ?? '',
        fecha:          fechaLegible,
        creadoEn:       Date.now(),
        creadoEnServer: serverTimestamp(),
        // Datos principales para las tarjetas de "Mis Simulaciones"
        precioVehiculo: resumen.precioVehiculo,
        vehiculo:       resumen.vehiculoNombre,
        moneda:         tipoMoneda === 2 ? 'Dólares' : 'Soles',
        prestamo:       resumen.prestamo,
        cuotaMensual:   resumen.cuotaMensual,
        plazoMeses:     resumen.plazoMeses,
        tcea:           resumen.tcea,
        tea:            resumen.tea,
        totalPagar:     resumen.totalPagar,
        estado:         'Guardada',
        entrada,
        resumen,
      })

      // 3) Guardado resumido en `historial` usando el MISMO id que la simulación.
      //    Así el estado que cambie el admin puede sincronizarse con "Mis Simulaciones".
      await setDoc(doc(db, 'historial', simulacionRef.id), {
        simulacionId: simulacionRef.id,
        uid:      user.uid,
        cliente:  nombreCliente,
        vehiculo: resumen.vehiculoNombre,
        tipo:     'Nuevo',              // por defecto; el admin puede cambiarlo luego
        monto:    Math.round(resumen.prestamo),
        cuota:    Math.round(resumen.cuotaMensual),
        plazo:    resumen.plazoMeses,
        estado:   'En evaluación',      // arranca en evaluación para el admin
        fecha:    fechaLegible,
        creadoEn: Date.now(),
        creadoEnServer: serverTimestamp(),
        // metadatos útiles para métricas
        tcea:            resumen.tcea,
        totalPagar:      resumen.totalPagar,
        cuotaInicialPct: resumen.cuotaInicialPorc,
      })

      setGuardadoMsg('¡Simulación guardada! Ya aparece en el historial.')
    } catch (err: any) {
      console.error(err)
      setGuardadoMsg('Error al guardar: ' + (err?.message || 'intenta más tarde'))
    } finally {
      setGuardando(false)
      setTimeout(() => setGuardadoMsg(''), 4000)
    }
  }

  const handleLogout = async () => {
    try { await logout() } catch {}
    navigate('/login')
  }

  // Orden explícito de mayor a menor frecuencia de capitalización
  const capOpciones: [number, string][] = [
    [360, 'Diaria (360 días)'],
    [12,  'Mensual'],
    [4,   'Trimestral'],
    [2,   'Semestral'],
    [1,   'Anual'],
  ]

  // TEA equivalente en tiempo real para TNA
  const teaEquivDisplay = _tnaDec > 0
    ? ((Math.pow(1 + _tnaDec / capitalizacion, capitalizacion) - 1) * 100).toFixed(4)
    : '0.0000'

  // Estilo de los botones del selector decimal/porcentaje
  const modoBtnStyle = (activo: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    background: activo ? '#6366f1' : 'transparent',
    color: activo ? '#fff' : '#94a3b8',
    transition: 'background 0.15s, color 0.15s',
  })

  return (
    <div className="dashboard-layout">

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
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
            <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
              <X size={20} />
            </button>
          </div>

          <p className="menu-title">PRINCIPAL</p>
          <nav className="menu">
            {visibleMain.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to
              return (
                <Link key={item.to} to={item.to} className={active ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                  <Icon size={18} /> {item.label}
                </Link>
              )
            })}
          </nav>

          {visibleConfig.length > 0 && (
            <>
              <p className="menu-title config">CONFIGURACIÓN</p>
              <nav className="menu">
                {visibleConfig.map((item) => {
                  const Icon = item.icon
                  const active = location.pathname === item.to
                  return (
                    <Link key={item.to} to={item.to} className={active ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                      <Icon size={18} /> {item.label}
                    </Link>
                  )
                })}
              </nav>
            </>
          )}
        </div>

        <div className="user-box">
          <div className="avatar">{(perfil?.nombre || 'U').charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{perfil?.nombre || 'Invitado'}</strong>
            <p>{perfil?.email || ''}</p>
            <p style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{perfil?.rol || 'Cliente'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(240,244,255,0.7)',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main">

        <header className="header">
          <div className="header-left">
            <button className="icon-btn menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
              <Menu size={20} />
            </button>
            <div>
              <h1>Simulador de Crédito</h1>
              <p>Calcula tu financiamiento vehicular</p>
            </div>
          </div>
          <div className="header-actions">
            <Bell size={22} />
            <div className="admin-avatar">{(perfil?.nombre || 'U').charAt(0).toUpperCase()}</div>
            <span>{perfil?.nombre || 'Invitado'}</span>
          </div>
        </header>

        <div className="date-box">
          <Calendar size={17} />
          {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {/* ── SELECTOR DE FORMATO decimal ⇄ porcentaje ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '0 0 14px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Percent size={14} /> Formato de tasas y cuota inicial:
          </span>
          <div style={{
            display: 'flex',
            border: '1px solid #3f3a6b',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <button style={modoBtnStyle(!enPorcentaje)} onClick={() => cambiarModo(false)}>
              Decimal
            </button>
            <button style={modoBtnStyle(enPorcentaje)} onClick={() => cambiarModo(true)}>
              Porcentaje
            </button>
          </div>
        </div>

        {/* ── FORMULARIO ── */}
        <div className="sim-grid">

          {/* Datos del Vehículo */}
          <div className="panel">
            <div className="sim-card-header">
              <Car size={18} color="#2563eb" />
              <h3>Datos del Vehículo</h3>
            </div>

            <Field label="Buscar vehículo">
              <div style={{ position: 'relative' }}>
                <div className="sim-ig" style={{ alignItems: 'center' }}>
                  <Search size={16} style={{ color: '#94a3b8', marginRight: 6, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Ej: Toyota Yaris"
                    value={busquedaVehiculo}
                    onChange={e => handleBusquedaChange(e.target.value)}
                    onFocus={() => setMostrarSugerencias(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                  />
                </div>

                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      background: '#1e1b3a',
                      border: '1px solid #3f3a6b',
                      borderRadius: 8,
                      maxHeight: 260,
                      overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                  >
                    {sugerencias.map(v => (
                      <div
                        key={v.nombre}
                        onMouseDown={() => seleccionarVehiculo(v)}
                        style={{
                          padding: '9px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: '#e2e8f0',
                          borderBottom: '1px solid #2d2a52',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#2d2a52')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span>{v.nombre}</span>
                        <span style={{ color: '#818cf8', fontWeight: 600 }}>S/ {fmt(v.precio)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {mostrarSugerencias && busquedaVehiculo.trim().length > 0 && sugerencias.length === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      background: '#1e1b3a',
                      border: '1px solid #3f3a6b',
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      color: '#94a3b8',
                    }}
                  >
                    Sin resultados. Prueba con otra marca o modelo.
                  </div>
                )}
              </div>

              {vehiculoSeleccionado && (
                <div style={{
                  marginTop: 6, fontSize: 12, color: '#818cf8',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Car size={13} /> Seleccionado: <strong>{vehiculoSeleccionado.nombre}</strong>
                </div>
              )}
            </Field>

            {/* Precio: se fija automáticamente al elegir el vehículo, no es editable */}
            <Field label="Precio del vehículo (según selección)">
              <div className="sim-ig" style={{ opacity: vehiculoSeleccionado ? 1 : 0.55 }}>
                <span className="sim-pre">{tipoMoneda === 1 ? 'S/' : '$'}</span>
                <input
                  type="text"
                  value={vehiculoSeleccionado ? fmt(_precio) : ''}
                  placeholder="Selecciona un vehículo arriba"
                  disabled
                  readOnly
                  style={{ cursor: 'not-allowed' }}
                />
              </div>
            </Field>

            <Field label="Moneda">
              <select className="sim-sel" value={tipoMoneda}
                onChange={e => { setTipoMoneda(+e.target.value); setError('') }}>
                <option value={1}>Soles (S/)</option>
                <option value={2}>Dólares ($)</option>
              </select>
            </Field>

            {tipoMoneda === 2 && (
              <Field label="Tipo de cambio (3.00 – 5.00)">
                <div className="sim-ig">
                  <input
                    type="text" inputMode="decimal"
                    placeholder="Ej: 3.50"
                    value={tipoCambio}
                    onChange={e => { setTipoCambio(soloNumeros(e.target.value, 6)); setError('') }}
                  />
                  <span className="sim-suf">
                    = S/ {_precio > 0 && _cambio > 0 ? fmt(_precio * _cambio) : '0.00'}
                  </span>
                </div>
              </Field>
            )}

            <Field label={enPorcentaje ? 'Cuota inicial en % (mín. 10)' : 'Cuota inicial en decimal (mín. 0.10)'}>
              <div className="sim-ig">
                <input
                  type="text" inputMode="decimal"
                  placeholder={enPorcentaje ? 'Ej: 20' : 'Ej: 0.20 = 20%'}
                  value={cuotaInicialPorc}
                  onChange={e => { setCuotaInicialPorc(soloNumeros(e.target.value, 6)); setError('') }}
                />
                <span className="sim-suf">
                  = S/ {precioFinalDisplay > 0 && _cuotaDec > 0 ? fmt(precioFinalDisplay * _cuotaDec) : '0.00'}
                </span>
              </div>
            </Field>

            <Field label="Plazo (6 – 60 meses)">
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="sim-sel" style={{ flex: 1 }} value={tipoPlazo}
                  onChange={e => { setTipoPlazo(+e.target.value); setError('') }}>
                  <option value={1}>Meses</option>
                  <option value={2}>Años</option>
                </select>
                <input
                  className="sim-solo" style={{ flex: 1 }} type="text" inputMode="numeric"
                  placeholder={tipoPlazo === 1 ? 'Ej: 24' : 'Ej: 2'}
                  value={tipoPlazo === 1 ? plazoMeses : plazoAnios}
                  onChange={e => {
                    const v = soloEnteros(e.target.value, tipoPlazo === 1 ? 2 : 1)
                    tipoPlazo === 1 ? setPlazoMeses(v) : setPlazoAnios(v)
                    setError('')
                  }}
                />
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
                onChange={e => { setTipoTasa(+e.target.value); setError('') }}>
                <option value={1}>TEA — Tasa Efectiva Anual</option>
                <option value={2}>TNA — Tasa Nominal Anual</option>
              </select>
            </Field>

            {tipoTasa === 1 ? (
              <Field label={enPorcentaje ? 'TEA en % (1 – 80)' : 'TEA en decimal (0.01 – 0.80)'}>
                <div className="sim-ig">
                  <input
                    type="text" inputMode="decimal"
                    placeholder={enPorcentaje ? 'Ej: 11' : 'Ej: 0.11 = 11%'}
                    value={tasaTEA}
                    onChange={e => { setTasaTEA(soloNumeros(e.target.value, 8)); setError('') }}
                  />
                  <span className="sim-suf">{sufijoTasa(_teaDec)}</span>
                </div>
              </Field>
            ) : (
              <>
                <Field label={enPorcentaje ? 'TNA en %' : 'TNA en decimal'}>
                  <div className="sim-ig">
                    <input
                      type="text" inputMode="decimal"
                      placeholder={enPorcentaje ? 'Ej: 10' : 'Ej: 0.10 = 10%'}
                      value={tasaTNA}
                      onChange={e => { setTasaTNA(soloNumeros(e.target.value, 8)); setError('') }}
                    />
                    <span className="sim-suf">{sufijoTasa(_tnaDec)}</span>
                  </div>
                </Field>
                <Field label="Capitalización">
                  <select className="sim-sel" value={capitalizacion}
                    onChange={e => setCapitalizacion(+e.target.value)}>
                    {capOpciones.map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <div className="sim-total-row">
                  <span>TEA equivalente</span>
                  <strong>{teaEquivDisplay}%</strong>
                </div>
              </>
            )}

            <Field label={enPorcentaje ? 'Seg. Desgravamen mensual en % (0.01 – 1)' : 'Seg. Desgravamen mensual (0.0001 – 0.01)'}>
              <div className="sim-ig">
                <input
                  type="text" inputMode="decimal"
                  placeholder={enPorcentaje ? 'Ej: 0.35' : 'Ej: 0.0035 = 0.35%'}
                  value={tasaDesgravamen}
                  onChange={e => { setTasaDesgravamen(soloNumeros(e.target.value, 8)); setError('') }}
                />
                <span className="sim-suf">{sufijoTasa(_desgDec)}</span>
              </div>
            </Field>

            <Field label={enPorcentaje ? 'Seg. Vehicular anual en % (1 – 8)' : 'Seg. Vehicular anual (0.01 – 0.08)'}>
              <div className="sim-ig">
                <input
                  type="text" inputMode="decimal"
                  placeholder={enPorcentaje ? 'Ej: 3.6' : 'Ej: 0.036 = 3.6%'}
                  value={tasaVehicularAnual}
                  onChange={e => { setTasaVehicularAnual(soloNumeros(e.target.value, 8)); setError('') }}
                />
                <span className="sim-suf">{sufijoTasa(_vehDec)}</span>
              </div>
            </Field>

            {/* Período de gracia */}
            <div className="sim-card-header" style={{ marginTop: 16 }}>
              <Calendar size={16} color="#7c3aed" />
              <h3 style={{ fontSize: 14, color: '#7c3aed' }}>Período de Gracia</h3>
            </div>

            <Field label="¿Desea período de gracia?">
              <select className="sim-sel" value={tieneGracia ? 1 : 2}
                onChange={e => {
                  const activa = +e.target.value === 1
                  setTieneGracia(activa)
                  if (!activa) setMesesGracia('')
                  setError('')
                }}>
                <option value={2}>No</option>
                <option value={1}>Sí</option>
              </select>
            </Field>

            {tieneGracia && (<>
              <Field label="Meses de gracia (1 – 6)">
                <input
                  className="sim-solo" type="text" inputMode="numeric"
                  placeholder="Ej: 3"
                  value={mesesGracia}
                  onChange={e => { setMesesGracia(soloEnteros(e.target.value, 1)); setError('') }}
                />
              </Field>
              <Field label="Tipo de gracia">
                <select className="sim-sel" value={tipoGracia}
                  onChange={e => setTipoGracia(+e.target.value)}>
                  <option value={1}>Total — intereses se capitalizan, no paga nada</option>
                  <option value={2}>Parcial — solo paga intereses y seguros</option>
                </select>
              </Field>
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
            ] as [string, string, (v: string) => void][]).map(([lbl, val, set]) => (
              <Field key={lbl} label={`${lbl} (opcional)`}>
                <div className="sim-ig">
                  <span className="sim-pre">S/</span>
                  <input
                    type="text" inputMode="decimal"
                    placeholder="0.00"
                    value={val}
                    onChange={e => { set(soloNumeros(e.target.value, 7)); setError('') }}
                  />
                </div>
              </Field>
            ))}
            <div className="sim-total-row">
              <span>Total costos iniciales</span>
              <strong>S/ {fmt(_notarial + _registral + _tasacion + _otros)}</strong>
            </div>
          </div>
        </div>

        {/* — Error general de validación, siempre visible junto al botón — */}
        {error && (
          <div className="sim-error" style={{ marginBottom: 10 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="sim-btn" onClick={simular}>
            <Calculator size={18} /> Simular Financiamiento
          </button>

          {mostrarResultados && resumen && (
            <button
              className="sim-btn"
              onClick={guardarSimulacion}
              disabled={guardando}
              style={{
                background: 'linear-gradient(135deg,#10b981,#22c55e)',
                opacity: guardando ? 0.7 : 1,
              }}
              title="Guarda esta simulación en tu historial y notifica al administrador"
            >
              <Save size={18} /> {guardando ? 'Guardando…' : 'Guardar simulación'}
            </button>
          )}

          {guardadoMsg && (
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: guardadoMsg.startsWith('Error') ? '#fca5a5' : '#86efac',
            }}>
              {guardadoMsg}
            </span>
          )}
        </div>

        {/* ── RESULTADOS ── */}
        {mostrarResultados && resumen && (<>

          <section className="stats">
            <div className="stat-card">
              <div className="stat-icon blue"><DollarSign size={26} /></div>
              <div>
                <p>Cuota mensual (sin seguros)</p>
                <h2>S/ {fmt(resumen.cuotaMensual)}</h2>
                {/* — Detalle de lo que escogió el cliente — */}
                <small style={{ display: 'block', marginTop: 4 }}>
                  {resumen.vehiculoNombre} · S/ {fmt(resumen.precioVehiculo)}
                </small>
                <small style={{ display: 'block' }}>
                  Inicial: {resumen.cuotaInicialPorc.toFixed(0)}% (S/ {fmt(resumen.cuotaInicialMonto)})
                </small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Car size={26} /></div>
              <div>
                <p>Monto financiado</p>
                <h2>S/ {fmt(resumen.prestamo)}</h2>
                <small>Plazo: {resumen.plazoMeses} meses · {resumen.tipoGraciaLabel}</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><TrendingUp size={26} /></div>
              <div>
                <p>TCEA</p>
                <h2>{resumen.tcea.toPrecision(5)}%</h2>
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
                <div className="sim-resumen-section-title">Vehículo elegido</div>
                {([
                  ['Vehículo',       resumen.vehiculoNombre],
                  ['Precio',         `S/ ${fmt(resumen.precioVehiculo)}`],
                  ['Moneda',         resumen.monedaOriginal],
                  ['Cuota inicial',  `${resumen.cuotaInicialPorc.toFixed(2)}% = S/ ${fmt(resumen.cuotaInicialMonto)}`],
                  ['Monto financiado', `S/ ${fmt(resumen.prestamo)}`],
                ] as [string, string][]).map(([lbl, val]) => (
                  <div key={lbl} className="sim-resumen-row">
                    <span className="sim-rl">{lbl}</span>
                    <span className="sim-rv">{val}</span>
                  </div>
                ))}

                <div className="sim-resumen-section-title">Tasas</div>
                {([
                  ['TEA',         `${resumen.tea}%`],
                  ['TEM',         `${resumen.tem}%`],
                  ['TIR Mensual', `${resumen.tirMensual.toPrecision(5)}%`],
                  ['TCEA',        `${resumen.tcea.toPrecision(5)}%`],
                ] as [string, string][]).map(([lbl, val]) => (
                  <div key={lbl} className="sim-resumen-row">
                    <span className="sim-rl">{lbl}</span>
                    <span className="sim-rv">{val}</span>
                  </div>
                ))}

                <div className="sim-resumen-section-title">Plazos</div>
                {([
                  ['Plazo total',           `${resumen.plazoMeses} meses`],
                  ['Período de gracia',     `${resumen.mesesGracia} meses (${resumen.tipoGraciaLabel})`],
                  ['Meses de amortización', `${resumen.mesesAmortizacion} meses`],
                ] as [string, string][]).map(([lbl, val]) => (
                  <div key={lbl} className="sim-resumen-row">
                    <span className="sim-rl">{lbl}</span>
                    <span className="sim-rv">{val}</span>
                  </div>
                ))}

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
