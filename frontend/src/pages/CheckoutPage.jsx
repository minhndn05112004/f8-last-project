import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from '../services/axios';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, loading, fetchCart, clearCart } = useCart();

  const [formData, setFormData] = useState({
    shippingAddress: user?.address || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    note: '',
    paymentMethod: 'CASH',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
    } else {
      fetchCart();
    }
  }, [user, navigate, fetchCart]);

  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
      toast.error('Giỏ hàng trống');
      navigate('/cart');
    }
  }, [cartItems, loading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shippingAddress || !formData.customerPhone || !formData.customerEmail) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data } = await axios.post('/orders', formData);
      
      if (data.success) {
        toast.success('Đặt hàng thành công!');
        await fetchCart();

        if (formData.paymentMethod === 'BANK_TRANSFER') {
          navigate(`/payment/${data.data.orderCode}`);
        } else {
          navigate(`/order-success/${data.data.orderCode}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading || cartItems.length === 0) return null;

  return (
    <div className="bg-slate-50 min-h-screen pt-6 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Thanh toán</span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">Hoàn Tất Đơn Hàng</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Form */}
          <div className="w-full lg:w-2/3">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Shipping Info */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Thông tin giao hàng
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ nhận hàng</label>
                    <input
                      type="text"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleChange}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="09xx xxx xxx"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú đơn hàng (Tùy chọn)</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Ghi chú về thời gian giao hàng, hướng dẫn chỉ đường..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all h-24 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                  Phương thức thanh toán
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'CASH' ? 'border-red-500 bg-red-50/50' : 'border-slate-200 hover:border-red-200'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={formData.paymentMethod === 'CASH'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">Thanh toán tiền mặt</span>
                      {formData.paymentMethod === 'CASH' && (
                        <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">Thanh toán khi nhận hàng (COD)</span>
                  </label>

                  <label className={`relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'BANK_TRANSFER' ? 'border-red-500 bg-red-50/50' : 'border-slate-200 hover:border-red-200'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={formData.paymentMethod === 'BANK_TRANSFER'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">Chuyển khoản ngân hàng</span>
                      {formData.paymentMethod === 'BANK_TRANSFER' && (
                        <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">Quét mã QR tự động xác nhận</span>
                    {formData.paymentMethod === 'BANK_TRANSFER' && (
                      <div className="mt-3 p-3 bg-white/85 rounded-xl border border-red-100/50 text-xs text-slate-700 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ngân hàng:</span>
                          <span className="font-semibold text-slate-800">MB Bank</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Số tài khoản:</span>
                          <span className="font-bold text-red-600 tracking-wider">0366585487</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Chủ tài khoản:</span>
                          <span className="font-semibold text-slate-800">NGÔ ĐÌNH NHẬT MINH</span>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="hidden lg:block">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                </button>
              </div>

            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 sticky top-28">
              <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-6 custom-scrollbar">
                {cartItems.map(item => {
                  const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
                  const rawImage = item.product.thumbnail || fallbackImg;
                  const itemImage = rawImage.startsWith('http') ? rawImage : `http://localhost:5000${rawImage}`;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50">
                        <img src={itemImage} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{item.product.name}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500">x{item.quantity}</span>
                        <span className="text-sm font-semibold text-slate-800">{formatPrice((item.product.salePrice || item.product.price) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Tạm tính</span>
                  <span className="text-sm font-semibold text-slate-800">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Phí giao hàng</span>
                  <span className="text-sm font-semibold text-emerald-600">Miễn phí</span>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-base font-bold text-slate-800">Tổng cộng</span>
                  <span className="text-xl font-extrabold text-red-600">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <div className="lg:hidden">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
