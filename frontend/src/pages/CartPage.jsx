import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    cartTotal,
    loading,
    updateItem,
    removeItem,
    clearCart,
    fetchCart,
  } = useCart();

  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để xem giỏ hàng');
      navigate('/login');
    } else {
      fetchCart();
    }
  }, [user, navigate, fetchCart]);

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Quantity handlers
  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    if (newQty > item.product.stock) {
      toast.error(`Chỉ còn tối đa ${item.product.stock} sản phẩm trong kho`);
      return;
    }
    await updateItem(item.id, newQty);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-slate-500 text-sm font-medium">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-6 pb-16">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Giỏ hàng</span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1 flex items-center gap-3">
            Giỏ Hàng Của Bạn
            {cartItems.length > 0 && (
              <span className="text-sm font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-150">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm
              </span>
            )}
          </h1>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-xl mx-auto my-8">
            <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Giỏ hàng trống</h3>
            <p className="text-slate-500 mb-8 text-sm max-w-sm mx-auto leading-relaxed">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy quay lại cửa hàng để chọn mua những miếng thịt tươi ngon nhất nhé!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-755 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md shadow-red-600/10 hover:scale-[1.02] active:scale-[0.98] no-underline"
            >
              Tiếp tục mua sắm
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ) : (
          /* Cart Table & Summary */
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Items List */}
            <div className="w-full lg:w-2/3 flex flex-col gap-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
                <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-6">Sản phẩm</div>
                  <div className="col-span-2 text-center">Giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-right">Tổng cộng</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => {
                    const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
                    const rawImage = item.product.thumbnail || fallbackImg;
                    const itemImage = rawImage.startsWith('http') ? rawImage : `http://localhost:5000${rawImage}`;
                    const price = item.product.salePrice || item.product.price;
                    const itemSubtotal = price * item.quantity;

                    return (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6 items-center">
                        
                        {/* Product info details */}
                        <div className="col-span-1 md:col-span-6 flex gap-4 items-center">
                          {/* Image */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                            <img src={itemImage} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                          {/* Details */}
                          <div>
                            <Link
                              to={`/products/${item.product.slug}`}
                              className="font-bold text-slate-800 hover:text-red-600 transition-colors text-sm line-clamp-1 no-underline"
                            >
                              {item.product.name}
                            </Link>
                            {item.product.sku && (
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {item.product.sku}</p>
                            )}
                            {/* Mobile only layout inside info */}
                            <div className="flex items-center gap-2 mt-2 md:hidden">
                              <span className="text-xs font-bold text-slate-800">{formatPrice(price)}</span>
                              <span className="text-slate-300 text-xs">|</span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-[11px] font-semibold text-red-500 hover:text-red-700"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="hidden md:block col-span-2 text-center">
                          <span className="text-sm font-semibold text-slate-700">{formatPrice(price)}</span>
                          {item.product.salePrice && item.product.salePrice < item.product.price && (
                            <span className="block text-[11px] text-slate-400 line-through mt-0.5">
                              {formatPrice(item.product.price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                          <div className="flex items-center justify-between border border-slate-200 rounded-lg bg-slate-50 p-0.5 w-28 md:w-24">
                            <button
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors font-bold text-xs"
                              disabled={item.quantity <= 1}
                            >
                              ─
                            </button>
                            <span className="text-xs font-bold text-slate-800">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors font-bold text-xs"
                              disabled={item.quantity >= item.product.stock}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-4">
                          <div className="text-right flex-1 md:flex-none">
                            <span className="text-sm font-bold text-red-600 md:text-slate-800 block">
                              {formatPrice(itemSubtotal)}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.id)}
                            className="hidden md:flex p-1.5 rounded-lg border border-slate-100 hover:border-red-150 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors items-center justify-center"
                            title="Xóa khỏi giỏ hàng"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Clear Cart Button */}
                <div className="pt-6 border-t border-slate-100 flex justify-between items-center mt-4">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 uppercase tracking-wider transition-colors no-underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12l7.5-7.5M3 12h18" />
                    </svg>
                    Quay lại mua sắm
                  </Link>

                  <button
                    onClick={clearCart}
                    className="px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-150 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Xóa toàn bộ giỏ hàng
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Summary Card */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 sticky top-28">
                <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6">
                  Tóm tắt đơn hàng
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Tạm tính ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)</span>
                    <span className="text-sm font-semibold text-slate-800">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Phí giao hàng</span>
                    <span className="text-sm font-semibold text-emerald-600">Miễn phí</span>
                  </div>
                  <div className="border-t border-slate-100 my-4 pt-4 flex justify-between items-center">
                    <span className="text-base font-bold text-slate-800">Tổng cộng</span>
                    <span className="text-xl font-extrabold text-red-600">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-red-600 hover:bg-red-755 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md shadow-red-600/10 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider mb-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  Tiến hành thanh toán
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed font-light">
                  Phí vận chuyển và thuế sẽ được tính khi thanh toán (miễn phí vận chuyển toàn quốc cho tất cả đơn hàng từ nay đến hết tháng).
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CartPage;
