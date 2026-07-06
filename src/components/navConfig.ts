// src/components/navConfig.ts
//
// Configuración ÚNICA de la navegación de la app.
// Se consume desde:
//   - src/components/Layout.tsx   (sidebar general con Outlet)
//   - src/pages/Simulador.tsx     (sidebar interno del simulador)
//
// De esta forma el usuario ve exactamente los mismos items en cualquier
// pantalla y no aparecen/desaparecen al navegar.
//
// Reglas por rol:
//   Cliente        → Inicio · Simulador · Mis Simulaciones · Ayuda · Mi Perfil
//   Administrador  → Inicio · Dashboard · Clientes · Simulador · Historial · Ayuda
//                    + Usuarios · Configuración · Mi Perfil
//
// Si `roles` no está definido, el item es visible para todos.

import {
  Car,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  Settings,
  User,
  UserCircle,
  Users,
} from 'lucide-react'

import type { Rol } from '../context/AuthContext'

export interface NavItem {
  to: string
  icon: typeof Home
  label: string
  badge?: number
  roles?: Rol[]
}

export const mainNav: NavItem[] = [
  { to: '/inicio',            icon: Home,            label: 'Inicio' },
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard',        roles: ['Administrador'] },
  { to: '/clientes',          icon: User,            label: 'Clientes',         roles: ['Administrador'] },
  { to: '/simulador',         icon: Car,             label: 'Simulador' },
  { to: '/mis-simulaciones',  icon: FileText,        label: 'Mis Simulaciones', roles: ['Cliente'] },
  { to: '/historial',         icon: FileText,        label: 'Historial',        roles: ['Administrador'] },
  { to: '/ayuda',             icon: HelpCircle,      label: 'Ayuda' },
]

export const configNav: NavItem[] = [
  { to: '/usuarios',      icon: Users,      label: 'Usuarios',      roles: ['Administrador'] },
  { to: '/configuracion', icon: Settings,   label: 'Configuración', roles: ['Administrador'] },
  { to: '/perfil',        icon: UserCircle, label: 'Mi Perfil' }, // visible siempre
]

export const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/inicio':           { title: 'Inicio',           subtitle: 'Bienvenido a Valor Azul' },
  '/dashboard':        { title: 'Dashboard',        subtitle: 'Resumen general del sistema' },
  '/clientes':         { title: 'Clientes',         subtitle: 'Gestión de clientes registrados' },
  '/simulador':        { title: 'Simulador',        subtitle: 'Simulador de crédito vehicular' },
  '/mis-simulaciones': { title: 'Mis Simulaciones', subtitle: 'Tu historial personal de simulaciones' },
  '/historial':        { title: 'Historial',        subtitle: 'Registro de simulaciones y créditos' },
  '/ayuda':            { title: 'Ayuda',            subtitle: 'Centro de soporte y preguntas frecuentes' },
  '/usuarios':         { title: 'Usuarios',         subtitle: 'Gestión de usuarios del sistema' },
  '/configuracion':    { title: 'Configuración',    subtitle: 'Administra tu perfil, empresa y preferencias' },
  '/perfil':           { title: 'Mi Perfil',        subtitle: 'Actualiza tus datos personales' },
}

/**
 * Filtra un menú por rol. Si `roles` no está definido, el item pasa.
 * Se usa un default seguro ('Cliente') cuando aún no ha cargado el perfil,
 * de modo que el sidebar del cliente NUNCA aparezca vacío en el primer render.
 */
export function filtrarPorRol(items: NavItem[], rol: Rol | undefined): NavItem[] {
  const efectivo: Rol = rol ?? 'Cliente'
  return items.filter((it) => !it.roles || it.roles.includes(efectivo))
}
