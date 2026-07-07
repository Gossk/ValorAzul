import { useMemo, useState } from 'react'
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Info,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserCircle,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import './Ayuda.css'

interface Faq {
  pregunta: string
  respuesta: string
}

interface Categoria {
  id: string
  nombre: string
  icon: typeof CreditCard
  faqs: Faq[]
}

const categorias: Categoria[] = [
  {
    id: 'simulador',
    nombre: 'Simulador y créditos',
    icon: Calculator,
    faqs: [
      { pregunta: '¿Cómo simulo un crédito vehicular?', respuesta: 'Entra a la sección Simulador, busca tu vehículo en el catálogo (el precio se llena solo), indica la cuota inicial, el plazo y la tasa. Al pulsar "Simular" ves la cuota mensual, la TCEA y el cronograma al instante.' },
      { pregunta: '¿Cuál es la cuota inicial mínima?', respuesta: 'El 10% del precio del vehículo (0.10 en formato decimal o 10% en porcentaje). No puede ser igual ni mayor al 100%.' },
      { pregunta: '¿Qué plazos puedo elegir?', respuesta: 'Entre 6 y 60 meses (hasta 5 años). Puedes ingresarlo en meses o en años.' },
      { pregunta: '¿Qué es la TEA y la TCEA?', respuesta: 'La TEA es la Tasa Efectiva Anual (el costo de la tasa). La TCEA es el costo efectivo real, porque además incluye seguros y gastos. Ambas se muestran en los resultados.' },
      { pregunta: '¿Qué es el periodo de gracia?', respuesta: 'Son meses donde pagas menos: "Gracia total" (no pagas nada y los intereses se suman al saldo) o "Gracia parcial" (solo intereses y seguros). Puedes elegir de 1 a 6 meses.' },
      { pregunta: '¿Puedo simular en dólares?', respuesta: 'Sí. Elige la moneda Dólares ($) e ingresa el tipo de cambio (entre 3.00 y 5.00) para convertir los montos a soles.' },
      { pregunta: '¿Qué seguros se incluyen en la simulación?', respuesta: 'El seguro de desgravamen (mensual) y el seguro vehicular (anual). Ambos se suman a tu cuota y al total a pagar.' },
      { pregunta: '¿Qué son el VAN y la TIR?', respuesta: 'Son indicadores financieros: el VAN te ayuda a ver si el crédito "conviene" (si es positivo, suele ser favorable) y la TIR representa la rentabilidad mensual de la operación.' },
    ],
  },
  {
    id: 'mis-simulaciones',
    nombre: 'Mis Simulaciones',
    icon: FileText,
    faqs: [
      { pregunta: '¿Dónde se guardan mis simulaciones?', respuesta: 'En "Mis Simulaciones", accesible desde el menú. Solo tú puedes verlas.' },
      { pregunta: '¿Cómo reviso una simulación guardada?', respuesta: 'Entra a Mis Simulaciones y abre el detalle para ver el resumen, el cronograma de pagos y el estado.' },
      { pregunta: '¿Puedo volver a abrir una simulación en el simulador?', respuesta: 'Sí. Desde Mis Simulaciones usa "Reabrir" y se cargan todos los datos en el Simulador para que los ajustes.' },
      { pregunta: '¿Puedo comparar varias simulaciones?', respuesta: 'Guarda varias y compáralas en Mis Simulaciones cambiando la cuota inicial, el plazo o la tasa para decidir la mejor opción.' },
      { pregunta: '¿Puedo borrar una simulación?', respuesta: 'Sí, desde Mis Simulaciones puedes eliminar las que ya no necesites.' },
      { pregunta: '¿Por qué mi simulación dice "Guardada"?', respuesta: 'Porque la guardaste tú. El administrador la evaluará y podrá cambiar el estado a En evaluación, Aprobada o Rechazada.' },
    ],
  },
  {
    id: 'cuenta',
    nombre: 'Mi cuenta y perfil',
    icon: UserCircle,
    faqs: [
      { pregunta: '¿Cómo me registro?', respuesta: 'En "Registrarme" completa tus datos y crea tu cuenta con tu correo electrónico.' },
      { pregunta: '¿Olvidé mi contraseña, cómo la recupero?', respuesta: 'En la pantalla de inicio de sesión usa "¿Olvidaste tu contraseña?" y sigue las instrucciones del correo de recuperación.' },
      { pregunta: '¿Cómo actualizo mis datos?', respuesta: 'En "Mi Perfil" puedes editar tu nombre y datos de contacto; los cambios se guardan al instante.' },
      { pregunta: '¿Cómo cierro sesión?', respuesta: 'Desde el menú lateral, usa "Cerrar sesión" al final de la lista.' },
      { pregunta: '¿Puedo tener la sesión abierta en varios dispositivos?', respuesta: 'Sí, puedes iniciar sesión en más de un dispositivo. Recuerda cerrar sesión en equipos que no sean tuyos.' },
    ],
  },
  {
    id: 'pagos',
    nombre: 'Pagos y seguros',
    icon: CreditCard,
    faqs: [
      { pregunta: '¿Qué es el monto financiado?', respuesta: 'Es el precio del vehículo menos tu cuota inicial. Es la base sobre la que se calculan los intereses.' },
      { pregunta: '¿Qué incluye el "Total a pagar"?', respuesta: 'La suma de todas las cuotas, los intereses, los seguros y los costos iniciales (notariales, registrales, tasación y otros).' },
      { pregunta: '¿Qué es el seguro de desgravamen?', respuesta: 'Cubre la deuda en caso de fallecimiento o invalidez. Se paga mensualmente y se refleja en tu cuota.' },
      { pregunta: '¿Qué es el seguro vehicular?', respuesta: 'Cubre daños al vehículo. Se cobra anualmente e influye en el total a pagar de la simulación.' },
      { pregunta: '¿La cuota mensual puede cambiar?', respuesta: 'En la simulación es fija según los datos que ingreses. En un crédito real depende de tu entidad financiera y del tipo de periodo de gracia elegido.' },
    ],
  },
  {
    id: 'seguridad',
    nombre: 'Seguridad y privacidad',
    icon: ShieldCheck,
    faqs: [
      { pregunta: '¿Mis datos están protegidos?', respuesta: 'Sí. Toda la información viaja encriptada y se almacena de forma privada en tu cuenta.' },
      { pregunta: '¿Quién puede ver mis simulaciones?', respuesta: 'Solo tú y el administrador del sistema (para poder evaluarlas y darles seguimiento).' },
      { pregunta: '¿Valor Azul vende mis datos?', respuesta: 'No. Tus datos se usan únicamente para tu simulación y la gestión dentro del proyecto.' },
      { pregunta: '¿Cómo protejo mi cuenta?', respuesta: 'Usa una contraseña segura, no la compartas y cierra sesión en equipos compartidos o públicos.' },
    ],
  },
  {
    id: 'proyecto',
    nombre: 'Proyecto y soporte',
    icon: Info,
    faqs: [
      { pregunta: '¿Qué es Valor Azul?', respuesta: 'Es un simulador de crédito vehicular desarrollado como proyecto universitario experimental para ayudarte a entender y planificar tu financiamiento.' },
      { pregunta: '¿Las simulaciones son una aprobación real de crédito?', respuesta: 'No. Son estimaciones basadas en los datos que ingresas. La aprobación real depende de una entidad financiera.' },
      { pregunta: '¿Cómo reporto un error o dejo una sugerencia?', respuesta: 'Usa el Libro de reclamaciones de esta misma página o escríbenos a soporte@valorazul.com.' },
      { pregunta: '¿Tienen atención por teléfono?', respuesta: 'Sí, en horario de lunes a viernes (ver la sección Contáctanos). Como es un proyecto académico, el soporte es limitado.' },
    ],
  },
]

function Ayuda() {
  const { perfil, user } = useAuth()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas')
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  // ── Libro de reclamaciones ──
  const [reclamo, setReclamo] = useState({ tipo: 'Reclamo', asunto: '', descripcion: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)

  const enviarReclamo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reclamo.asunto.trim() || !reclamo.descripcion.trim()) {
      showToast({
        type: 'error',
        title: 'Faltan datos',
        message: 'Por favor, completa todos los campos del reclamo antes de enviar.',
      })
      return
    }
    if (reclamo.asunto.trim().length < 4) {
      showToast({
        type: 'error',
        title: 'Asunto muy corto',
        message: 'El asunto debe tener al menos 4 caracteres.',
      })
      return
    }
    if (reclamo.descripcion.trim().length < 10) {
      showToast({
        type: 'error',
        title: 'Descripción incompleta',
        message: 'Por favor, detalla tu reclamo con al menos 10 caracteres.',
      })
      return
    }
    setEnviando(true)
    try {
      await addDoc(collection(db, 'reclamaciones'), {
        uid:         user?.uid ?? '',
        nombre:      perfil?.nombre ?? '',
        email:       perfil?.email ?? '',
        tipo:        reclamo.tipo,
        asunto:      reclamo.asunto.trim(),
        descripcion: reclamo.descripcion.trim(),
        estado:      'Pendiente',
        fecha:       new Date().toLocaleDateString('es-PE'),
        creadoEn:    Date.now(),
        creadoEnServer: serverTimestamp(),
      })
      setEnviado(true)
      setReclamo({ tipo: 'Reclamo', asunto: '', descripcion: '' })
      showToast({
        type: 'success',
        title: 'Enviado correctamente',
        message: 'Hemos recibido tu reclamo en el Libro de reclamaciones. Te contactaremos pronto.',
      })
    } catch (err: any) {
      console.error(err)
      showToast({
        type: 'error',
        title: 'No se pudo enviar',
        message: err?.message || 'Ocurrió un error. Intenta nuevamente.',
      })
    } finally {
      setEnviando(false)
    }
  }

  const faqsFiltradas = useMemo(() => {
    return categorias
      .filter((cat) => categoriaActiva === 'todas' || cat.id === categoriaActiva)
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter((f) => f.pregunta.toLowerCase().includes(search.toLowerCase())),
      }))
      .filter((cat) => cat.faqs.length > 0)
  }, [search, categoriaActiva])

  return (
    <>
      <div className="ayuda-hero glass-card fade-in">
        <h1>¿En qué podemos ayudarte?</h1>
        <p>Encuentra respuestas sobre el simulador, tus simulaciones, pagos, tu cuenta y tu seguridad.</p>
        <div className="ayuda-search">
          <Search size={18} />
          <input
            placeholder="Buscar una pregunta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="categorias-grid stagger">
        <button
          className={`categoria-card glass-card ${categoriaActiva === 'todas' ? 'active' : ''}`}
          onClick={() => setCategoriaActiva('todas')}
        >
          <div className="categoria-icon glow"><Search size={22} /></div>
          <strong>Todas</strong>
          <span>Ver todas las categorías</span>
        </button>

        {categorias.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              className={`categoria-card glass-card ${categoriaActiva === cat.id ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              <div className="categoria-icon glow"><Icon size={22} /></div>
              <strong>{cat.nombre}</strong>
              <span>{cat.faqs.length} preguntas</span>
            </button>
          )
        })}
      </div>

      <div className="faq-section">
        {faqsFiltradas.map((cat) => (
          <div className="panel glass-card faq-category fade-in" key={cat.id}>
            <h3>{cat.nombre}</h3>
            {cat.faqs.map((faq) => {
              const key = `${cat.id}-${faq.pregunta}`
              const open = openFaq === key
              return (
                <div className={`faq-item ${open ? 'open' : ''}`} key={key}>
                  <button className="faq-question" onClick={() => setOpenFaq(open ? null : key)}>
                    {faq.pregunta}
                    <ChevronDown size={18} className="chevron" />
                  </button>
                  {open && <p className="faq-answer">{faq.respuesta}</p>}
                </div>
              )
            })}
          </div>
        ))}

        {faqsFiltradas.length === 0 && (
          <div className="panel glass-card fade-in">
            <p className="no-results">No se encontraron preguntas para tu búsqueda.</p>
          </div>
        )}
      </div>

      <div className="panel glass-card reclamos-panel fade-in">
        <div className="reclamos-head">
          <div className="reclamos-icon"><BookOpen size={28} /></div>
          <div>
            <h3>Libro de reclamaciones</h3>
            <p>
              ¿Tuviste un problema o tienes una queja? Regístrala aquí. Disponible para
              clientes del proyecto experimental Valor Azul.
            </p>
          </div>
        </div>

        {enviado ? (
          <div className="reclamos-exito">
            <div className="reclamos-exito-icon"><CheckCircle2 size={42} /></div>
            <h4>¡Reporte enviado con éxito!</h4>
            <p>Hemos recibido tu reclamo. Nuestro equipo lo revisará y te contactará pronto.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setEnviado(false)}
            >
              Enviar otro reclamo
            </button>
          </div>
        ) : (
          <form className="reclamos-form" onSubmit={enviarReclamo}>
            <div className="reclamos-row">
              <label className="reclamos-tipo">
                <span>Tipo <strong style={{ color: '#f87171' }}>*</strong></span>
                <select
                  required
                  value={reclamo.tipo}
                  onChange={(e) => setReclamo({ ...reclamo, tipo: e.target.value })}
                >
                  <option value="Reclamo">Reclamo</option>
                  <option value="Queja">Queja</option>
                </select>
              </label>
              <label className="reclamos-asunto">
                <span>Asunto <strong style={{ color: '#f87171' }}>*</strong></span>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={reclamo.asunto}
                  onChange={(e) => setReclamo({ ...reclamo, asunto: e.target.value })}
                  placeholder="Ej: Error al simular (mín. 4 caracteres)"
                  maxLength={80}
                />
              </label>
            </div>
            <label>
              <span>Descripción <strong style={{ color: '#f87171' }}>*</strong></span>
              <textarea
                rows={3}
                required
                minLength={10}
                value={reclamo.descripcion}
                onChange={(e) => setReclamo({ ...reclamo, descripcion: e.target.value })}
                placeholder="Cuéntanos qué ocurrió detalladamente (mín. 10 caracteres)..."
                maxLength={600}
              />
            </label>
            <div className="reclamos-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={enviando || !reclamo.asunto.trim() || !reclamo.descripcion.trim()}
                style={{ opacity: (!reclamo.asunto.trim() || !reclamo.descripcion.trim()) ? 0.6 : 1 }}
              >
                {enviando ? 'Enviando…' : 'Enviar reclamo'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="contacto-grid fade-in">
        <div className="panel glass-card contacto-panel">
          <h3>Contáctanos</h3>
          <div className="contacto-item">
            <Mail size={18} />
            <div>
              <strong>Email</strong>
              <p>soporte@valorazul.com</p>
            </div>
          </div>
          <div className="contacto-item">
            <Phone size={18} />
            <div>
              <strong>Teléfono</strong>
              <p>(01) 555 0199</p>
            </div>
          </div>
          <div className="contacto-item">
            <Clock size={18} />
            <div>
              <strong>Horario de atención</strong>
              <p>Lunes a viernes, 9:00 a.m. - 6:00 p.m.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Ayuda
