import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import EcomNavbar from '../components/layout/EcomNavbar';
import EcomFooter from '../components/layout/EcomFooter';

const AccountPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-slate-900">
        <EcomNavbar />
      </div>

      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Tài khoản của tôi</h1>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header / Avatar */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-10 text-white flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{user.fullName.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.fullName}</h2>
                <p className="text-red-100 mt-1">{user.role}</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Thông tin liên hệ</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Số điện thoại</p>
                      <p className="font-medium text-slate-900">{user.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Địa chỉ giao hàng</h3>
                  <div>
                    <p className="text-sm text-slate-500">Địa chỉ mặc định</p>
                    <p className="font-medium text-slate-900">{user.address || 'Chưa cập nhật'}</p>
                  </div>
                </div>

              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                  Cập nhật thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <EcomFooter />
    </div>
  );
};

export default AccountPage;
