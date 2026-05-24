import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../services/axios';
import { getSocket } from '../services/socketService';
import { useAuth } from '../context/AuthContext';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
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

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    
    socket.emit('join_user_room', user.id);

    const handlePaymentSuccess = (payload) => {
      if (order && payload.orderCode === order.orderCode) {
        setOrder((prev) => ({ 
          ...prev, 
          paymentStatus: 'PAID', 
          orderStatus: 'PROCESSING',
          paidAt: new Date().toISOString() 
        }));
      }
    };

    socket.on('payment_success', handlePaymentSuccess);

    return () => {
      socket.off('payment_success', handlePaymentSuccess);
    };
  }, [user, order]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy đơn hàng</h2>
        <Link to="/" className="mt-4 text-red-600 hover:underline">Về trang chủ</Link>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ thanh toán';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPING': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chưa thanh toán';
      case 'PAID': return 'Đã thanh toán';
      case 'FAILED': return 'Thanh toán lỗi';
      default: return status;
    }
  };

  const orderSteps = ['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED'];
  const currentStepIndex = orderSteps.indexOf(order.orderStatus);

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">Chi Tiết Đơn Hàng</h1>
          <Link to="/my-orders" className="text-sm font-semibold text-red-600 hover:text-red-700">← Trở về danh sách</Link>
        </div>

        {/* Status Tracker */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Mã đơn hàng</p>
              <p className="text-lg font-bold text-slate-800">{order.orderCode}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ngày đặt hàng</p>
              <p className="text-sm font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          {order.orderStatus === 'CANCELLED' ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold">
              Đơn hàng này đã bị hủy.
            </div>
          ) : (
            <div className="relative pt-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>
              
              <div 
                className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (orderSteps.length - 1)) * 100}%` }}
              ></div>

              <div className="relative z-10 flex justify-between">
                {orderSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isActive = idx === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-500 text-white ring-4 ring-green-100' 
                          : 'bg-white text-slate-400 border-2 border-slate-200'
                      }`}>
                        {isCompleted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={`text-xs md:text-sm font-semibold ${isActive ? 'text-slate-800' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                        {getOrderStatusText(step)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Products List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">Sản Phẩm</h3>
            <div className="space-y-4">
              {order.orderItems.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                    <img src={item.product.thumbnail || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{item.product.name}</h4>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-slate-500">Số lượng: {item.quantity}</span>
                      <span className="font-bold text-slate-800">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center">
              <span className="font-bold text-slate-800">Tổng cộng</span>
              <span className="text-xl font-extrabold text-red-600">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">Thông Tin Giao Hàng</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-slate-500 w-24 inline-block">Họ tên:</span> <span className="font-bold text-slate-800">{order.user.fullName}</span></p>
                <p><span className="text-slate-500 w-24 inline-block">Điện thoại:</span> <span className="font-bold text-slate-800">{order.customerPhone}</span></p>
                <p><span className="text-slate-500 w-24 inline-block">Email:</span> <span className="font-bold text-slate-800">{order.customerEmail}</span></p>
                <p className="flex items-start">
                  <span className="text-slate-500 w-24 inline-block shrink-0">Địa chỉ:</span> 
                  <span className="font-bold text-slate-800">{order.shippingAddress}</span>
                </p>
                {order.note && (
                  <p className="flex items-start">
                    <span className="text-slate-500 w-24 inline-block shrink-0">Ghi chú:</span> 
                    <span className="font-bold text-slate-800">{order.note}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">Thanh Toán</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Phương thức</span>
                  <span className="text-sm font-bold text-slate-800">{order.paymentMethod === 'CASH' ? 'Tiền mặt (COD)' : 'Chuyển khoản (QR)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Trạng thái</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </div>
                {order.paymentStatus === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link to={`/order-success/${order.id}`} className="block w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-center text-sm transition-all shadow-md">
                      Mở lại mã QR thanh toán
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
