
import { Link, useLocation } from 'react-router-dom'

import type { NavItem } from './navConfig'
import './BottomNav.css'

export default function BottomNav({ items }: { items: NavItem[] }) {
  const location = useLocation()

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((item) => {
        const Icon = item.icon
        const active = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            className={active ? 'bn-item active' : 'bn-item'}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bn-icon">
              <Icon size={20} />
            </span>
            <span className="bn-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
