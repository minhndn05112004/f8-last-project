import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  MessageSquare, 
  ClipboardList, 
  LogOut, 
  User, 
  Menu, 
  X,
  Shield,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Đã đăng xuất thành công');
      navigate('/login');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/staff/dashboard',
      icon: <LayoutDashboard size={18} />
    },
    {
      name: 'Quản lý sản phẩm',
      path: '/staff/products',
      icon: <Package size={18} />
    },
    {
      name: 'Quản lý tin tức',
      path: '/staff/news',
      icon: <FileText size={18} />
    },
    {
      name: 'Hỗ trợ khách hàng',
      path: '/staff/support',
      icon: <MessageSquare size={18} />
    },
    {
      name: 'Đơn hàng',
      path: '/staff/orders',
      icon: <ClipboardList size={18} />
    }
  ];

  const isPathActive = (path) => {
    if (path === '/staff/dashboard') {
      return location.pathname === '/staff/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-red-500" size={24} />
            <span className="font-extrabold text-sm tracking-wider text-red-500 uppercase">ANTHONY ADMIN</span>
          </div>
          <button 
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User profile info */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="w-9 h-9 rounded-full bg-red-800 flex items-center justify-center font-bold text-sm text-white shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-100">{user?.fullName || 'Staff User'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{user?.role || 'STAFF'}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isPathActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl border transition-all no-underline ${
                  active
                    ? 'bg-red-800 border-red-700 text-white shadow-md shadow-red-950/20'
                    : 'bg-slate-900/50 border-transparent text-slate-450 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex gap-2">
          <a 
            href="/" 
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 no-underline transition-all border border-slate-755"
          >
            <ExternalLink size={12} />
            <span>Xem Shop</span>
          </a>
          <button 
            onClick={handleLogout} 
            className="p-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-slate-755"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden lg:block">
              <span className="text-xs text-slate-450 font-medium">Hệ thống quản trị bán hàng</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-red-400">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'S'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-950">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default StaffLayout;
