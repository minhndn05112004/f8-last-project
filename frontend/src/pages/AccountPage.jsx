import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/axios';

// ─── Pencil Icon ─────────────────────────────────────────────────────────────
const PencilIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ─── Camera Icon ─────────────────────────────────────────────────────────────
const CameraIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ─── EditableField ────────────────────────────────────────────────────────────
const EditableField = ({ label, fieldKey, value, editing, onToggle, onChange, placeholder, type = 'text' }) => {
  return (
    <div className="account-field">
      <p className="account-field__label">{label}</p>
      <div className="account-field__row">
        {editing ? (
          <input
            id={`field-${fieldKey}`}
            type={type}
            className="account-field__input"
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <p className="account-field__value">
            {value || <span className="account-field__empty">{placeholder || 'Chưa cập nhật'}</span>}
          </p>
        )}
        <button
          type="button"
          id={`edit-btn-${fieldKey}`}
          className={`account-field__edit-btn ${editing ? 'active' : ''}`}
          onClick={() => onToggle(fieldKey)}
          title={editing ? 'Huỷ chỉnh sửa' : 'Chỉnh sửa'}
          aria-label={editing ? `Huỷ chỉnh sửa ${label}` : `Chỉnh sửa ${label}`}
        >
          <PencilIcon />
        </button>
      </div>
    </div>
  );
};

// ─── AccountPage ─────────────────────────────────────────────────────────────
const AccountPage = () => {
  const { user, loading, updateUser } = useAuth();

  // ── Edit state for each field
  const [editingFields, setEditingFields] = useState({
    fullName: false,
    phone: false,
    address: false,
  });

  // ── Pending values (only set when user clicks pencil)
  const [pendingValues, setPendingValues] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  // ── Avatar state
  const [avatarFile, setAvatarFile] = useState(null);       // File object
  const [avatarPreview, setAvatarPreview] = useState(null); // object URL for preview
  const avatarInputRef = useRef(null);

  // ── Saving state
  const [saving, setSaving] = useState(false);

  // ── Toggle a field into / out of edit mode
  const handleToggleEdit = useCallback((field) => {
    setEditingFields((prev) => {
      const nowEditing = !prev[field];
      // When entering edit mode, copy current user value into pendingValues
      if (nowEditing) {
        setPendingValues((pv) => ({ ...pv, [field]: user[field] || '' }));
      }
      return { ...prev, [field]: nowEditing };
    });
  }, [user]);

  // ── Handle pending value change
  const handleChange = useCallback((field, value) => {
    setPendingValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Avatar click → open file picker
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  // ── Avatar file selected → preview
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Save all changes
  const handleSave = async () => {
    const hasAnyFieldEditing = Object.values(editingFields).some(Boolean);
    const hasAvatar = !!avatarFile;

    if (!hasAnyFieldEditing && !hasAvatar) {
      toast('Không có thay đổi nào để lưu.', { icon: 'ℹ️' });
      return;
    }

    setSaving(true);
    try {
      // Build multipart form so avatar upload works via the existing endpoint
      const formData = new FormData();

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Only send fields that are currently being edited
      if (editingFields.fullName) {
        formData.append('fullName', pendingValues.fullName);
      }
      if (editingFields.phone) {
        formData.append('phone', pendingValues.phone);
      }
      if (editingFields.address) {
        formData.append('address', pendingValues.address);
      }

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = res.data?.data;
      if (updatedUser) {
        updateUser(updatedUser);
      }

      // Reset edit state
      setEditingFields({ fullName: false, phone: false, address: false });
      setPendingValues({ fullName: '', phone: '', address: '' });
      setAvatarFile(null);
      setAvatarPreview(null);

      toast.success('Cập nhật thông tin thành công! 🎉');
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.';
      toast.error(msg);
      // Keep fields in edit mode so the user can retry
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="account-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Displayed avatar: preview wins, then user.avatar, then initials
  const avatarSrc = avatarPreview || user.avatar;
  const displayName = (editingFields.fullName ? pendingValues.fullName : user.fullName) || user.fullName;

  const anyEditing = Object.values(editingFields).some(Boolean) || !!avatarFile;

  return (
    <>
      {/* ── Scoped styles ───────────────────────────────────────────────── */}
      <style>{`
        /* ── Spinner ─────────────────────────────────── */
        .account-spinner {
          width: 36px; height: 36px;
          border: 4px solid #fee2e2;
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: account-spin 0.7s linear infinite;
        }
        @keyframes account-spin { to { transform: rotate(360deg); } }

        /* ── Avatar ─────────────────────────────────── */
        .account-avatar-wrap {
          position: relative;
          width: 96px; height: 96px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .account-avatar-circle {
          width: 96px; height: 96px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          border: 4px solid rgba(255,255,255,0.35);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          transition: filter 0.2s;
        }
        .account-avatar-wrap:hover .account-avatar-circle {
          filter: brightness(0.85);
        }
        .account-avatar-circle img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .account-avatar-circle span {
          font-size: 2.2rem; font-weight: 700; color: #fff;
        }
        .account-avatar-overlay {
          position: absolute; bottom: 0; right: 0;
          width: 30px; height: 30px;
          background: #dc2626;
          border-radius: 50%;
          border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          transition: background 0.2s, transform 0.2s;
        }
        .account-avatar-wrap:hover .account-avatar-overlay {
          background: #b91c1c;
          transform: scale(1.1);
        }
        .account-avatar-badge {
          position: absolute; top: -6px; right: -6px;
          background: #16a34a;
          color: #fff; font-size: 10px; font-weight: 700;
          padding: 2px 6px; border-radius: 20px;
          border: 2px solid #fff;
          white-space: nowrap;
          animation: badge-pop 0.3s ease;
        }
        @keyframes badge-pop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        /* ── Field ──────────────────────────────────── */
        .account-field { margin-bottom: 1.25rem; }
        .account-field__label {
          font-size: 0.75rem; font-weight: 600;
          color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
          margin: 0 0 0.35rem 0;
        }
        .account-field__row {
          display: flex; align-items: center; gap: 0.5rem;
          min-height: 40px;
        }
        .account-field__value {
          flex: 1; font-weight: 500; color: #0f172a;
          margin: 0; font-size: 1rem;
          line-height: 1.5;
        }
        .account-field__empty { color: #94a3b8; font-style: italic; font-weight: 400; }
        .account-field__input {
          flex: 1;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.45rem 0.75rem;
          font-size: 1rem;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .account-field__input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.12);
          background: #fff;
        }
        .account-field__edit-btn {
          flex-shrink: 0;
          width: 34px; height: 34px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #94a3b8;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s;
        }
        .account-field__edit-btn:hover {
          border-color: #dc2626;
          color: #dc2626;
          background: #fff1f2;
          transform: scale(1.08);
        }
        .account-field__edit-btn.active {
          border-color: #dc2626;
          color: #dc2626;
          background: #fff1f2;
        }

        /* ── Email readonly field ───────────────────── */
        .account-field--readonly .account-field__value {
          color: #475569;
        }
        .account-field__lock-icon {
          flex-shrink: 0;
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          color: #cbd5e1;
        }

        /* ── Section heading ────────────────────────── */
        .account-section-title {
          font-size: 0.7rem; font-weight: 700;
          color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em;
          margin: 0 0 1.25rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        /* ── Save button ────────────────────────────── */
        .account-save-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1.6rem;
          border-radius: 10px;
          border: none; cursor: pointer;
          font-size: 0.95rem; font-weight: 700;
          font-family: inherit;
          background: #dc2626;
          color: #fff;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(220,38,38,0.25);
        }
        .account-save-btn:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(220,38,38,0.3);
        }
        .account-save-btn:disabled {
          opacity: 0.65; cursor: not-allowed;
        }
        .account-save-btn .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: account-spin 0.6s linear infinite;
        }

        /* ── Pending badge ───────────────────────────── */
        .account-pending-hint {
          font-size: 0.8rem;
          color: #f59e0b;
          font-weight: 500;
          display: flex; align-items: center; gap: 0.35rem;
        }
        .account-pending-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #f59e0b;
          animation: pulse-dot 1.4s ease infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Tài khoản của tôi</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

              {/* ── Header / Avatar ─────────────────────────────────────────── */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-10 text-white flex items-center gap-6">

                {/* Avatar with upload */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  id="avatar-upload-input"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <div
                  className="account-avatar-wrap"
                  onClick={handleAvatarClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleAvatarClick()}
                  title="Nhấn để thay đổi ảnh đại diện"
                  aria-label="Thay đổi ảnh đại diện"
                >
                  <div className="account-avatar-circle">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={user.fullName} />
                    ) : (
                      <span>{user.fullName?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="account-avatar-overlay">
                    <CameraIcon />
                  </div>
                  {avatarFile && (
                    <div className="account-avatar-badge">Mới</div>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  <p className="text-red-100 mt-1 capitalize">{user.role?.toLowerCase()}</p>
                  {avatarFile && (
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.3rem' }}>
                      📷 Ảnh mới sẽ được lưu khi bạn nhấn "Cập nhật thông tin"
                    </p>
                  )}
                </div>
              </div>

              {/* ── Details ─────────────────────────────────────────────────── */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">

                  {/* ── Left column: Contact info ── */}
                  <div>
                    <p className="account-section-title">Thông tin liên hệ</p>

                    {/* Email – read-only */}
                    <div className={`account-field account-field--readonly`}>
                      <p className="account-field__label">Email</p>
                      <div className="account-field__row">
                        <p className="account-field__value">{user.email}</p>
                        <div className="account-field__lock-icon" title="Email không thể thay đổi" aria-label="Email không thể thay đổi">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Họ và tên */}
                    <EditableField
                      label="Họ và tên"
                      fieldKey="fullName"
                      value={editingFields.fullName ? pendingValues.fullName : (user.fullName || '')}
                      editing={editingFields.fullName}
                      onToggle={handleToggleEdit}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                    />

                    {/* Số điện thoại */}
                    <EditableField
                      label="Số điện thoại"
                      fieldKey="phone"
                      value={editingFields.phone ? pendingValues.phone : (user.phone || '')}
                      editing={editingFields.phone}
                      onToggle={handleToggleEdit}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                      type="tel"
                    />
                  </div>

                  {/* ── Right column: Shipping address ── */}
                  <div>
                    <p className="account-section-title">Địa chỉ giao hàng</p>

                    <EditableField
                      label="Địa chỉ mặc định"
                      fieldKey="address"
                      value={editingFields.address ? pendingValues.address : (user.address || '')}
                      editing={editingFields.address}
                      onToggle={handleToggleEdit}
                      onChange={handleChange}
                      placeholder="Nhập địa chỉ giao hàng"
                    />
                  </div>

                </div>

                {/* ── Footer actions ────────────────────────────────────── */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">

                  {/* Pending hint */}
                  <div>
                    {anyEditing ? (
                      <span className="account-pending-hint">
                        <span className="account-pending-dot" />
                        Có thay đổi chưa được lưu
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        Nhấn ✏️ để chỉnh sửa từng trường
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to="/my-orders"
                      className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold hover:bg-red-100 transition-colors"
                      style={{ textDecoration: 'none', fontSize: '0.95rem' }}
                    >
                      Lịch sử đơn hàng
                    </Link>

                    <button
                      id="account-save-btn"
                      type="button"
                      className="account-save-btn"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="btn-spinner" />
                          Đang lưu…
                        </>
                      ) : (
                        'Cập nhật thông tin'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AccountPage;
