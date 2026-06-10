import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/axios';
import { toast } from 'react-hot-toast';
import { getSocket } from '../../services/socketService';
import {
  Truck, Package, CheckCircle, MapPin, Phone,
  User, RefreshCw, Clock, LogOut, ExternalLink, Star
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const STATUS_LABEL = {
  READY_FOR_DELIVERY: 'Chờ nhận',
  DELIVERING:         'Đang giao',
  DELIVERED:          'Đã giao',
};

// ─── DeliveryCard ─────────────────────────────────────────────────────────────

const DeliveryCard = ({ order, onAction, loadingId }) => {
  const isLoading = loadingId === order.id;
  const isReady     = order.orderStatus === 'READY_FOR_DELIVERY';
  const isDelivering = order.orderStatus === 'DELIVERING';
  const isDelivered  = order.orderStatus === 'DELIVERED';

  const statusStyles = {
    READY_FOR_DELIVERY: 'border-cyan-200 bg-cyan-50/30',
    DELIVERING:         'border-orange-200 bg-orange-50/30',
    DELIVERED:          'border-emerald-200 bg-emerald-50/30',
  };

  const badgeStyles = {
    READY_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
    DELIVERING:         'bg-orange-100 text-orange-800',
    DELIVERED:          'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className={`rounded-2xl border-2 p-5 space-y-4 transition-all shadow-sm hover:shadow-md ${statusStyles[order.orderStatus] || 'border-slate-200 bg-white'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${badgeStyles[order.orderStatus]}`}>
            {STATUS_LABEL[order.orderStatus]}
          </span>
          <p className="font-mono text-xs text-slate-400 mt-1.5">{order.orderCode}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-red-600 text-base">{fmt(order.totalAmount)}</p>
          <p className="text-xs text-slate-400">{fmtDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white/80 rounded-xl p-4 space-y-2.5 border border-white shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <User size={14} className="text-slate-400 shrink-0" />
          <span className="font-bold text-slate-800">{order.user?.fullName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone size={14} className="text-slate-400 shrink-0" />
          <a href={`tel:${order.customerPhone}`} className="text-blue-600 font-semibold hover:underline">
            {order.customerPhone}
          </a>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <span className="text-slate-700 leading-relaxed">{order.shippingAddress}</span>
        </div>
        {order.note && (
          <div className="flex items-start gap-2 text-sm pt-1 border-t border-slate-100">
            <span className="text-amber-500 shrink-0">💬</span>
            <span className="text-amber-700 text-xs italic">{order.note}</span>
          </div>
        )}
      </div>

      {/* Products summary */}
      <div className="space-y-1.5">
        {order.orderItems?.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
            <Package size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{item.product?.name}</span>
            <span className="ml-auto font-bold shrink-0">×{item.quantity}</span>
          </div>
        ))}
        {order.orderItems?.length > 3 && (
          <p className="text-xs text-slate-400 pl-4">+{order.orderItems.length - 3} sản phẩm khác</p>
        )}
      </div>

      {/* Payment info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {order.paymentMethod === 'CASH' ? '💵 Thu tiền khi giao (COD)' : '✅ Đã thanh toán online'}
        </span>
        {order.paymentStatus === 'PAID' && (
          <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Đã TT</span>
        )}
      </div>

      {/* Action buttons */}
      {!isDelivered && (
        <div className="flex gap-2 pt-1">
          {isReady && (
            <>
              {!order.assignedShipperId && (
                <button
                  onClick={() => onAction(order.id, 'self-assign')}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Star size={15} />}
                  Nhận đơn
                </button>
              )}
              {order.assignedShipperId && (
                <button
                  onClick={() => onAction(order.id, 'start-delivering')}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Truck size={15} />}
                  Bắt đầu giao
                </button>
              )}
            </>
          )}
          {isDelivering && (
            <button
              onClick={() => onAction(order.id, 'delivered')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={15} />}
              Đã giao thành công
            </button>
          )}
        </div>
      )}

      {isDelivered && (
        <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl text-emerald-700 font-bold text-sm">
          <CheckCircle size={15} /> Giao thành công lúc {fmtDate(order.deliveredAt)}
        </div>
      )}
    </div>
  );
};

// ─── Main ShipperDashboard ────────────────────────────────────────────────────

const ShipperDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('mine');
  const [myOrders, setMyOrders]   = useState([]);
  const [available, setAvailable] = useState([]);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, availableRes, historyRes] = await Promise.all([
        api.get('/orders/shipper/my-orders?orderStatus=READY_FOR_DELIVERY,DELIVERING&limit=50'),
        api.get('/orders?orderStatus=READY_FOR_DELIVERY&limit=50'),
        api.get('/orders/shipper/my-orders?orderStatus=DELIVERED&limit=50'),
      ]);
      setMyOrders(mineRes.data.data   || []);
      setAvailable(availableRes.data.data || []);
      setHistory(historyRes.data.data  || []);
    } catch (err) {
      console.error('Failed to load shipper dashboard data:', err.response?.data || err.message || err);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const socket = getSocket();
    socket.emit('authenticate', { userId: user.id, role: user.role });

    const handleAssigned = (payload) => {
      toast.success(`Đơn hàng ${payload.orderCode} đã được phân công cho bạn!`);
      fetchAll();
    };
    const handleUpdated = () => fetchAll();

    socket.on('order_assigned', handleAssigned);
    socket.on('order_status_updated', handleUpdated);

    return () => {
      socket.off('order_assigned', handleAssigned);
      socket.off('order_status_updated', handleUpdated);
    };
  }, [fetchAll, user]);

  const handleAction = async (orderId, action) => {
    setLoadingId(orderId);
    try {
      switch (action) {
        case 'self-assign':
          await api.put(`/orders/${orderId}/self-assign`);
          toast.success('Đã nhận đơn!');
          break;
        case 'start-delivering':
          await api.put(`/orders/${orderId}/shipper-status`, {
            status: 'DELIVERING',
            note: 'Shipper bắt đầu giao',
          });
          toast.success('Đang giao hàng...');
          break;
        case 'delivered':
          await api.put(`/orders/${orderId}/shipper-status`, {
            status: 'DELIVERED',
            note: 'Shipper xác nhận đã giao thành công',
          });
          toast.success('Giao thành công! 🎉');
          break;
        default: break;
      }
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoadingId(null);
    }
  };

  const tabs = [
    { id: 'mine',      label: 'Đơn của tôi',   count: myOrders.length,  icon: <Truck size={14} /> },
    { id: 'available', label: 'Chờ nhận',       count: available.length, icon: <Clock size={14} /> },
    { id: 'history',   label: 'Lịch sử',        count: history.length,   icon: <CheckCircle size={14} /> },
  ];

  const activeOrders = activeTab === 'mine' ? myOrders : activeTab === 'available' ? available : history;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-4 py-5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <span className="font-black text-sm text-white">SHIPPER</span>
          </div>

          <div className="bg-slate-900 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-700 flex items-center justify-center text-xs font-black shrink-0">
              {user?.fullName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400">Shipper</p>
            </div>
            <a href="/" className="p-1 hover:bg-slate-800 rounded-lg">
              <ExternalLink size={11} className="text-slate-400" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-4 border-b border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Đang giao</span>
            <span className="font-black text-orange-400">{myOrders.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Chờ nhận</span>
            <span className="font-black text-cyan-400">{available.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Đã giao (tháng)</span>
            <span className="font-black text-emerald-400">{history.length}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span className="flex-1">{tab.label}</span>
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition font-semibold">
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {activeTab === 'mine' ? 'Đơn đang giao' :
               activeTab === 'available' ? 'Đơn chờ nhận' : 'Lịch sử giao hàng'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin w-10 h-10 border-2 border-orange-600 border-t-transparent rounded-full" />
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Truck size={32} className="text-slate-300" />
              </div>
              <p className="font-semibold">
                {activeTab === 'mine'      ? 'Bạn chưa có đơn nào đang giao' :
                 activeTab === 'available' ? 'Không có đơn nào sẵn sàng để nhận' :
                 'Chưa có lịch sử giao hàng'}
              </p>
              <p className="text-xs mt-1 text-slate-300">
                {activeTab === 'available' ? 'Đơn hàng sẽ xuất hiện ở đây khi Staff đóng gói xong' : ''}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeOrders.map((order) => (
                <DeliveryCard
                  key={order.id}
                  order={order}
                  onAction={handleAction}
                  loadingId={loadingId}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ShipperDashboard;
