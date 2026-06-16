import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../services/axios';
import { getSocket } from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, Package, Truck, MapPin, Phone, XCircle } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : null;

// ─── 5-step progress visible to customer ─────────────────────────────────────
// READY_FOR_DELIVERY is internal — mapped to step 2 (same as PREPARING)

const CUSTOMER_STEPS = [
  {
    key:       'placed',
    label:     'Đã đặt hàng',
    sublabel:  'Đơn hàng đã được ghi nhận',
    icon:      <CheckCircle size={18} />,
    tsField:   'createdAt',
  },
  {
    key:       'confirmed',
    label:     'Đã xác nhận',
    sublabel:  'Shop đã xác nhận đơn của bạn',
    icon:      <CheckCircle size={18} />,
    tsField:   'confirmedAt',
  },
  {
    key:       'preparing',
    label:     'Đang chuẩn bị',
    sublabel:  'Sản phẩm đang được đóng gói',
    icon:      <Package size={18} />,
    tsField:   'preparedAt',
  },
  {
    key:       'delivering',
    label:     'Đang giao',
    sublabel:  'Shipper đang trên đường giao hàng',
    icon:      <Truck size={18} />,
    tsField:   'shippedAt',
  },
  {
    key:       'delivered',
    label:     'Đã giao',
    sublabel:  'Bạn đã nhận được hàng',
    icon:      <CheckCircle size={18} />,
    tsField:   'deliveredAt',
  },
];

/**
 * Map orderStatus (7 values) → customer step index (0–4).
 * READY_FOR_DELIVERY is treated as step 2 (Đang chuẩn bị) — internal only.
 */
const statusToStepIndex = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 0;
    case 'CONFIRMED':            return 1;
    case 'PREPARING':            return 2;
    case 'READY_FOR_DELIVERY':   return 2; // internal — still show "Đang chuẩn bị"
    case 'DELIVERING':           return 3;
    case 'DELIVERED':            return 4;
    default:                     return 0;
  }
};

const PAYMENT_STATUS_LABEL = {
  PENDING:  'Chưa thanh toán',
  PAID:     'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
  FAILED:   'Thanh toán lỗi',
};

const PAYMENT_STATUS_COLOR = {
  PENDING:  'bg-amber-100 text-amber-700',
  PAID:     'bg-emerald-100 text-emerald-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
  FAILED:   'bg-red-100 text-red-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

const OrderTrackingPage = () => {
  const { id }    = useParams();
  const { user }  = useAuth();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/orders/${id}`);
        setOrder(data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // Real-time: listen for order status updates
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('join_user_room', user.id);

    const handlePaymentSuccess = (payload) => {
      if (order && payload.orderCode === order.orderCode) {
        setOrder((prev) => ({
          ...prev,
          paymentStatus: 'PAID',
          paidAt: new Date().toISOString(),
        }));
      }
    };

    const handleStatusUpdate = (payload) => {
      if (order && (payload.orderId === order.id || payload.orderCode === order.orderCode)) {
        setOrder((prev) => ({
          ...prev,
          orderStatus: payload.orderStatus,
          ...(payload.orderStatus === 'DELIVERED' ? { deliveredAt: new Date().toISOString() } : {}),
          ...(payload.orderStatus === 'DELIVERING' ? { shippedAt:   new Date().toISOString() } : {}),
          ...(payload.orderStatus === 'CANCELLED'  ? { cancelledAt: new Date().toISOString() } : {}),
        }));
      }
    };

    socket.on('payment_success',      handlePaymentSuccess);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('payment_success',      handlePaymentSuccess);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [user, order]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy đơn hàng</h2>
        <Link to="/" className="text-red-600 hover:underline">Về trang chủ</Link>
      </div>
    );
  }

  const isCancelled  = order.orderStatus === 'CANCELLED';
  const currentStep  = isCancelled ? -1 : statusToStepIndex(order.orderStatus);

  const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">Chi Tiết Đơn Hàng</h1>
          <Link to="/my-orders" className="text-sm font-semibold text-red-600 hover:text-red-700">
            ← Trở về danh sách
          </Link>
        </div>

        {/* ── Progress Tracker ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-8">
          {/* Order code + date */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Mã đơn hàng</p>
              <p className="text-lg font-bold text-slate-800">{order.orderCode}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ngày đặt</p>
              <p className="text-sm font-bold text-slate-800">{fmtDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Cancelled banner */}
          {isCancelled ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-3 items-start">
              <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700">Đơn hàng đã bị hủy</p>
                {order.cancelReason && (
                  <p className="text-sm text-red-600 mt-1">{order.cancelReason}</p>
                )}
                {order.cancelledAt && (
                  <p className="text-xs text-red-400 mt-1">{fmtDate(order.cancelledAt)}</p>
                )}
                {order.paymentStatus === 'REFUNDED' && (
                  <p className="text-sm text-blue-600 mt-2 font-semibold">
                    💳 Tiền của bạn đã được ghi nhận hoàn trả
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Horizontal step progress (desktop) */}
              <div className="relative pt-2 hidden sm:block">
                {/* Background track */}
                <div className="absolute top-[22px] left-0 w-full h-1 bg-slate-100 rounded-full z-0" />
                {/* Filled track */}
                <div
                  className="absolute top-[22px] left-0 h-1 bg-green-500 rounded-full z-0 transition-all duration-700"
                  style={{ width: `${(currentStep / (CUSTOMER_STEPS.length - 1)) * 100}%` }}
                />
                {/* Steps */}
                <div className="relative z-10 flex justify-between">
                  {CUSTOMER_STEPS.map((step, idx) => {
                    const isDone   = idx < currentStep;
                    const isActive = idx === currentStep;
                    const ts       = order[step.tsField];
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2 max-w-[100px]">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
                          isDone || isActive
                            ? 'bg-green-500 text-white ring-4 ring-green-100'
                            : 'bg-white text-slate-400 border-2 border-slate-200'
                        }`}>
                          {isDone || isActive ? <CheckCircle size={20} /> : idx + 1}
                        </div>
                        <p className={`text-xs font-bold text-center leading-tight ${
                          isActive ? 'text-slate-800' : isDone ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </p>
                        {ts && (
                          <p className="text-[10px] text-slate-400 text-center leading-tight">
                            {fmtDate(ts)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vertical timeline (mobile) */}
              <div className="sm:hidden space-y-4">
                {CUSTOMER_STEPS.map((step, idx) => {
                  const isDone   = idx < currentStep;
                  const isActive = idx === currentStep;
                  const ts       = order[step.tsField];
                  return (
                    <div key={step.key} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isDone || isActive
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isDone || isActive ? <CheckCircle size={16} /> : step.icon}
                        </div>
                        {idx < CUSTOMER_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-green-400' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className={`text-sm font-bold ${isActive ? 'text-slate-900' : isDone ? 'text-green-700' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        {ts ? (
                          <p className="text-xs text-slate-400">{fmtDate(ts)}</p>
                        ) : (
                          <p className="text-xs text-slate-300">{step.sublabel}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Products */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">
              Sản Phẩm
            </h3>
            <div className="space-y-4">
              {order.orderItems.map((item) => {
                const img = getImageUrl(item.product.thumbnail, fallbackImg);
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                      <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{item.product.name}</h4>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-slate-500">×{item.quantity}</span>
                        <span className="font-bold text-slate-800">{fmt(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center">
              <span className="font-bold text-slate-800">Tổng cộng</span>
              <span className="text-xl font-extrabold text-red-600">{fmt(order.totalAmount)}</span>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Shipping Info */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">
                Thông Tin Giao Hàng
              </h3>
              <div className="space-y-3 text-sm">
                <InfoRow icon={<span>👤</span>} label="Họ tên"    value={order.user.fullName} />
                <InfoRow icon={<Phone size={14} className="text-slate-400" />} label="SĐT" value={order.customerPhone} />
                <InfoRow icon={<MapPin size={14} className="text-slate-400" />} label="Địa chỉ" value={order.shippingAddress} />
                {order.note && <InfoRow icon={<span>💬</span>} label="Ghi chú" value={order.note} />}
              </div>

              {/* Shipper info if delivering */}
              {order.assignedShipper && ['DELIVERING', 'DELIVERED'].includes(order.orderStatus) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Shipper</p>
                  <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700 text-sm shrink-0">
                      {order.assignedShipper.fullName?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{order.assignedShipper.fullName}</p>
                      {order.assignedShipper.phone && (
                        <a href={`tel:${order.assignedShipper.phone}`} className="text-xs text-blue-600 hover:underline">
                          {order.assignedShipper.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">
                Thanh Toán
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Phương thức</span>
                  <span className="text-sm font-bold text-slate-800">
                    {order.paymentMethod === 'CASH' ? '💵 Tiền mặt (COD)' : '🏦 Chuyển khoản'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Trạng thái</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${PAYMENT_STATUS_COLOR[order.paymentStatus]}`}>
                    {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                  </span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Thanh toán lúc</span>
                    <span className="text-sm font-bold text-slate-800">{fmtDate(order.paidAt)}</span>
                  </div>
                )}
              </div>

              {/* Re-open QR if pending bank transfer */}
              {order.paymentStatus === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Link
                    to={`/order-success/${order.id}`}
                    className="block w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center text-sm transition shadow-md"
                  >
                    Mở lại mã QR thanh toán
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex gap-2 items-start">
    <span className="shrink-0 mt-0.5 text-slate-400">{icon}</span>
    <div className="flex-1 min-w-0">
      <span className="text-slate-500 text-xs">{label}: </span>
      <span className="font-semibold text-slate-800 text-sm">{value}</span>
    </div>
  </div>
);

export default OrderTrackingPage;
