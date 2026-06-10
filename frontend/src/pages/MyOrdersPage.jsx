import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../services/axios';
import { useAuth } from '../context/AuthContext';

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('/orders/my-orders');
        setOrders(data.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Chờ xác nhận</span>;
      case 'CONFIRMED': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Đã xác nhận</span>;
      case 'PREPARING': return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Đang chuẩn bị</span>;
      case 'READY_FOR_DELIVERY': return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Chờ giao hàng</span>;
      case 'DELIVERING': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Đang giao hàng</span>;
      case 'DELIVERED': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Đã giao hàng</span>;
      case 'CANCELLED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Đã hủy</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Chưa thanh toán</span>;
      case 'PAID': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Đã thanh toán</span>;
      case 'REFUNDED': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Đã hoàn tiền</span>;
      case 'FAILED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Thanh toán lỗi</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8">Đơn Hàng Của Tôi</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-300 mx-auto mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Chưa có đơn hàng nào</h2>
            <Link to="/products" className="inline-block mt-4 bg-red-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-red-700 transition-colors">
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-slate-50 border-b border-slate-100 p-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs text-slate-500 block">Mã đơn hàng</span>
                      <span className="font-bold text-slate-800">{order.orderCode}</span>
                    </div>
                    <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                    <div>
                      <span className="text-xs text-slate-500 block">Ngày đặt</span>
                      <span className="font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getOrderStatusBadge(order.orderStatus)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
                
                <div className="p-4 md:px-6">
                  {order.orderItems.slice(0, 2).map((item, idx) => {
                    const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
                    const rawImage = item.product.thumbnail || fallbackImg;
                    const itemImage = rawImage.startsWith('http') ? rawImage : `http://localhost:5000${rawImage}`;
                    return (
                      <div key={item.id} className={`flex gap-4 py-3 ${idx > 0 ? 'border-t border-slate-50' : ''}`}>
                        <img src={itemImage} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{item.product.name}</h4>
                          <div className="text-sm text-slate-500 mt-1">x{item.quantity}</div>
                        </div>
                        <div className="font-bold text-slate-800 text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                  {order.orderItems.length > 2 && (
                    <div className="text-center py-2 text-sm text-slate-500 font-medium">
                      + {order.orderItems.length - 2} sản phẩm khác
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-4 md:px-6 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-500 block">Tổng tiền:</span>
                    <span className="text-lg font-extrabold text-red-600">{formatPrice(order.totalAmount)}</span>
                  </div>
                  <Link to={`/orders/${order.id}`} className="bg-white border-2 border-slate-200 text-slate-700 hover:border-red-500 hover:text-red-600 font-bold py-2 px-6 rounded-xl transition-colors text-sm">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
