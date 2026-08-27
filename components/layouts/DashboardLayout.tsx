'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { COLORS } from '@/lib/constants'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/auth/login')
  }

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Jogadores', href: '/players', icon: '👥' }
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR DESKTOP */}
      <div
        className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col"
        style={{ backgroundColor: COLORS.dark_green }}
      >
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="px-6 pb-6 border-b" style={{ borderColor: COLORS.primary_green }}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚽</div>
              <div>
                <h1 className="text-white font-bold text-lg">Futebol</h1>
                <p className="text-xs text-gray-300">dos Irmãos</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="mt-6 flex-1 px-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-3 rounded-lg text-gray-200 hover:bg-opacity-20 hover:bg-white transition text-sm font-medium"
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-t" style={{ borderColor: COLORS.primary_green }}>
          <div className="mb-4 text-gray-300 text-sm">
            <p className="font-semibold text-white">{user?.name}</p>
            <p className="text-xs">{user?.role === 'admin' ? 'Administrador' : 'Jogador'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
          >
            Sair
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* HEADER */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                ☰
              </button>
              <h2 className="text-xl font-bold text-gray-800">{title || 'Dashboard'}</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={handleSignOut}
                className="hidden lg:block text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* MOBILE FOOTER MENU */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around">
            {menuItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 py-3 text-center text-gray-600 hover:text-green-600 transition text-xs flex flex-col items-center gap-1"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label.split(' ')[0]}</span>
              </Link>
            ))}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex-1 py-3 text-center text-gray-600 hover:text-green-600 transition text-xs flex flex-col items-center gap-1"
            >
              <span className="text-lg">⋮</span>
              <span>Mais</span>
            </button>
          </div>
        </nav>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-64 flex-col overflow-y-auto"
            style={{ backgroundColor: COLORS.dark_green }}
          >
            <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: COLORS.primary_green }}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚽</div>
                <div>
                  <h1 className="text-white font-bold text-lg">Futebol</h1>
                  <p className="text-xs text-gray-300">dos Irmãos</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <nav className="mt-6 px-4 space-y-2 flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-200 hover:bg-opacity-20 hover:bg-white transition text-sm font-medium"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
