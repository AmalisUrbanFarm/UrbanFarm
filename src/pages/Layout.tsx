import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, MapPin, Sprout, Users, ShoppingBasket,
  Calendar, LogOut, Bell, Settings, Activity, ClipboardList
} from 'lucide-react'

interface NavItem {
  section?: string
  path?: string
  label?: string
  icon?: React.ElementType
  staffOnly?: boolean
}

const NAV: NavItem[] = [
  { section: 'Principale' },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Agricoltura' },
  { path: '/campi', label: 'Campi', icon: MapPin },
  { path: '/colture', label: 'Colture', icon: Sprout },
  { path: '/attivita', label: 'Attività', icon: Activity },
  { path: '/valutazione-terreno', label: 'Valutazione Terreno', icon: ClipboardList, staffOnly: true },
  { path: '/terreni-valutati', label: 'Terreni Valutati', icon: MapPin, staffOnly: true },
  { section: 'Gestione' },
  { path: '/soci', label: 'Soci', icon: Users, staffOnly: true },
  { path: '/prodotti', label: 'Prodotti', icon: ShoppingBasket },
  { path: '/eventi', label: 'Eventi', icon: Calendar },
]

export default function Layout() {
  const { profile, isStaff, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const initials = (profile?.nome?.[0] ?? '') + (profile?.cognome?.[0] ?? '')

  return (
    <div className="flex h-screen overflow-hidden bg-cream">

      {/* SIDEBAR */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-verde-700 flex flex-col flex-shrink-0 transition-all duration-300`}>

        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-4 py-4 border-b border-white/10 cursor-pointer min-h-[60px] overflow-hidden"
        >
          <div className="w-8 h-8 bg-verde-300 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🌿</div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white text-[13px] font-semibold truncate">Amalis Urban Farm</div>
              <div className="text-white/40 text-[11px]">Divisione Sicilia</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((item, i) => {
            if (item.section) return !collapsed ? (
              <div key={i} className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-1">
                {item.section}
              </div>
            ) : <div key={i} className="py-2" />

            if (item.staffOnly && !isStaff()) return null
            const Icon = item.icon!
            const active = pathname === item.path

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path!)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] transition-all
                  ${active
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-2 border-t border-white/10">
          <button
            onClick={() => navigate('/profilo')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-verde-300 flex items-center justify-center text-verde-700 font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-white text-[12.5px] font-medium truncate">{profile?.nome} {profile?.cognome}</div>
                <div className="text-white/40 text-[11px]">{profile?.ruolo}</div>
              </div>
            )}
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-300/70 hover:bg-white/10 text-[13px] mt-1"
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Esci</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
          <h1 className="text-[22px] font-serif flex-1 text-gray-800">
            {NAV.find(n => n.path === pathname)?.label ?? 'Amalis Urban Farm'}
          </h1>
          <button className="w-9 h-9 border border-gray-200 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 hover:bg-verde-50 hover:border-verde-300 hover:text-verde-600 transition-all">
            <Bell size={15} />
          </button>
          <button className="w-9 h-9 border border-gray-200 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 hover:bg-verde-50 hover:border-verde-300 hover:text-verde-600 transition-all">
            <Settings size={15} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-7">
          <Outlet />
        </main>
      </div>

    </div>
  )
}