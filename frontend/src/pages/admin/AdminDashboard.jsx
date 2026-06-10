import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/axios';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboard, ShoppingBag, Users, LogOut, RefreshCw,
  CheckCircle, XCircle, Truck, Package, ChevronRight,
  Search, Eye, UserCheck, AlertTriangle, TrendingUp,
  Clock, Star, BarChart3, ExternalLink
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ORDER_STATUS_LABEL = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED:            'Đã xác nhận',
  PREPARING:            'Đang chuẩn bị',
  READY_FOR_DELIVERY:   'Sẵn sàng giao',
  DELIVERING:           'Đang giao',
  DELIVERED:            'Đã giao',
  CANCELLED:            'Đã hủy',
};

const ORDER_STATUS_COLOR = {
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-800 ring-amber-200',
  CONFIRMED:            'bg-blue-100 text-blue-800 ring-blue-200',
  PREPARING:            'bg-violet-100 text-violet-800 ring-violet-200',
  READY_FOR_DELIVERY:   'bg-cyan-100 text-cyan-800 ring-cyan-200',
  DELIVERING:           'bg-orange-100 text-orange-800 ring-orange-200',
  DELIVERED:            'bg-emerald-100 text-emerald-800 ring-emerald-200',
  CANCELLED:            'bg-red-100 text-red-800 ring-red-200',
};

const PAYMENT_STATUS_LABEL = {
  PENDING:  'Chưa TT',
  PAID:     'Đã TT',
  REFUNDED: 'Hoàn tiền',
  FAILED:   'Lỗi TT',
};

const PAYMENT_STATUS_COLOR = {
  PENDING:  'bg-amber-50 text-amber-700',
  PAID:     'bg-emerald-50 text-emerald-700',
  REFUNDED: 'bg-blue-50 text-blue-700',
  FAILED:   'bg-red-50 text-red-700',
};

// ─── StatCard ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className={`rounded-2xl p-5 border flex items-start gap-4 ${color}`}>
    <div className="p-2.5 rounded-xl bg-white/60 shadow-sm shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 truncate">{label}</p>
      <p className="text-2xl font-black mt-0.5">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Order Detail Drawer ──────────────────────────────────────────────────────

const OrderDetailDrawer = ({ order, shippers, onClose, onRefresh }) => {
  const [assigningShipper, setAssigningShipper] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleStatusUpdate = async (status, note) => {
    setLoading(true);
    try {
      await api.put(`/orders/${order.id}/status`, { status, note });
      toast.success(`Đã cập nhật: ${ORDER_STATUS_LABEL[status]}`);
      onRefresh();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  const handleAssignShipper = async () => {
    if (!selectedShipper) return toast.error('Vui lòng chọn shipper');
    setLoading(true);
    try {
      await api.put(`/orders/${order.id}/assign-shipper`, { shipperId: parseInt(selectedShipper) });
      toast.success('Đã phân công shipper');
      setAssigningShipper(false);
      onRefresh();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await api.put(`/orders/${order.id}/cancel`, { reason: cancelReason });
      toast.success('Đã hủy đơn hàng');
      setShowCancelModal(false);
      onRefresh();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  const canConfirm = order.orderStatus === 'PENDING_CONFIRMATION';
  const canPrepare = order.orderStatus === 'CONFIRMED';
  const canReadyForDelivery = order.orderStatus === 'PREPARING';
  const canAssignShipper = ['READY_FOR_DELIVERY', 'DELIVERING'].includes(order.orderStatus);
  const canCancel = !['DELIVERED', 'CANCELLED'].includes(order.orderStatus);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-slate-400 font-medium">Chi tiết đơn hàng</p>
            <h2 className="text-white font-black text-lg">{order.orderCode}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <XCircle size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">

          {/* Status badges */}
          <div className="flex gap-3 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ring-1 ${ORDER_STATUS_COLOR[order.orderStatus]}`}>
              {ORDER_STATUS_LABEL[order.orderStatus]}
            </span>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${PAYMENT_STATUS_COLOR[order.paymentStatus]}`}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </span>
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
              {order.paymentMethod === 'CASH' ? '💵 COD' : '🏦 Chuyển khoản'}
            </span>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2.5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-3">
              👤 Thông tin khách hàng
            </h3>
            <InfoRow label="Họ tên"      value={order.user?.fullName} />
            <InfoRow label="SĐT"         value={order.customerPhone} />
            <InfoRow label="Email"       value={order.customerEmail} />
            <InfoRow label="Địa chỉ"    value={order.shippingAddress} />
            {order.note && <InfoRow label="Ghi chú" value={order.note} />}
            {order.cancelReason && (
              <InfoRow label="Lý do hủy" value={order.cancelReason} highlight />
            )}
          </div>

          {/* Products */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
              📦 Sản phẩm
            </h3>
            <div className="space-y-3">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {item.product?.thumbnail && (
                      <img
                        src={item.product.thumbnail.startsWith('http') ? item.product.thumbnail : `${import.meta.env.VITE_API_URL?.replace('/api','')}${item.product.thumbnail}`}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.product?.name}</p>
                    <p className="text-xs text-slate-500">x{item.quantity} × {fmt(item.price)}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between">
              <span className="font-bold text-slate-700">Tổng cộng</span>
              <span className="font-black text-red-600 text-lg">{fmt(order.totalAmount)}</span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-3">
              🕐 Lịch sử thời gian
            </h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Đặt hàng"   value={fmtDate(order.createdAt)} />
              <InfoRow label="Thanh toán" value={fmtDate(order.paidAt)} />
              <InfoRow label="Xác nhận"   value={fmtDate(order.confirmedAt)} />
              <InfoRow label="Chuẩn bị"   value={fmtDate(order.preparedAt)} />
              <InfoRow label="Bắt đầu giao" value={fmtDate(order.shippedAt)} />
              <InfoRow label="Đã giao"    value={fmtDate(order.deliveredAt)} />
              {order.cancelledAt && <InfoRow label="Hủy lúc" value={fmtDate(order.cancelledAt)} highlight />}
            </div>
          </div>

          {/* Shipper info */}
          {order.assignedShipper && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-3">🚚 Shipper</h3>
              <InfoRow label="Tên"  value={order.assignedShipper.fullName} />
              <InfoRow label="SĐT" value={order.assignedShipper.phone || '—'} />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-white border-t border-slate-100 p-5 shrink-0 space-y-3">
          {/* Quick action buttons */}
          <div className="flex gap-2 flex-wrap">
            {canConfirm && (
              <ActionBtn
                onClick={() => handleStatusUpdate('CONFIRMED', 'Admin xác nhận đơn')}
                loading={loading} color="blue" icon={<CheckCircle size={15} />}
              >Xác nhận đơn</ActionBtn>
            )}
            {canPrepare && (
              <ActionBtn
                onClick={() => handleStatusUpdate('PREPARING', 'Bắt đầu chuẩn bị hàng')}
                loading={loading} color="violet" icon={<Package size={15} />}
              >Bắt đầu chuẩn bị</ActionBtn>
            )}
            {canReadyForDelivery && (
              <ActionBtn
                onClick={() => handleStatusUpdate('READY_FOR_DELIVERY', 'Hàng đã đóng gói')}
                loading={loading} color="cyan" icon={<Star size={15} />}
              >Sẵn sàng giao</ActionBtn>
            )}
            {canAssignShipper && (
              <ActionBtn
                onClick={() => setAssigningShipper(true)}
                loading={loading} color="orange" icon={<Truck size={15} />}
              >Phân công Shipper</ActionBtn>
            )}
            {canCancel && (
              <ActionBtn
                onClick={() => setShowCancelModal(true)}
                loading={loading} color="red" icon={<XCircle size={15} />}
                outline
              >Hủy đơn</ActionBtn>
            )}
          </div>

          {/* Assign Shipper panel */}
          {assigningShipper && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-orange-800">Chọn Shipper</p>
              <select
                value={selectedShipper}
                onChange={(e) => setSelectedShipper(e.target.value)}
                className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">— Chọn shipper —</option>
                {shippers.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} {s.phone ? `(${s.phone})` : ''}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={handleAssignShipper} disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold py-2 rounded-lg transition disabled:opacity-50">
                  Xác nhận phân công
                </button>
                <button onClick={() => setAssigningShipper(false)} className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-lg transition">
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Cancel Modal */}
          {showCancelModal && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-800">
                ⚠️ Xác nhận hủy đơn {order.paymentStatus === 'PAID' ? '— Sẽ chuyển sang Hoàn tiền' : ''}
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Lý do hủy (tuỳ chọn)..."
                rows={2}
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleCancel} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 rounded-lg transition disabled:opacity-50">
                  Xác nhận hủy
                </button>
                <button onClick={() => setShowCancelModal(false)} className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-lg transition">
                  Quay lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, highlight }) => (
  <div className="flex gap-2">
    <span className="text-xs text-slate-500 shrink-0 w-28">{label}:</span>
    <span className={`text-xs font-semibold ${highlight ? 'text-red-600' : 'text-slate-800'} break-words`}>{value || '—'}</span>
  </div>
);

const ActionBtn = ({ children, onClick, loading, color, icon, outline }) => {
  const colors = {
    blue:   outline ? 'border-blue-400 text-blue-700 hover:bg-blue-50'   : 'bg-blue-600 hover:bg-blue-700 text-white',
    violet: outline ? 'border-violet-400 text-violet-700'                 : 'bg-violet-600 hover:bg-violet-700 text-white',
    cyan:   outline ? 'border-cyan-400 text-cyan-700'                     : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    orange: outline ? 'border-orange-400 text-orange-700'                 : 'bg-orange-500 hover:bg-orange-600 text-white',
    red:    outline ? 'border-red-400 text-red-700 hover:bg-red-50'       : 'bg-red-600 hover:bg-red-700 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 border ${outline ? colors[color] : `border-transparent ${colors[color]}`}`}
    >
      {icon}{children}
    </button>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────

const OrdersTab = ({ shippers }) => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filterStatus)  params.append('orderStatus', filterStatus);
      if (filterPayment) params.append('paymentStatus', filterPayment);
      if (search)        params.append('search', search);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.data || []);
      setTotal(data.total || 0);
    } catch { toast.error('Không thể tải đơn hàng'); }
    finally { setLoading(false); }
  }, [page, filterStatus, filterPayment, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm mã đơn, SĐT, tên khách..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filterPayment}
          onChange={(e) => { setFilterPayment(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">Tất cả thanh toán</option>
          {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={fetchOrders} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600 bg-white">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">Đơn hàng</th>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Sản phẩm</th>
                <th className="px-5 py-4">Tổng tiền</th>
                <th className="px-5 py-4">Thanh toán</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400">
                  <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">Không có đơn hàng nào</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-bold text-slate-800">{order.orderCode}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(order.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 text-sm">{order.user?.fullName}</p>
                    <p className="text-xs text-slate-400">{order.customerPhone}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {order.orderItems?.slice(0, 2).map(i => (
                      <span key={i.id} className="block truncate max-w-[140px]">{i.product?.name} x{i.quantity}</span>
                    ))}
                    {order.orderItems?.length > 2 && <span className="text-slate-400">+{order.orderItems.length - 2} khác</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-red-600 text-sm">{fmt(order.totalAmount)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${PAYMENT_STATUS_COLOR[order.paymentStatus]}`}>
                      {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2 py-1.5 rounded-lg ring-1 ${ORDER_STATUS_COLOR[order.orderStatus]}`}>
                      {ORDER_STATUS_LABEL[order.orderStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                    >
                      <Eye size={12} /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị {orders.length} / {total} đơn</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-slate-50 transition font-medium">
                ← Trước
              </button>
              <span className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 15}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-slate-50 transition font-medium">
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          shippers={shippers}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Không thể tải thống kê'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng đơn" value={stats.total} icon={<ShoppingBag size={20} className="text-slate-600" />} color="bg-slate-50 border-slate-200 text-slate-800" sub={`Hôm nay: ${stats.todayOrders}`} />
        <StatCard label="Doanh thu" value={fmt(stats.totalRevenue)} icon={<TrendingUp size={20} className="text-emerald-600" />} color="bg-emerald-50 border-emerald-200 text-emerald-800" sub="Đơn đã thanh toán" />
        <StatCard label="Chờ xác nhận" value={stats.pendingConfirmation} icon={<Clock size={20} className="text-amber-600" />} color="bg-amber-50 border-amber-200 text-amber-800" sub="Cần xử lý ngay" />
        <StatCard label="Đã hủy" value={stats.cancelled} icon={<XCircle size={20} className="text-red-600" />} color="bg-red-50 border-red-200 text-red-800" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Đã xác nhận',   value: stats.confirmed,          color: 'bg-blue-50 border-blue-200 text-blue-800',     icon: <CheckCircle size={18} className="text-blue-600" /> },
          { label: 'Đang chuẩn bị', value: stats.preparing,          color: 'bg-violet-50 border-violet-200 text-violet-800', icon: <Package size={18} className="text-violet-600" /> },
          { label: 'Sẵn sàng giao', value: stats.readyForDelivery,   color: 'bg-cyan-50 border-cyan-200 text-cyan-800',     icon: <Star size={18} className="text-cyan-600" /> },
          { label: 'Đang giao',     value: stats.delivering,         color: 'bg-orange-50 border-orange-200 text-orange-800', icon: <Truck size={18} className="text-orange-600" /> },
          { label: 'Đã giao',       value: stats.delivered,          color: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: <CheckCircle size={18} className="text-emerald-600" /> },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>
    </div>
  );
};

// ─── Main AdminDashboard ──────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [shippers, setShippers] = useState([]);

  useEffect(() => {
    api.get('/orders/shippers')
      .then(({ data }) => setShippers(data.data || []))
      .catch(() => {});
  }, []);

  const navItems = [
    { id: 'overview',  label: 'Tổng quan', icon: <LayoutDashboard size={16} /> },
    { id: 'orders',    label: 'Đơn hàng',  icon: <ShoppingBag size={16} /> },
    { id: 'shippers',  label: 'Shippers',   icon: <Truck size={16} /> },
    { id: 'employees', label: 'Quản lý nhân viên', icon: <Users size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-950 text-white flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-black text-sm tracking-wider text-white">ADMIN PANEL</span>
          </div>
          <div className="flex items-center gap-2.5 bg-slate-900 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center text-xs font-black">
              {user?.fullName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400">Administrator</p>
            </div>
            <a href="/" className="p-1 hover:bg-slate-800 rounded-lg transition">
              <ExternalLink size={12} className="text-slate-400" />
            </a>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${
                activeTab === item.id
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 shrink-0">
          <h1 className="text-xl font-black text-slate-900">
            {activeTab === 'overview'  ? 'Tổng quan hệ thống' :
             activeTab === 'orders'    ? 'Quản lý đơn hàng' :
             activeTab === 'shippers'  ? 'Danh sách Shipper' :
             'Quản lý nhân viên'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview'  && <OverviewTab />}
          {activeTab === 'orders'    && <OrdersTab shippers={shippers} />}
          {activeTab === 'shippers'  && <ShippersTab shippers={shippers} />}
          {activeTab === 'employees' && <EmployeesTab />}
        </div>
      </main>
    </div>
  );
};

// ─── Shippers Tab ─────────────────────────────────────────────────────────────

const ShippersTab = ({ shippers }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-slate-100">
      <h2 className="font-bold text-slate-800">Danh sách Shipper ({shippers.length})</h2>
      <p className="text-xs text-slate-400 mt-1">Tài khoản có vai trò SHIPPER trong hệ thống</p>
    </div>
    {shippers.length === 0 ? (
      <div className="py-16 text-center text-slate-400 text-sm">
        Chưa có tài khoản Shipper nào. Tạo tài khoản với role SHIPPER.
      </div>
    ) : (
      <div className="divide-y divide-slate-50">
        {shippers.map((s) => (
          <div key={s.id} className="px-6 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm shrink-0">
              {s.fullName?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">{s.fullName}</p>
              <p className="text-xs text-slate-400">{s.phone || s.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-600">{s._count?.assignedOrders || 0} đơn</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Employees Tab ─────────────────────────────────────────────────────────────

const EmployeesTab = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'STAFF',
    branch: 'Hà Nội'
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/employees');
      setEmployees(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/employees', form);
      toast.success('Tạo nhân viên thành công.');
      setForm({
        username: '',
        password: '',
        fullName: '',
        role: 'STAFF',
        branch: 'Hà Nội'
      });
      fetchEmployees();
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData) {
        if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          const validationMsg = responseData.errors.map(e => e.message).join(', ');
          toast.error(validationMsg);
        } else if (responseData.message) {
          toast.error(responseData.message);
        } else {
          toast.error('Đã xảy ra lỗi khi tạo nhân viên. Vui lòng thử lại.');
        }
      } else {
        toast.error('Đã xảy ra lỗi khi tạo nhân viên. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Creation Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit">
        <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
          <UserCheck size={18} className="text-red-600" /> Thêm nhân viên mới
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tên tài khoản (Username)
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: staff_hn_01"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tên nhân viên
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn A"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Vai trò
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="STAFF">STAFF</option>
                <option value="SHIPPER">SHIPPER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Chi nhánh
              </label>
              <select
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-750 text-white text-sm font-bold py-3 rounded-xl transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-lg shadow-red-100"
          >
            {submitting ? 'Đang tạo...' : 'Tạo nhân viên'}
          </button>
        </form>
      </div>

      {/* Employees List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Users size={18} className="text-slate-600" /> Danh sách nhân viên ({employees.length})
          </h2>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600 bg-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Chưa có nhân viên nào được tạo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Chi nhánh</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          emp.role === 'STAFF' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {emp.fullName?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{emp.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-slate-600">{emp.username}</td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        emp.role === 'STAFF' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate-600 font-medium">{emp.branch || '—'}</span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {fmtDate(emp.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
