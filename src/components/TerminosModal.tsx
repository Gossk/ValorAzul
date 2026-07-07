import { useState } from 'react'
import '../pages/Login.css'

interface Props {
  open: boolean
  onClose: () => void
}

/* ═══════════ CONTENIDO DE CADA PÁGINA ═══════════ */

const pages = [
  /* ─── 1. Introducción ─── */
  {
    title: '1. Introducción y Objeto',
    body: (
      <>
        <p>
          Bienvenido a <strong>Valor Azul</strong> (en adelante, "la Plataforma"), un sistema
          web desarrollado como proyecto académico universitario con fines exclusivamente
          experimentales y educativos.
        </p>
        <p>
          Los presentes Términos y Condiciones (en adelante, "los Términos") regulan el
          acceso, registro y uso de la Plataforma por parte de los usuarios (en adelante,
          "el Usuario"). Al crear una cuenta y utilizar los servicios ofrecidos, el Usuario
          declara haber leído, entendido y aceptado íntegramente estos Términos.
        </p>
        <p>
          El objeto de Valor Azul es proporcionar una herramienta de simulación financiera
          que permite a los usuarios explorar escenarios de crédito, evaluar cuotas estimadas
          y visualizar proyecciones bajo parámetros configurables. Todas las cifras, tasas y
          resultados generados por la Plataforma son <strong>datos experimentales</strong> y
          <strong> no constituyen asesoría financiera, oferta comercial ni compromiso
          vinculante</strong> con ninguna entidad bancaria o financiera real.
        </p>
        <p>
          El registro en la Plataforma implica que el Usuario es mayor de 18 años y que la
          información proporcionada durante el proceso de registro es veraz, completa y
          actualizada. Cualquier dato falso o inexacto podrá ser causal de suspensión o
          eliminación de la cuenta sin previo aviso.
        </p>
        <p>
          Valor Azul se reserva el derecho de modificar, suspender o discontinuar total o
          parcialmente la Plataforma en cualquier momento, sin necesidad de notificación
          previa, dado su carácter de proyecto académico experimental.
        </p>
      </>
    ),
  },

  /* ─── 2. Uso de la Plataforma ─── */
  {
    title: '2. Uso de la Plataforma',
    body: (
      <>
        <p>
          El Usuario se compromete a utilizar la Plataforma de manera lícita, diligente y
          de buena fe, absteniéndose de realizar cualquier actividad que pueda dañar,
          sobrecargar o deteriorar el funcionamiento del sistema.
        </p>
        <p>Queda expresamente prohibido:</p>
        <ul>
          <li>
            Intentar acceder a áreas restringidas del sistema, servidores o redes conectadas
            a la Plataforma mediante técnicas de hacking, ingeniería social o cualquier otro
            medio no autorizado.
          </li>
          <li>
            Utilizar bots, scrapers, crawlers u otros mecanismos automatizados para extraer
            datos de la Plataforma sin autorización expresa y por escrito.
          </li>
          <li>
            Suplantar la identidad de otra persona o entidad, o crear cuentas múltiples con
            el fin de evadir restricciones o manipular los resultados del sistema.
          </li>
          <li>
            Introducir virus, malware, código malicioso o cualquier elemento técnico que
            pueda causar daño al sistema o a terceros usuarios.
          </li>
          <li>
            Reproducir, distribuir, sublicenciar o explotar comercialmente cualquier contenido
            generado por la Plataforma sin autorización previa del equipo desarrollador.
          </li>
        </ul>
        <p>
          La Plataforma otorga al Usuario una licencia personal, intransferible, no exclusiva
          y revocable para acceder y utilizar los servicios de simulación disponibles,
          siempre dentro del marco académico y experimental para el cual fue diseñada.
        </p>
        <p>
          El equipo de Valor Azul podrá suspender temporal o permanentemente cualquier cuenta
          que incumpla estos Términos, sin perjuicio de las acciones legales que pudieran
          corresponder en caso de daños comprobados.
        </p>
      </>
    ),
  },

  /* ─── 3. Registro y Cuenta ─── */
  {
    title: '3. Registro y Cuenta de Usuario',
    body: (
      <>
        <p>
          Para acceder a las funcionalidades completas de la Plataforma, el Usuario deberá
          completar un formulario de registro proporcionando la siguiente información:
        </p>
        <ul>
          <li>Nombres completos</li>
          <li>Documento Nacional de Identidad (DNI) — 8 dígitos</li>
          <li>Número de teléfono celular — 9 dígitos</li>
          <li>Correo electrónico válido</li>
          <li>Nombre de usuario (mínimo 4 caracteres)</li>
          <li>Contraseña segura (mínimo 8 caracteres, con mayúsculas, minúsculas, números y caracteres especiales)</li>
        </ul>
        <p>
          El Usuario es el único responsable de mantener la confidencialidad de sus
          credenciales de acceso. Cualquier actividad que se realice desde su cuenta se
          considerará efectuada por él mismo, salvo que demuestre haber sido víctima de un
          acceso no autorizado y lo comunique de manera inmediata al equipo de soporte.
        </p>
        <p>
          El Usuario se compromete a notificar de inmediato cualquier uso no autorizado de su
          cuenta, así como cualquier otra brecha de seguridad de la cual tenga conocimiento.
          Valor Azul no será responsable por las pérdidas o daños derivados del incumplimiento
          de esta obligación.
        </p>
        <p>
          La cuenta del Usuario podrá ser eliminada a solicitud del propio usuario o por
          decisión del equipo administrador cuando se detecte un incumplimiento grave de
          estos Términos. La eliminación de la cuenta conllevará la supresión de los datos
          personales almacenados, conforme a lo establecido en la sección de Tratamiento de
          Datos Personales.
        </p>
      </>
    ),
  },

  /* ─── 4. Tratamiento de Datos ─── */
  {
    title: '4. Tratamiento de Datos Personales',
    body: (
      <>
        <p>
          Valor Azul se compromete a proteger la privacidad de los datos personales de sus
          usuarios, en cumplimiento de la <strong>Ley N° 29733 — Ley de Protección de Datos
          Personales del Perú</strong> y su Reglamento, aprobado por Decreto Supremo
          N° 003-2013-JUS.
        </p>
        <p><strong>4.1 Datos recopilados:</strong></p>
        <p>La Plataforma recopila los siguientes datos personales al momento del registro:</p>
        <ul>
          <li><strong>Datos identificativos:</strong> nombres completos, DNI, nombre de usuario.</li>
          <li><strong>Datos de contacto:</strong> correo electrónico, número de celular.</li>
          <li><strong>Datos de uso:</strong> historial de simulaciones realizadas, fecha de registro, estado de la cuenta.</li>
          <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, timestamps de acceso.</li>
        </ul>
        <p><strong>4.2 Finalidad del tratamiento:</strong></p>
        <p>Los datos personales son tratados con las siguientes finalidades exclusivas:</p>
        <ul>
          <li>Gestionar el registro y la autenticación del Usuario en la Plataforma.</li>
          <li>Almacenar el historial de simulaciones financieras realizadas para consulta posterior.</li>
          <li>Generar estadísticas agregadas y anónimas con fines estrictamente académicos.</li>
          <li>Cumplir con obligaciones legales aplicables al proyecto universitario.</li>
        </ul>
        <p><strong>4.3 Base legal:</strong></p>
        <p>
          El tratamiento de datos se fundamenta en el <strong>consentimiento libre, informado,
          expreso e inequívoco</strong> del Usuario, otorgado al momento de aceptar estos
          Términos y marcar la casilla correspondiente durante el proceso de registro.
        </p>
      </>
    ),
  },

  /* ─── 5. Derechos ARCO ─── */
  {
    title: '5. Derechos ARCO y Seguridad de Datos',
    body: (
      <>
        <p><strong>5.1 Derechos del titular:</strong></p>
        <p>
          Conforme a la legislación peruana vigente, el Usuario tiene derecho a ejercer los
          denominados <strong>derechos ARCO</strong> (Acceso, Rectificación, Cancelación y
          Oposición) respecto a sus datos personales almacenados en la Plataforma:
        </p>
        <ul>
          <li>
            <strong>Acceso:</strong> conocer qué datos personales se encuentran almacenados y
            con qué finalidad.
          </li>
          <li>
            <strong>Rectificación:</strong> solicitar la corrección de datos inexactos,
            incompletos o desactualizados.
          </li>
          <li>
            <strong>Cancelación:</strong> solicitar la eliminación de sus datos personales de
            las bases de datos de la Plataforma.
          </li>
          <li>
            <strong>Oposición:</strong> oponerse al tratamiento de sus datos para fines
            específicos.
          </li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, el Usuario puede enviar una solicitud al
          correo electrónico del equipo desarrollador, adjuntando copia de su DNI y
          describiendo de manera clara el derecho que desea ejercer. El plazo de atención
          será de hasta 20 días hábiles.
        </p>
        <p><strong>5.2 Medidas de seguridad:</strong></p>
        <p>
          Valor Azul implementa medidas técnicas y organizacionales razonables para proteger
          los datos personales contra acceso no autorizado, alteración, divulgación o
          destrucción, incluyendo:
        </p>
        <ul>
          <li>Cifrado de contraseñas mediante el sistema de autenticación de Firebase.</li>
          <li>Almacenamiento en bases de datos con acceso restringido y autenticado.</li>
          <li>Comunicación cifrada mediante protocolo HTTPS en todas las interacciones.</li>
          <li>Control de acceso basado en roles (administradores y clientes).</li>
        </ul>
        <p>
          No obstante, el Usuario reconoce que ningún sistema de transmisión por Internet o
          almacenamiento electrónico es completamente seguro, por lo que Valor Azul no puede
          garantizar la seguridad absoluta de la información.
        </p>
      </>
    ),
  },

  /* ─── 6. Datos Experimentales ─── */
  {
    title: '6. Naturaleza Experimental de los Datos',
    body: (
      <>
        <p>
          El Usuario entiende y acepta de manera expresa que <strong>Valor Azul es un proyecto
          académico universitario</strong> y que toda la información, cálculos, simulaciones
          y resultados presentados en la Plataforma tienen un carácter
          <strong> estrictamente experimental y educativo</strong>.
        </p>
        <p>En consecuencia:</p>
        <ul>
          <li>
            Las tasas de interés, plazos, cuotas y cualquier otro parámetro financiero
            utilizado en las simulaciones son <strong>valores referenciales</strong> que no
            corresponden necesariamente a las condiciones reales del mercado financiero.
          </li>
          <li>
            Los resultados de las simulaciones <strong>no constituyen ofertas, cotizaciones
            ni compromisos de crédito</strong> por parte de ninguna entidad financiera real.
          </li>
          <li>
            El Usuario <strong>no debe tomar decisiones financieras</strong> basándose
            exclusivamente en los resultados proporcionados por la Plataforma.
          </li>
          <li>
            Las proyecciones y análisis generados pueden contener imprecisiones, errores o
            simplificaciones propias de un entorno académico experimental.
          </li>
        </ul>
        <p>
          El equipo desarrollador de Valor Azul <strong>no asume ninguna responsabilidad</strong>{' '}
          por las decisiones que el Usuario tome basándose en los datos experimentales
          proporcionados por la Plataforma. El Usuario es el único responsable de verificar
          la información con fuentes oficiales y entidades financieras autorizadas antes de
          tomar cualquier decisión crediticia.
        </p>
        <p>
          Las simulaciones almacenadas en el historial del Usuario podrán ser eliminadas en
          cualquier momento por motivos de mantenimiento, actualización del sistema o
          finalización del proyecto académico, sin que esto genere derecho a indemnización
          alguna.
        </p>
      </>
    ),
  },

  /* ─── 7. Propiedad Intelectual ─── */
  {
    title: '7. Propiedad Intelectual',
    body: (
      <>
        <p>
          Todos los elementos que conforman la Plataforma Valor Azul —incluyendo, de manera
          enunciativa mas no limitativa, el diseño gráfico, la interfaz de usuario, los
          logotipos, los textos, los algoritmos de simulación, el código fuente y la
          estructura de la base de datos— son propiedad intelectual del equipo desarrollador
          y se encuentran protegidos por las leyes de propiedad intelectual aplicables.
        </p>
        <p>
          Queda prohibida la reproducción total o parcial, distribución, comunicación pública,
          transformación o cualquier otra forma de explotación de los contenidos de la
          Plataforma sin la autorización expresa y por escrito de sus titulares.
        </p>
        <p>
          El Usuario podrá hacer uso de los resultados generados por las simulaciones
          exclusivamente para fines personales y académicos, quedando prohibido su uso
          comercial o la creación de obras derivadas a partir de los mismos.
        </p>
        <p>
          Las marcas, nombres comerciales y signos distintivos que aparecen en la Plataforma
          son propiedad de sus respectivos titulares y su mención no implica relación,
          patrocinio ni endorsement alguno entre dichos titulares y el equipo de Valor Azul.
        </p>
      </>
    ),
  },

  /* ─── 8. Limitación y Contacto ─── */
  {
    title: '8. Limitación de Responsabilidad y Contacto',
    body: (
      <>
        <p><strong>8.1 Limitación de responsabilidad:</strong></p>
        <p>
          En la máxima extensión permitida por la legislación aplicable, el equipo de Valor
          Azul no será responsable por:
        </p>
        <ul>
          <li>
            Daños directos, indirectos, incidentales, consecuentes o punitivos derivados del
            uso o la imposibilidad de uso de la Plataforma.
          </li>
          <li>
            Interrupciones del servicio, errores, omisiones o pérdida de datos causados por
            factores técnicos, de red o de fuerza mayor.
          </li>
          <li>
            Decisiones financieras tomadas por el Usuario basándose en los datos experimentales
            proporcionados por las simulaciones.
          </li>
          <li>
            Accesos no autorizados a la cuenta del Usuario derivados de negligencia en la
            custodia de sus credenciales.
          </li>
        </ul>
        <p><strong>8.2 Ley aplicable y jurisdicción:</strong></p>
        <p>
          Estos Términos se rigen por las leyes de la República del Perú. Cualquier
          controversia derivada de la interpretación o ejecución de los presentes Términos
          será resuelta por los tribunales competentes de la ciudad de Lima, Perú.
        </p>
        <p><strong>8.3 Contacto:</strong></p>
        <p>
          Para cualquier consulta, reclamo o solicitud relacionada con estos Términos, el
          tratamiento de datos personales o el funcionamiento de la Plataforma, el Usuario
          puede comunicarse a través de los siguientes medios:
        </p>
        <ul>
          <li><strong>Correo electrónico:</strong> soporte@valorazul.edu.pe</li>
          <li><strong>Dirección:</strong> Universidad — Lima, Perú</li>
        </ul>
        <p>
          <em>Última actualización: julio de 2026.</em>
        </p>
      </>
    ),
  },
]

/* ═══════════ COMPONENTE ═══════════ */

function TerminosModal({ open, onClose }: Props) {
  const [page, setPage] = useState(0)
  const total = pages.length

  if (!open) return null

  const goPrev = () => setPage((p) => Math.max(0, p - 1))
  const goNext = () => setPage((p) => Math.min(total - 1, p + 1))

  return (
    /* overlay */
    <div className="tc-overlay" onClick={onClose}>
      {/* modal */}
      <div className="tc-modal" onClick={(e) => e.stopPropagation()}>

        {/* header */}
        <div className="tc-header">
          <div className="tc-header-left">
            <div className="tc-header-logo">V</div>
            <div>
              <h2 className="tc-header-title">Términos y Condiciones</h2>
              <span className="tc-header-sub">Valor Azul — Proyecto Académico</span>
            </div>
          </div>
          <button className="tc-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* body */}
        <div className="tc-body">
          <h3 className="tc-page-title">{pages[page].title}</h3>
          <div className="tc-page-content">{pages[page].body}</div>
        </div>

        {/* footer con navegación */}
        <div className="tc-footer">
          {/* dots */}
          <div className="tc-dots">
            {pages.map((_, i) => (
              <button
                key={i}
                className={`tc-dot ${i === page ? 'tc-dot-active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Ir a página ${i + 1}`}
              />
            ))}
          </div>

          <div className="tc-nav">
            <span className="tc-page-info">
              {page + 1} / {total}
            </span>
            <button
              className="tc-btn tc-btn-prev"
              onClick={goPrev}
              disabled={page === 0}
            >
              ← Anterior
            </button>
            <button
              className="tc-btn tc-btn-next"
              onClick={goNext}
              disabled={page === total - 1}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TerminosModal
