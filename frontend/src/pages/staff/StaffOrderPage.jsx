import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/axios';
import { toast } from 'react-hot-toast';
import { getSocket } from '../../services/socketService';
import { RefreshCw, CheckCircle, Package, Clock, Truck, List } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const PAYMENT_COLOR = {
  PENDING:  'bg-amber-100 text-amber-700',
  PAID:     'bg-emerald-100 text-emerald-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
  FAILED:   'bg-red-100 text-red-700',
};
const PAYMENT_LABEL = { PENDING: 'Chưa TT', PAID: 'Đã TT', REFUNDED: 'Hoàn tiền', FAILED: 'Lỗi TT' };

const STATUS_COLOR = {
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-800',
  CONFIRMED:            'bg-blue-100 text-blue-800',
  PREPARING:            'bg-violet-100 text-violet-800',
  READY_FOR_DELIVERY:   'bg-cyan-100 text-cyan-800',
  DELIVERING:           'bg-orange-100 text-orange-800',
  DELIVERED:            'bg-emerald-100 text-emerald-800',
  CANCELLED:            'bg-red-100 text-red-800',
};
const STATUS_LABEL = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED:            'Đã xác nhận',
  PREPARING:            'Đang chuẩn bị',
  READY_FOR_DELIVERY:   'Sẵn sàng giao',
  DELIVERING:           'Đang giao',
  DELIVERED:            'Đã giao',
  CANCELLED:            'Đã hủy',
};

// ─── OrderCard ────────────────────────────────────────────────────────────────

const OrderCard = ({ order, actions }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
    {/* Header */}
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-mono text-xs font-bold text-slate-500">{order.orderCode}</p>
        <p className="font-bold text-slate-900 text-sm mt-0.5">{order.user?.fullName}</p>
        <p className="text-xs text-slate-400">{order.customerPhone}</p>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[order.orderStatus]}`}>
          {STATUS_LABEL[order.orderStatus]}
        </span>
        <br />
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${PAYMENT_COLOR[order.paymentStatus]}`}>
          {PAYMENT_LABEL[order.paymentStatus]}
        </span>
      </div>
    </div>

    {/* Products */}
    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
      {order.orderItems?.map((item) => (
        <div key={item.id} className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 min-w-0">
            {item.product?.thumbnail && (
              <img
                src={item.product.thumbnail.startsWith('http') ? item.product.thumbnail : `${import.meta.env.VITE_API_URL?.replace('/api','')}${item.product.thumbnail}`}
                alt="" className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            )}
            <span className="text-slate-700 font-medium truncate">{item.product?.name}</span>
          </div>
          <span className="text-slate-500 shrink-0 ml-2 font-bold">×{item.quantity}</span>
        </div>
      ))}
      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
        <span className="text-slate-500">Tổng:</span>
        <span className="font-black text-red-600">{fmt(order.totalAmount)}</span>
      </div>
    </div>

    {/* Address */}
    <div className="text-xs text-slate-500 leading-relaxed">
      <span className="font-semibold text-slate-700">📍 </span>{order.shippingAddress}
    </div>
    {order.note && (
      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
        💬 {order.note}
      </p>
    )}
    <p className="text-xs text-slate-400">{fmtDate(order.createdAt)}</p>

    {/* Actions */}
    {actions && (
      <div className="flex gap-2 flex-wrap pt-1 border-t border-slate-100">
        {actions}
      </div>
    )}
  </div>
);

// ─── Tab: Cần xác nhận (PENDING_CONFIRMATION) ────────────────────────────────

const PendingConfirmationTab = ({ orders, onRefresh }) => {
  const [loading, setLoading] = useState({});

  const handleConfirm = async (id) => {
    setLoading((p) => ({ ...p, [id]: true }));
    try {
      await api.put(`/orders/${id}/status`, { status: 'CONFIRMED', note: 'Staff xác nhận đơn' });
      toast.success('Đã xác nhận đơn hàng!');
      onRefresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Xác nhận hủy đơn hàng này?')) return;
    setLoading((p) => ({ ...p, [id]: true }));
    try {
      await api.put(`/orders/${id}/cancel`, { reason: 'Staff hủy đơn' });
      toast.success('Đã hủy đơn');
      onRefresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
    }
  };

  if (orders.length === 0) return <EmptyState icon={<Clock size={40} />} text="Không có đơn nào chờ xác nhận" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          actions={
            <>
              <button
                onClick={() => handleConfirm(order.id)}
                disabled={loading[order.id]}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                <CheckCircle size={14} /> Xác nhận đơn
              </button>
              <button
                onClick={() => handleCancel(order.id)}
                disabled={loading[order.id]}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                Hủy
              </button>
            </>
          }
        />
      ))}
    </div>
  );
};

// ─── Tab: Đang chuẩn bị (CONFIRMED + PREPARING) ───────────────────────────────

const PreparingTab = ({ orders, onRefresh }) => {
  const [loading, setLoading] = useState({});

  const handleStartPrepare = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'start' }));
    try {
      await api.put(`/orders/${id}/status`, { status: 'PREPARING', note: 'Bắt đầu chuẩn bị hàng' });
      toast.success('Đang chuẩn bị hàng');
      onRefresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleDonePrepare = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'done' }));
    try {
      await api.put(`/orders/${id}/status`, { status: 'READY_FOR_DELIVERY', note: 'Đã đóng gói xong' });
      toast.success('Đã chuẩn bị xong — chuyển sang Sẵn sàng giao');
      onRefresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading((p) => ({ ...p, [id]: null }));
    }
  };

  if (orders.length === 0) return <EmptyState icon={<Package size={40} />} text="Không có đơn nào đang chuẩn bị" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          actions={
            order.orderStatus === 'CONFIRMED' ? (
              <button
                onClick={() => handleStartPrepare(order.id)}
                disabled={!!loading[order.id]}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                <Package size={14} /> Bắt đầu chuẩn bị
              </button>
            ) : (
              <button
                onClick={() => handleDonePrepare(order.id)}
                disabled={!!loading[order.id]}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                <CheckCircle size={14} /> Đã chuẩn bị xong
              </button>
            )
          }
        />
      ))}
    </div>
  );
};

// ─── Tab: Sẵn sàng giao (READY_FOR_DELIVERY) ────────────────────────────────

const ReadyForDeliveryTab = ({ orders }) => {
  if (orders.length === 0) return <EmptyState icon={<Truck size={40} />} text="Không có đơn nào sẵn sàng giao" />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          actions={
            <div className="flex-1 py-2.5 bg-cyan-50 text-cyan-700 text-sm font-bold rounded-xl text-center">
              ⏳ Chờ Admin phân công Shipper
            </div>
          }
        />
      ))}
    </div>
  );
};

// ─── Tab: Tất cả (read-only) ──────────────────────────────────────────────────

const AllOrdersTab = ({ orders }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
          <tr>
            <th className="px-5 py-4">Mã đơn</th>
            <th className="px-5 py-4">Khách hàng</th>
            <th className="px-5 py-4">Tổng tiền</th>
            <th className="px-5 py-4">Thanh toán</th>
            <th className="px-5 py-4">Trạng thái</th>
            <th className="px-5 py-4">Ngày đặt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700">{order.orderCode}</td>
              <td className="px-5 py-3">
                <p className="font-semibold text-slate-800">{order.user?.fullName}</p>
                <p className="text-xs text-slate-400">{order.customerPhone}</p>
              </td>
              <td className="px-5 py-3 font-bold text-red-600">
                {fmt(order.totalAmount)}
              </td>
              <td className="px-5 py-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${PAYMENT_COLOR[order.paymentStatus]}`}>
                  {PAYMENT_LABEL[order.paymentStatus]}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className={`text-xs font-bold px-2 py-1.5 rounded-lg ${STATUS_COLOR[order.orderStatus]}`}>
                  {STATUS_LABEL[order.orderStatus]}
                </span>
              </td>
              <td className="px-5 py-3 text-xs text-slate-400">{fmtDate(order.createdAt)}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="py-12 text-center text-slate-400">Không có đơn hàng nào</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
      {icon}
    </div>
    <p className="text-sm font-medium">{text}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const StaffOrderPage = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders?limit=200');
      setAllOrders(data.data || []);
    } catch {
      toast.error('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    socket.emit('join_staff_dashboard');

    const handleOrderUpdate = () => fetchOrders();
    socket.on('order_status_updated', handleOrderUpdate);
    socket.on('order_updated', handleOrderUpdate);

    return () => {
      socket.off('order_status_updated', handleOrderUpdate);
      socket.off('order_updated', handleOrderUpdate);
    };
  }, [fetchOrders]);

  const pendingOrders        = allOrders.filter((o) => o.orderStatus === 'PENDING_CONFIRMATION');
  const preparingOrders      = allOrders.filter((o) => ['CONFIRMED', 'PREPARING'].includes(o.orderStatus));
  const readyOrders          = allOrders.filter((o) => o.orderStatus === 'READY_FOR_DELIVERY');

  const tabs = [
    { id: 'pending',    label: 'Cần xác nhận',   count: pendingOrders.length,   icon: <Clock size={14} />,        color: 'amber' },
    { id: 'preparing',  label: 'Chuẩn bị hàng',  count: preparingOrders.length, icon: <Package size={14} />,      color: 'violet' },
    { id: 'ready',      label: 'Sẵn sàng giao',  count: readyOrders.length,     icon: <Truck size={14} />,        color: 'cyan' },
    { id: 'all',        label: 'Tất cả đơn',      count: allOrders.length,       icon: <List size={14} />,         color: 'slate' },
  ];

  const tabColorMap = {
    amber:  { active: 'bg-amber-600 text-white',  badge: 'bg-amber-100 text-amber-700' },
    violet: { active: 'bg-violet-600 text-white', badge: 'bg-violet-100 text-violet-700' },
    cyan:   { active: 'bg-cyan-600 text-white',   badge: 'bg-cyan-100 text-cyan-700' },
    slate:  { active: 'bg-slate-700 text-white',  badge: 'bg-slate-100 text-slate-600' },
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-0.5">Xác nhận, chuẩn bị và theo dõi đơn hàng</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => {
          const colors = tabColorMap[tab.color];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition border ${
                isActive
                  ? `${colors.active} border-transparent shadow-md`
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : colors.badge}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {activeTab === 'pending'   && <PendingConfirmationTab orders={pendingOrders}   onRefresh={fetchOrders} />}
          {activeTab === 'preparing' && <PreparingTab           orders={preparingOrders} onRefresh={fetchOrders} />}
          {activeTab === 'ready'     && <ReadyForDeliveryTab    orders={readyOrders} />}
          {activeTab === 'all'       && <AllOrdersTab           orders={allOrders} />}
        </>
      )}
    </div>
  );
};

export default StaffOrderPage;
