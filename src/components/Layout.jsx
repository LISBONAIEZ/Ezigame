import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/teams', label: 'Teams', icon: '🏆' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🥇' },
]

const adminLinks = [
  { to: '/admin', label: 'Admin Panel', icon: '⚙️' },
]

export default function Layout({ children }) {
  const { profile, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const allLinks = isAdmin ? [...navLinks, ...adminLinks] : navLinks

  return (
    <div className="min-h-screen flex bg-beige-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-beige-200 flex flex-col shadow-sm transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-beige-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center shadow-sm">
            <span className="text-white text-lg font-bold">E</span>
          </div>
          <div>
            <h1 className="text-mauve-800 font-bold text-base leading-none">EziGame</h1>
            <p className="text-mauve-500 text-xs mt-0.5">Gamification Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-mauve-500 uppercase tracking-wider mb-2">Main</p>
          {allLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-all duration-200
                ${isActive(link.to)
                  ? 'bg-pink-50 text-pink-500 shadow-sm'
                  : 'text-mauve-700 hover:bg-beige-100 hover:text-mauve-800'
                }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
              {isActive(link.to) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400" />
              )}
            </Link>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="p-4 border-t border-beige-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-beige-50 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-pink-100 flex-shrink-0">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pink-400 font-semibold text-sm">
                  {profile?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-mauve-800 text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
              <p className="text-mauve-500 text-xs truncate">{isAdmin ? 'Admin' : 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-mauve-600 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-beige-200 flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-beige-100 text-mauve-700"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-bold text-mauve-800">EziGame</span>
          </div>
          <div className="w-9" />
        </header>

        <div className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
