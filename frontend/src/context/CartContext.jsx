import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

export const CartProvider = ({ children, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      const { items, total, itemCount } = res.data.data;
      setCartItems(items || []);
      setCartTotal(total || 0);
      setCartCount(itemCount || 0);
    } catch (err) {
      // Silently fail – user may not be logged in
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cart on user login
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Clear cart state on logout
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
    }
  }, [user, fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1, navigate) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      if (navigate) navigate('/login');
      return false;
    }
    try {
      await api.post('/cart/add', { productId, quantity });
      await fetchCart();
      toast.success('Đã thêm vào giỏ hàng! 🛒');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thêm vào giỏ hàng';
      toast.error(msg);
      return false;
    }
  }, [user, fetchCart]);

  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      await api.put(`/cart/item/${itemId}`, { quantity });
      await fetchCart();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể cập nhật';
      toast.error(msg);
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await api.delete(`/cart/item/${itemId}`);
      await fetchCart();
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err) {
      toast.error('Không thể xóa sản phẩm');
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await api.delete('/cart/clear');
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
      toast.success('Đã xóa toàn bộ giỏ hàng');
    } catch (err) {
      toast.error('Không thể xóa giỏ hàng');
    }
  }, []);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartTotal,
      cartCount,
      loading,
      fetchCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
