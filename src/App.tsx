import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [clientes, setClientes] = useState<any[]>([])
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const obtenerClientes = async () => {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (data) setClientes(data)
  }

  const guardarCliente = async () => {
    if (nombres.trim() === '' || apellidos.trim() === '') {
  alert('Completa nombres y apellidos')
  return
}
let error

if (editandoId) {
  const resultado = await supabase
    .from('cliente')
    .update({
      nombres: nombres,
      apellidos: apellidos,
    })
    .eq('id_cliente', editandoId)

  error = resultado.error
} else {
  const resultado = await supabase
    .from('cliente')
    .insert([
      {
        nombres: nombres,
        apellidos: apellidos,
      },
    ])

  error = resultado.error
}

    if (error) {
      console.log('ERROR INSERT:', error)
      return
    }

    setNombres('')
    setApellidos('')
    obtenerClientes()
  }
  const eliminarCliente = async (id_cliente: string) => {
  const { error } = await supabase
    .from('cliente')
    .delete()
    .eq('id_cliente', id_cliente)

  if (error) {
    console.log('ERROR DELETE:', error)
    return
  }

  obtenerClientes()
}

  useEffect(() => {
    obtenerClientes()
  }, [])

  return (
    <div>
      <h1>Clientes</h1>

      <input
        type="text"
        placeholder="Nombres"
        value={nombres}
        onChange={(e) => setNombres(e.target.value)}
      />

      <input
        type="text"
        placeholder="Apellidos"
        value={apellidos}
        onChange={(e) => setApellidos(e.target.value)}
      />

      <button onClick={guardarCliente}>
        Agregar cliente
      </button>

      <hr />

      <table border={1}>
        <thead>
         <tr>
         <th>ID Cliente</th>
         <th>ID Usuario</th>
         <th>Nombres</th>
         <th>Apellidos</th>
        <th>Acciones</th>
        </tr>
        </thead>

        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id_cliente}>
              <td>{cliente.id_cliente}</td>
              <td>{cliente.id_usuario}</td>
              <td>{cliente.nombres}</td>
              <td>{cliente.apellidos}</td>
            <td>
              <button
              onClick={() => {
             setEditandoId(cliente.id_cliente)
             setNombres(cliente.nombres)
             setApellidos(cliente.apellidos)
           }}
          >
          Editar
        </button>
            <button onClick={() => eliminarCliente(cliente.id_cliente)}>
              Eliminar
              </button>
            </td>
          </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App