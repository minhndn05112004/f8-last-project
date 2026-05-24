import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../services/axios';
import { useAuth } from '../context/AuthContext';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const statusMap = {
  PENDING:    { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700' },
  PROCESSING: { label: 'Đang xử lý',  color: 'bg-blue-100 text-blue-700' },
  SHIPPING:   { label: 'Đang giao',   color: 'bg-amber-100 text-amber-700' },
  DELIVERED:  { label: 'Đã giao',     color: 'bg-emerald-100 text-emerald-700' },
  COMPLETED:  { label: 'Hoàn thành',  color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:  { label: 'Đã hủy',      color: 'bg-red-100 text-red-600' },
};

const paymentStatusMap = {
  PENDING: { label: 'Chưa Thanh Toán', color: 'bg-amber-100 text-amber-700' },
  PAID:    { label: 'Đã Thanh Toán',   color: 'bg-emerald-100 text-emerald-700' },
  FAILED:  { label: 'Thanh Toán Lỗi',  color: 'bg-red-100 text-red-600' },
};

const OrderSuccessPage = () => {
  const { orderCode } = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const [order,       setOrder]   = useState(null);
  const [loading,     setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // 1. Fetch status check first
        const statusRes = await axios.get(`/orders/${orderCode}/payment-status`);
        
        // 2. Fetch full details
        const { data } = await axios.get(`/orders/code/${orderCode}`);
        const currentOrder = data.data;

        // Bảo vệ: BANK_TRANSFER mà chưa PAID → redirect về payment page
        if (
          currentOrder.paymentMethod === 'BANK_TRANSFER' &&
          statusRes.data.paymentStatus !== 'PAID'
        ) {
          navigate(`/payment/${orderCode}`, { replace: true });
          return;
        }

        setOrder(currentOrder);
      } catch (error) {
        console.error('[OrderSuccessPage] Lỗi fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderCode, navigate]);

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
        <Link to="/" className="text-red-600 hover:underline font-semibold">Về trang chủ</Link>
      </div>
    );
  }

  const isCOD        = order.paymentMethod === 'CASH';
  const orderStatus  = statusMap[order.orderStatus]  || { label: order.orderStatus,  color: 'bg-slate-100 text-slate-600' };
  const payStatus    = paymentStatusMap[order.paymentStatus] || { label: order.paymentStatus, color: 'bg-slate-100 text-slate-600' };

  return (
    <div className="bg-slate-50 min-h-[80vh] py-16">
      <div className="container mx-auto px-4 max-w-2xl">

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center relative overflow-hidden">

          {/* Success Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full bg-green-300/30 animate-ping" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Đặt Hàng Thành Công!</h1>
          <p className="text-slate-500 mb-8 text-base">
            Cảm ơn bạn đã mua sắm tại{' '}
            <span className="font-bold text-red-600">Anthony Shop</span>.{' '}
            Mã đơn hàng:{' '}
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-sm">
              {order.orderCode}
            </span>
          </p>

          {/* Order Details */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 text-left space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-200 pb-3 mb-4">
              Chi tiết đơn hàng
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Khách hàng</span>
              <span className="font-bold text-slate-800">{order.user?.fullName}</span>
            </div>

            <div className="flex justify-between items-start text-sm">
              <span className="text-slate-500">Giao đến</span>
              <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                {order.shippingAddress}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Hình thức thanh toán</span>
              <span className="font-bold text-slate-800">
                {isCOD ? 'Tiền mặt (COD)' : 'Chuyển khoản ngân hàng'}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Trạng thái đơn</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${orderStatus.color}`}>
                {orderStatus.label}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Trạng thái thanh toán</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${payStatus.color}`}>
                {payStatus.label}
              </span>
            </div>

            {/* Tổng tiền */}
            <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
              <span className="font-bold text-slate-800">Tổng cộng</span>
              <span className="text-xl font-extrabold text-red-600">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* COD note */}
          {isCOD && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left">
              <p className="text-sm font-bold text-amber-800 mb-1">📦 Thông tin giao hàng</p>
              <p className="text-xs text-amber-700">
                Đơn hàng của bạn sẽ được chuẩn bị và giao trong vòng{' '}
                <strong>1–3 ngày làm việc</strong>. Bạn sẽ nhận được thông báo khi đơn hàng được vận chuyển.
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={`/orders/${order.id}`}
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-600/20 hover:shadow-red-600/30"
            >
              Theo dõi đơn hàng
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
            >
              Tiếp tục mua sắm
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
