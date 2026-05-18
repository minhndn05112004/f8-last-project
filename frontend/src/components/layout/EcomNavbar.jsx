import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const EcomNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Sản phẩm', path: '/products' },
    { name: 'Tin tức', path: '/news' },
    { name: 'About Us', path: '/about' },
  ];

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    toast.success('Đã đăng xuất');
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
          <span className={`text-xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
            Anthony <span className="text-red-600">Shop</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-medium no-underline transition-colors ${
                location.pathname === link.path 
                  ? 'text-red-600' 
                  : isScrolled ? 'text-slate-600 hover:text-red-600' : 'text-white/80 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-5">
          
          {/* User Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 p-2 rounded-full transition-colors ${isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
                <span className="hidden sm:block text-sm font-medium">{user.fullName.split(' ')[0]}</span>
              </button>
            ) : (
              <Link 
                to="/login"
                className={`p-2 rounded-full transition-colors ${isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </Link>
            )}

            {/* Dropdown Menu */}
            {isDropdownOpen && user && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-slate-100 overflow-hidden transform origin-top-right transition-all">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                
                {user.role === 'ADMIN' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 no-underline transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                
                {user.role === 'STAFF' && (
                  <Link 
                    to="/staff/dashboard" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 no-underline transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Staff Dashboard
                  </Link>
                )}

                <Link 
                  to="/account" 
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 no-underline transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Chi tiết tài khoản
                </Link>
                
                <Link 
                  to="/account/orders" 
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 no-underline transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Đơn hàng của tôi
                </Link>
                
                <div className="border-t border-slate-100 mt-1"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>

          <Link to="/cart" className={`relative p-2 rounded-full transition-colors no-underline ${isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold">0</span>
          </Link>
          
          {/* Mobile Menu Toggle (Simplified) */}
          <button className={`md:hidden p-2 ${isScrolled ? 'text-slate-700' : 'text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default EcomNavbar;
