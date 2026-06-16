export type EstadoSimulacion = 'Aprobada' | 'En evaluación' | 'Rechazada';
export type EstadoCliente = 'Activo' | 'Inactivo' | 'Pendiente';

export interface Cliente {
  id: number;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  creditosActivos: number;
  estado: EstadoCliente;
  fechaRegistro: string;
}

export const clientes: Cliente[] = [
  { id: 1, nombre: 'Juan Pérez', dni: '45871236', telefono: '987 654 321', email: 'juan.perez@mail.com', creditosActivos: 1, estado: 'Activo', fechaRegistro: '12/01/2026' },
  { id: 2, nombre: 'María López', dni: '46219873', telefono: '912 345 678', email: 'maria.lopez@mail.com', creditosActivos: 2, estado: 'Activo', fechaRegistro: '03/02/2026' },
  { id: 3, nombre: 'Carlos Ramírez', dni: '47852136', telefono: '998 112 233', email: 'carlos.ramirez@mail.com', creditosActivos: 1, estado: 'Pendiente', fechaRegistro: '20/02/2026' },
  { id: 4, nombre: 'Ana Torres', dni: '48123654', telefono: '945 778 221', email: 'ana.torres@mail.com', creditosActivos: 0, estado: 'Inactivo', fechaRegistro: '28/02/2026' },
  { id: 5, nombre: 'Luis Fernández', dni: '49217845', telefono: '976 554 112', email: 'luis.fernandez@mail.com', creditosActivos: 1, estado: 'Activo', fechaRegistro: '05/03/2026' },
  { id: 6, nombre: 'Patricia Gómez', dni: '50321789', telefono: '923 441 109', email: 'patricia.gomez@mail.com', creditosActivos: 1, estado: 'Activo', fechaRegistro: '14/03/2026' },
  { id: 7, nombre: 'Roberto Díaz', dni: '51234567', telefono: '987 220 334', email: 'roberto.diaz@mail.com', creditosActivos: 0, estado: 'Pendiente', fechaRegistro: '22/03/2026' },
  { id: 8, nombre: 'Sofía Castillo', dni: '52345678', telefono: '934 887 654', email: 'sofia.castillo@mail.com', creditosActivos: 2, estado: 'Activo', fechaRegistro: '02/04/2026' },
  { id: 9, nombre: 'Diego Morales', dni: '53456789', telefono: '978 112 998', email: 'diego.morales@mail.com', creditosActivos: 1, estado: 'Inactivo', fechaRegistro: '15/04/2026' },
  { id: 10, nombre: 'Valeria Núñez', dni: '54567890', telefono: '991 223 445', email: 'valeria.nunez@mail.com', creditosActivos: 1, estado: 'Activo', fechaRegistro: '28/04/2026' },
];

export interface RegistroHistorial {
  id: number;
  cliente: string;
  vehiculo: string;
  tipo: 'Nuevo' | 'Usado';
  monto: number;
  cuota: number;
  plazo: number;
  estado: EstadoSimulacion;
  fecha: string;
}

export const historial: RegistroHistorial[] = [
  { id: 1, cliente: 'Juan Pérez', vehiculo: 'Toyota Corolla 2023', tipo: 'Nuevo', monto: 85000, cuota: 1850, plazo: 60, estado: 'Aprobada', fecha: '06/05/2026' },
  { id: 2, cliente: 'María López', vehiculo: 'Hyundai Tucson 2022', tipo: 'Usado', monto: 120000, cuota: 3120, plazo: 48, estado: 'En evaluación', fecha: '06/05/2026' },
  { id: 3, cliente: 'Carlos Ramírez', vehiculo: 'Kia Sportage 2023', tipo: 'Nuevo', monto: 95000, cuota: 2480, plazo: 48, estado: 'Aprobada', fecha: '05/05/2026' },
  { id: 4, cliente: 'Ana Torres', vehiculo: 'Nissan Kicks 2022', tipo: 'Usado', monto: 65000, cuota: 1690, plazo: 48, estado: 'Rechazada', fecha: '05/05/2026' },
  { id: 5, cliente: 'Luis Fernández', vehiculo: 'Chevrolet Tracker 2023', tipo: 'Nuevo', monto: 78000, cuota: 1620, plazo: 60, estado: 'Aprobada', fecha: '04/05/2026' },
  { id: 6, cliente: 'Patricia Gómez', vehiculo: 'Mazda CX-30 2022', tipo: 'Usado', monto: 102000, cuota: 2950, plazo: 36, estado: 'Aprobada', fecha: '03/05/2026' },
  { id: 7, cliente: 'Roberto Díaz', vehiculo: 'Suzuki Vitara 2023', tipo: 'Nuevo', monto: 88000, cuota: 2310, plazo: 48, estado: 'En evaluación', fecha: '02/05/2026' },
  { id: 8, cliente: 'Sofía Castillo', vehiculo: 'Toyota Yaris 2023', tipo: 'Nuevo', monto: 68000, cuota: 1480, plazo: 60, estado: 'Aprobada', fecha: '01/05/2026' },
  { id: 9, cliente: 'Diego Morales', vehiculo: 'Hyundai Accent 2022', tipo: 'Usado', monto: 58000, cuota: 1690, plazo: 36, estado: 'Rechazada', fecha: '29/04/2026' },
  { id: 10, cliente: 'Valeria Núñez', vehiculo: 'Kia Rio 2023', tipo: 'Nuevo', monto: 72000, cuota: 1590, plazo: 60, estado: 'Aprobada', fecha: '27/04/2026' },
  { id: 11, cliente: 'Juan Pérez', vehiculo: 'Toyota Hilux 2023', tipo: 'Nuevo', monto: 145000, cuota: 3580, plazo: 60, estado: 'En evaluación', fecha: '24/04/2026' },
  { id: 12, cliente: 'María López', vehiculo: 'Honda CR-V 2022', tipo: 'Usado', monto: 110000, cuota: 2890, plazo: 48, estado: 'Aprobada', fecha: '20/04/2026' },
  { id: 13, cliente: 'Carlos Ramírez', vehiculo: 'Ford Ranger 2023', tipo: 'Nuevo', monto: 135000, cuota: 3340, plazo: 60, estado: 'Aprobada', fecha: '18/04/2026' },
  { id: 14, cliente: 'Ana Torres', vehiculo: 'Volkswagen Tiguan 2022', tipo: 'Usado', monto: 98000, cuota: 2640, plazo: 48, estado: 'Rechazada', fecha: '15/04/2026' },
  { id: 15, cliente: 'Luis Fernández', vehiculo: 'Renault Duster 2023', tipo: 'Nuevo', monto: 71000, cuota: 1540, plazo: 60, estado: 'Aprobada', fecha: '10/04/2026' },
  { id: 16, cliente: 'Patricia Gómez', vehiculo: 'Jeep Compass 2022', tipo: 'Usado', monto: 118000, cuota: 3210, plazo: 48, estado: 'En evaluación', fecha: '06/04/2026' },
  { id: 17, cliente: 'Roberto Díaz', vehiculo: 'Toyota RAV4 2023', tipo: 'Nuevo', monto: 132000, cuota: 3260, plazo: 60, estado: 'Aprobada', fecha: '02/04/2026' },
  { id: 18, cliente: 'Sofía Castillo', vehiculo: 'Mitsubishi Outlander 2022', tipo: 'Usado', monto: 105000, cuota: 2780, plazo: 48, estado: 'Aprobada', fecha: '28/03/2026' },
];

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'Administrador' | 'Asesor' | 'Supervisor';
  ultimoAcceso: string;
  activo: boolean;
}

export const usuarios: Usuario[] = [
  { id: 1, nombre: 'Daniel Enríquez', email: 'admin@valorazul.com', rol: 'Administrador', ultimoAcceso: 'Hoy, 09:14', activo: true },
  { id: 2, nombre: 'Lucía Vargas', email: 'lucia.vargas@valorazul.com', rol: 'Supervisor', ultimoAcceso: 'Hoy, 08:50', activo: true },
  { id: 3, nombre: 'Jorge Salazar', email: 'jorge.salazar@valorazul.com', rol: 'Asesor', ultimoAcceso: 'Ayer, 18:22', activo: true },
  { id: 4, nombre: 'Camila Reyes', email: 'camila.reyes@valorazul.com', rol: 'Asesor', ultimoAcceso: 'Ayer, 16:05', activo: true },
  { id: 5, nombre: 'Andrés Paredes', email: 'andres.paredes@valorazul.com', rol: 'Asesor', ultimoAcceso: '10/05/2026', activo: false },
  { id: 6, nombre: 'Fiorella Cano', email: 'fiorella.cano@valorazul.com', rol: 'Supervisor', ultimoAcceso: '08/05/2026', activo: true },
];

export const simulacionesPorMes = [
  { mes: 'Ene', simulaciones: 38 },
  { mes: 'Feb', simulaciones: 45 },
  { mes: 'Mar', simulaciones: 52 },
  { mes: 'Abr', simulaciones: 61 },
  { mes: 'May', simulaciones: 74 },
  { mes: 'Jun', simulaciones: 72 },
];

export const estadoSimulaciones = [
  { name: 'Aprobadas', value: 120, color: '#22c55e' },
  { name: 'En evaluación', value: 154, color: '#3b82f6' },
  { name: 'Rechazadas', value: 68, color: '#facc15' },
];
