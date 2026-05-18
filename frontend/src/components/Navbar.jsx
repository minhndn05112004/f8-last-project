import { Link, useLocation } from 'react-router-dom'

const Navbar = () => {
  const location = useLocation()

  return (
    <nav className="glass border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group no-underline">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
              💬
            </div>
            <span className="font-bold text-lg gradient-text">ChatApp</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              id="nav-home"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
                location.pathname === '/'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              🏠 Home
            </Link>
            <Link
              to="/chat"
              id="nav-chat"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
                location.pathname === '/chat'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              💬 Chat
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
