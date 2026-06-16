import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Settings,
  UserCircle,
} from 'lucide-react';

import './Ayuda.css';

interface Faq {
  pregunta: string;
  respuesta: string;
}

interface Categoria {
  id: string;
  nombre: string;
  icon: typeof CreditCard;
  faqs: Faq[];
}

const categorias: Categoria[] = [
  {
    id: 'creditos',
    nombre: 'Créditos',
    icon: CreditCard,
    faqs: [
      { pregunta: '¿Cómo simulo un crédito vehicular?', respuesta: 'Ingresa a la sección Simulador, completa el precio del vehículo, la inicial, el plazo y la tasa de interés. El sistema calculará la cuota mensual al instante.' },
      { pregunta: '¿Cuál es la tasa de interés aplicada?', respuesta: 'La tasa de interés (TEA) varía según el perfil del cliente y la entidad financiera, generalmente entre 14% y 22% anual.' },
      { pregunta: '¿Puedo cambiar el plazo de mi crédito?', respuesta: 'Sí, puedes elegir entre 12, 24, 36, 48 o 60 meses al momento de simular o renegociar tu crédito.' },
      { pregunta: '¿Qué pasa si mi crédito es rechazado?', respuesta: 'Puedes revisar las observaciones en el historial y volver a postular ajustando el monto, la inicial o el plazo.' },
    ],
  },
  {
    id: 'documentos',
    nombre: 'Documentos',
    icon: FileText,
    faqs: [
      { pregunta: '¿Qué documentos necesito para registrar un cliente?', respuesta: 'DNI vigente, recibo de servicios, y comprobantes de ingresos (boletas de pago o declaración de impuestos).' },
      { pregunta: '¿Cómo genero el PDF de una simulación?', respuesta: 'En la sección Simulador, después de calcular la cuota, haz clic en "Generar PDF" para descargar el resumen.' },
      { pregunta: '¿Puedo editar los datos de un cliente ya registrado?', respuesta: 'Sí, desde Clientes selecciona el cliente y usa el botón de editar en el panel de detalle.' },
      { pregunta: '¿Dónde se guardan las simulaciones realizadas?', respuesta: 'Todas las simulaciones guardadas aparecen en la sección Historial, junto con su estado y fecha.' },
    ],
  },
  {
    id: 'cuenta',
    nombre: 'Cuenta',
    icon: UserCircle,
    faqs: [
      { pregunta: '¿Cómo cambio mi contraseña?', respuesta: 'Ve a Configuración > Seguridad y selecciona "Cambiar contraseña".' },
      { pregunta: '¿Cómo actualizo mi foto de perfil?', respuesta: 'En Configuración > Perfil puedes subir una nueva foto y actualizar tus datos personales.' },
      { pregunta: '¿Puedo tener varias sesiones activas?', respuesta: 'Sí, puedes revisar y cerrar sesiones activas desde Configuración > Seguridad.' },
      { pregunta: '¿Cómo solicito un nuevo usuario para mi equipo?', respuesta: 'Los administradores pueden crear nuevos usuarios desde la sección Usuarios.' },
    ],
  },
  {
    id: 'tecnico',
    nombre: 'Técnico',
    icon: Settings,
    faqs: [
      { pregunta: 'La aplicación no carga, ¿qué hago?', respuesta: 'Verifica tu conexión a internet, recarga la página y limpia la caché del navegador.' },
      { pregunta: '¿Es compatible con dispositivos móviles?', respuesta: 'Sí, la plataforma es totalmente responsive y se adapta a celulares y tablets.' },
      { pregunta: '¿Cómo reporto un error del sistema?', respuesta: 'Usa el chat en vivo o escríbenos a soporte@valorazul.com detallando el problema encontrado.' },
      { pregunta: '¿Mis datos están protegidos?', respuesta: 'Sí, toda la información se transmite de forma encriptada y se almacena en servidores seguros.' },
    ],
  },
];

function Ayuda() {
  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const faqsFiltradas = useMemo(() => {
    return categorias
      .filter((cat) => categoriaActiva === 'todas' || cat.id === categoriaActiva)
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter((f) => f.pregunta.toLowerCase().includes(search.toLowerCase())),
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [search, categoriaActiva]);

  return (
    <>
      <div className="ayuda-hero glass-card fade-in">
        <h1>¿En qué podemos ayudarte?</h1>
        <p>Encuentra respuestas rápidas sobre créditos, documentos, tu cuenta y soporte técnico.</p>
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
          const Icon = cat.icon;
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
          );
        })}
      </div>

      <div className="faq-section">
        {faqsFiltradas.map((cat) => (
          <div className="panel glass-card faq-category fade-in" key={cat.id}>
            <h3>{cat.nombre}</h3>
            {cat.faqs.map((faq) => {
              const key = `${cat.id}-${faq.pregunta}`;
              const open = openFaq === key;
              return (
                <div className={`faq-item ${open ? 'open' : ''}`} key={key}>
                  <button className="faq-question" onClick={() => setOpenFaq(open ? null : key)}>
                    {faq.pregunta}
                    <ChevronDown size={18} className="chevron" />
                  </button>
                  {open && <p className="faq-answer">{faq.respuesta}</p>}
                </div>
              );
            })}
          </div>
        ))}

        {faqsFiltradas.length === 0 && (
          <div className="panel glass-card fade-in">
            <p className="no-results">No se encontraron preguntas para tu búsqueda.</p>
          </div>
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

        <div className="panel glass-card chat-panel">
          <MessageCircle size={36} className="glow chat-icon" />
          <h3>¿Necesitas ayuda inmediata?</h3>
          <p>Nuestro equipo de soporte está disponible para resolver tus dudas en tiempo real.</p>
          <button className="btn btn-primary">Iniciar chat en vivo</button>
        </div>
      </div>
    </>
  );
}

export default Ayuda;
