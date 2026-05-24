import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../services/axios';
import { getSocket } from '../services/socketService';
import { useAuth } from '../context/AuthContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

// ─── Helper ───────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentPage = () => {
  const { orderCode } = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();

  const [paymentData,    setPaymentData]    = useState(null);  // from /api/payment/qr/:orderCode
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied,         setCopied]         = useState(false);

  // ─── Fetch QR & payment info ───────────────────────────────────────────────

  const fetchPaymentData = useCallback(async () => {
    try {
      // Check payment status first
      const statusRes = await axios.get(`/orders/${orderCode}/payment-status`);
      if (statusRes.data.paymentStatus === 'PAID') {
        navigate(`/order-success/${orderCode}`, { replace: true });
        return;
      }

      const { data } = await axios.get(`/payment/qr/${orderCode}`);

      if (!data.success) {
        setError('Không thể tải thông tin thanh toán');
        return;
      }

      const pd = data.data;

      // Nếu đã thanh toán → redirect thẳng sang success
      if (pd.alreadyPaid || pd.paymentStatus === 'PAID') {
        navigate(`/order-success/${orderCode}`, { replace: true });
        return;
      }

      setPaymentData(pd);
    } catch (err) {
      console.error('[PaymentPage] Lỗi fetch:', err);
      if (err.response?.status === 404) {
        setError('Không tìm thấy đơn hàng');
      } else if (err.response?.status === 403) {
        setError('Bạn không có quyền truy cập đơn hàng này');
      } else {
        setError('Lỗi kết nối — vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  }, [orderCode, navigate]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // ─── Socket realtime ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !paymentData) return;

    const socket = getSocket();

    // Join phòng của user để nhận event thanh toán
    socket.emit('join_user_room', user.id);

    const handlePaymentSuccess = (payload) => {
      console.log('[PaymentPage] payment_success received:', payload);

      if (payload.orderCode === orderCode) {
        setPaymentSuccess(true);

        // Delay 2.5s để user thấy UI success rồi mới redirect
        setTimeout(() => {
          navigate(`/order-success/${orderCode}`, { replace: true });
        }, 2500);
      }
    };

    socket.on('payment_success', handlePaymentSuccess);

    return () => {
      socket.off('payment_success', handlePaymentSuccess);
    };
  }, [user, paymentData, orderCode, navigate]);

  // ─── Copy transfer content ─────────────────────────────────────────────────

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ─── Polling fallback (kiểm tra mỗi 3s nếu socket không hoạt động) ────────

  useEffect(() => {
    if (!paymentData || paymentSuccess) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`/orders/${orderCode}/payment-status`);
        if (data.paymentStatus === 'PAID') {
          setPaymentSuccess(true);
          setTimeout(() => navigate(`/order-success/${orderCode}`, { replace: true }), 2500);
          clearInterval(interval);
        }
      } catch (_) { /* ignore polling errors */ }
    }, 3000); // every 3 seconds

    return () => clearInterval(interval);
  }, [paymentData, paymentSuccess, orderCode, navigate]);

  // ─── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto" />
          <p className="text-slate-500 font-medium">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{error}</h2>
        <Link to="/my-orders" className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
          Xem đơn hàng của tôi
        </Link>
      </div>
    );
  }

  // ─── Payment success overlay ───────────────────────────────────────────────

  if (paymentSuccess) {
    return (
      <div className="bg-slate-50 min-h-[80vh] flex items-center justify-center py-16">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-12 text-center max-w-md mx-auto">
          <div className="w-28 h-28 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckIcon />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Thanh Toán Thành Công!</h2>
          <p className="text-slate-500 mb-2">Hệ thống đã xác nhận giao dịch của bạn.</p>
          <p className="text-sm text-slate-400">Đang chuyển đến trang hoàn tất đơn hàng...</p>
          <div className="mt-6 flex gap-2 justify-center">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main payment page ─────────────────────────────────────────────────────

  return (
    <div className="bg-slate-50 min-h-[80vh] py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-xs font-bold bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full uppercase tracking-wide mb-4">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Đang chờ thanh toán
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">
            Quét Mã QR Để Thanh Toán
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Mở app ngân hàng và quét mã QR. Hệ thống sẽ tự động xác nhận thanh toán của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: QR Code */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-4">
              Mã QR Thanh Toán
            </p>

            {/* QR Image */}
            <div className="relative bg-white p-3 rounded-2xl shadow-md border border-slate-200 w-64 h-64 flex-shrink-0">
              <img
                src={paymentData.qrUrl}
                alt={`QR thanh toán ${orderCode}`}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData.transferContent)}`;
                }}
              />
              {/* Scan animation */}
              <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/20 overflow-hidden pointer-events-none">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)] absolute top-0 animate-[scan_2.5s_ease-in-out_infinite]" />
              </div>
            </div>

            {/* SePay badge */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Bảo mật bởi SePay
            </div>

            {/* Realtime listener indicator */}
            <div className="mt-5 w-full flex items-center justify-center gap-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 py-3 px-4 rounded-2xl font-medium">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              Đang lắng nghe xác nhận thanh toán...
            </div>
          </div>

          {/* Right: Bank Info */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-5">
                Thông tin chuyển khoản thủ công
              </p>

              <div className="space-y-4">

                {/* Bank */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Ngân hàng</span>
                  <span className="font-bold text-slate-800">
                    {paymentData.bankCode === 'VCB' ? 'Vietcombank (VCB)' : paymentData.bankCode === 'MB' ? 'MB Bank (MB)' : paymentData.bankCode}
                  </span>
                </div>

                {/* Account name */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Chủ tài khoản</span>
                  <span className="font-bold text-slate-800">{paymentData.accountName}</span>
                </div>

                {/* Account number */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-red-600 text-lg tracking-wider">
                      {paymentData.accountNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(paymentData.accountNumber)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sao chép"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Số tiền</span>
                  <span className="font-black text-slate-800 text-xl">
                    {formatPrice(paymentData.amount)}
                  </span>
                </div>

                {/* Transfer content */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    Nội dung chuyển khoản
                    <span className="text-red-500 font-bold text-xs ml-1">(Bắt buộc)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-sm flex-1 break-all">
                      {paymentData.transferContent}
                    </span>
                    <button
                      onClick={() => handleCopy(paymentData.transferContent)}
                      className="flex-shrink-0 p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                      title="Sao chép nội dung"
                    >
                      {copied
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        : <CopyIcon />
                      }
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 font-medium animate-pulse">✓ Đã sao chép!</p>
                  )}
                </div>

              </div>
            </div>

            {/* Warning */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs text-amber-800 font-semibold mb-1">⚠️ Lưu ý quan trọng</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Nhập <strong>đúng nội dung chuyển khoản</strong> để hệ thống tự nhận diện</li>
                <li>Chuyển <strong>đúng số tiền</strong> như hiển thị</li>
                <li>Đơn hàng sẽ được xác nhận <strong>tự động trong vài giây</strong></li>
              </ul>
            </div>

            {/* Save for later */}
            <div className="mt-4 flex justify-center">
              <Link
                to="/my-orders"
                className="text-sm font-semibold text-slate-400 hover:text-slate-700 underline underline-offset-4 transition-colors"
              >
                Thanh toán sau — lưu đơn hàng
              </Link>
            </div>
          </div>

        </div>

        {/* Order code footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Mã đơn hàng:{' '}
            <span className="font-mono font-bold text-slate-600">{orderCode}</span>
          </p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%   { top: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default PaymentPage;
