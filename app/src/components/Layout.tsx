import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Briefcase, Route, Map, Zap, Shield,
  DollarSign, Users, Mail, Settings, LogOut, Menu, X, UserCircle
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { fmt } from '@/lib/utils'
import { CONFIG, OVERHEAD_PER_JOB, BREAKEVEN_PER_JOB } from '@/lib/config'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/routes', label: 'Routes', icon: Route },
  { to: '/map', label: 'Map View', icon: Map },
  { to: '/optimize', label: 'Optimize', icon: Zap },
  { to: '/warranty', label: 'Warranty', icon: Shield },
  { to: '/financials', label: 'Financials', icon: DollarSign },
  { to: '/technicians', label: 'Technicians', icon: Users },
  { to: '/email', label: 'Email Monitor', icon: Mail },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/portal', label: 'Customer Portal', icon: UserCircle },
]

const tabNames: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'Jobs',
  '/routes': 'Routes',
  '/map': 'Map View',
  '/optimize': 'Optimize',
  '/warranty': 'Warranty',
  '/financials': 'Financials',
  '/technicians': 'Technicians',
  '/email': 'Email Monitor',
  '/settings': 'Settings',
  '/portal': 'Customer Portal',
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const setLoggedIn = useStore(s => s.setLoggedIn)

  const currentTabName = tabNames[location.pathname] || 'Dashboard'

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-[260px] bg-white border-r border-gray-200
        shadow-[2px_0_8px_rgba(0,0,0,0.05)] z-50 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-4 py-5 bg-navy text-white border-b border-navy-dark">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl font-extrabold">
              AS
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-wide">AKINO SOLAR</h2>
              <p className="text-[10px] opacity-85">Command Center v4.0</p>
            </div>
            <button className="lg:hidden ml-auto text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="bg-white/15 px-2 py-1.5 rounded-md text-[11px] font-bold text-center tracking-wide">
            BREAKEVEN: {fmt(BREAKEVEN_PER_JOB)} / JOB &bull; OH: {fmt(OVERHEAD_PER_JOB)} / JOB
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg my-0.5 text-sm font-medium
                transition-all duration-200 select-none
                ${isActive
                  ? 'bg-blue-100 text-blue-600 font-semibold'
                  : 'text-gray-500 hover:bg-blue-50 hover:text-navy'
                }
              `}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => setLoggedIn(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-navy">{currentTabName}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="hidden sm:inline">Generac Authorized</span>
            <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-xs font-bold">
              CM
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
