import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, ShoppingBag, BarChart3, Settings, ShieldCheck, UserPlus, Trash2, Edit } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock stats for now
    setStats({
      users: 154,
      products: 42,
      orders: 89,
      revenue: '124,500,000đ'
    });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Admin Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 bg-red-800 flex items-center gap-3">
          <ShieldCheck size={24} />
          <span className="font-bold tracking-wider">ADMIN PANEL</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'overview' ? 'bg-red-700' : 'hover:bg-gray-800'}`}
          >
            <LayoutDashboard size={18} /> Tổng quan
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'users' ? 'bg-red-700' : 'hover:bg-gray-800'}`}
          >
            <Users size={18} /> Quản lý Users
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'products' ? 'bg-red-700' : 'hover:bg-gray-800'}`}
          >
            <ShoppingBag size={18} /> Sản phẩm
          </button>
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            <BarChart3 size={18} /> Báo cáo
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold">AD</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.fullName}</p>
              <p className="text-[10px] text-gray-400">Administrator</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 hover:bg-red-900 rounded-lg transition text-xs font-bold"
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </div>

      {/* Admin Main Content */}
      <div className="flex-1 p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'users' ? 'User Management' : 'Product Management'}
          </h1>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium transition shadow-sm">
              <Settings size={16} /> Cài đặt
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm font-bold transition shadow-md">
              <UserPlus size={16} /> Thêm mới
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Tổng Users" value={stats.users} icon={<Users className="text-blue-500" />} />
            <StatCard title="Sản phẩm" value={stats.products} icon={<ShoppingBag className="text-purple-500" />} />
            <StatCard title="Đơn hàng" value={stats.orders} icon={<LayoutDashboard className="text-orange-500" />} />
            <StatCard title="Doanh thu" value={stats.revenue} icon={<BarChart3 className="text-green-500" />} />
          </div>
        )}

        {/* Mock Content for Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-500">#001</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">SA</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Super Admin</p>
                      <p className="text-xs text-gray-500">admin@meatshop.vn</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">ADMIN</span></td>
                <td className="px-6 py-4"><span className="flex items-center gap-1.5 text-xs text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Active</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition"><Edit size={16} /></button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-500">#002</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">NS</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Nguyễn Văn Staff</p>
                      <p className="text-xs text-gray-500">staff1@meatshop.vn</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">STAFF</span></td>
                <td className="px-6 py-4"><span className="flex items-center gap-1.5 text-xs text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Active</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition"><Edit size={16} /></button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
  </div>
);

export default AdminDashboard;
