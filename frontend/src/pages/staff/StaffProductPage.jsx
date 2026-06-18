import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, CheckCircle, EyeOff, Upload, X, Save, Search, AlertCircle, Package, Tag, Power } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/axios';
import { getImageUrl } from '../../utils/imageUrl';

const StaffProductPage = () => {
  const [products, setProducts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Tag Management Inline state
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/all', {
        params: {
          limit: 100,
        },
      });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get('/tags');
      if (res.data?.success) {
        setTags(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTags();
  }, []);

  const resetForm = () => {
    setName('');
    setPrice('');
    setSalePrice('');
    setStock('0');
    setSku('');
    setShortDescription('');
    setDescription('');
    setIsPublished(false);
    setSelectedTagIds([]);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setImageFiles([]);
    setImagePreviews([]);
    setEditingId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setName(prod.name || '');
    setPrice(prod.price || '');
    setSalePrice(prod.salePrice || '');
    setStock(prod.stock !== undefined ? String(prod.stock) : '0');
    setSku(prod.sku || '');
    setShortDescription(prod.shortDescription || '');
    setDescription(prod.description || '');
    setIsPublished(prod.isPublished || false);
    setSelectedTagIds(prod.tags ? prod.tags.map((t) => t.id) : []);
    setThumbnailFile(null);
    setThumbnailPreview(getImageUrl(prod.thumbnail));
    setImageFiles([]);
    // Setup existing images previews
    const existingImgs = prod.images || [];
    setImagePreviews(existingImgs.map(img => getImageUrl(img)));
    setEditingId(prod.id);
    setIsModalOpen(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh không được lớn hơn 5MB');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} lớn hơn 5MB`);
        continue;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const handleRemoveImagePreview = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    // If it's a file we just uploaded, remove from imageFiles
    // Note: Since existing images are in previews but not files, we calculate relative index:
    // This is a simple client side UI reset. If we are editing, we just upload files.
    // If they delete an image, they can just overwrite. Let's keep it simple.
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleTag = (tagId) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTagInline = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    try {
      const res = await api.post('/tags', { name: newTagName.trim() });
      if (res.data?.success) {
        toast.success(`Đã tạo tag "${newTagName.trim()}"`);
        setNewTagName('');
        await fetchTags();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể tạo tag mới');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/products/${id}/publish`);
      if (res.data?.success) {
        toast.success(`Đã ${res.data.data.isPublished ? 'công khai' : 'gỡ bỏ'} sản phẩm`);
        setProducts(prev => 
          prev.map(p => p.id === id ? { ...p, isPublished: res.data.data.isPublished } : p)
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái xuất bản');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm!');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Vui lòng nhập đơn giá hợp lệ!');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('price', price);
    if (salePrice) formData.append('salePrice', salePrice);
    formData.append('stock', stock);
    if (sku) formData.append('sku', sku.trim());
    formData.append('shortDescription', shortDescription.trim());
    formData.append('description', description.trim());
    formData.append('isPublished', isPublished ? 'true' : 'false');
    formData.append('tagIds', JSON.stringify(selectedTagIds));
    
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    
    // Add additional images
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Thêm sản phẩm mới thành công!');
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này không?')) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success('Đã xóa sản phẩm thành công');
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const filteredProducts = products.filter(
    (prod) =>
      prod.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.tags?.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatPrice = (p) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-white font-sans p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Package className="text-red-500" size={28} />
            <span>Quản Lý Sản Phẩm</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Quản lý thông tin thịt nhập khẩu, giá cả, số lượng tồn kho và phân loại tags.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-red-800 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 border border-red-750 transition-all shrink-0 align-self-start animate-pulse hover:animate-none"
        >
          <Plus size={16} /> Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 mb-6 flex gap-4 items-center shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên, SKU hoặc tag..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600 transition-all placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main List Table */}
      <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-3" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-500">
            <AlertCircle size={44} className="text-slate-600 mb-3" />
            <p className="text-sm font-bold">Không tìm thấy sản phẩm nào</p>
            <p className="text-xs text-slate-500 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc thêm sản phẩm mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-4 px-6">Ảnh</th>
                  <th className="py-4 px-4">Sản phẩm</th>
                  <th className="py-4 px-4">SKU / Tags</th>
                  <th className="py-4 px-4">Giá bán</th>
                  <th className="py-4 px-4 text-center">Tồn kho</th>
                  <th className="py-4 px-4 text-center">Hiển thị</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((prod) => {
                  const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80';
                  const thumbnailSrc = getImageUrl(prod.thumbnail, fallbackImg);
                  const hasDiscount = prod.salePrice && prod.salePrice < prod.price;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-950/20 transition-colors">
                      {/* Image */}
                      <td className="py-4 px-6 shrink-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                          <img
                            src={thumbnailSrc}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = fallbackImg; }}
                          />
                        </div>
                      </td>

                      {/* Name & Slug */}
                      <td className="py-4 px-4 max-w-[220px]">
                        <div className="font-bold text-slate-200 line-clamp-2 hover:text-red-500 transition-colors cursor-pointer" onClick={() => handleOpenEditModal(prod)}>
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">
                          {prod.slug}
                        </div>
                      </td>

                      {/* SKU / Tags */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                          {prod.sku || 'NO SKU'}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {prod.tags?.map((t) => (
                            <span key={t.id} className="text-[9px] font-semibold bg-slate-800 text-slate-350 border border-slate-700 px-1.5 py-0.2 rounded-full">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        {hasDiscount ? (
                          <>
                            <span className="text-red-500 font-bold block">{formatPrice(prod.salePrice)}</span>
                            <span className="text-slate-500 line-through text-[10px]">{formatPrice(prod.price)}</span>
                          </>
                        ) : (
                          <span className="text-slate-200 font-bold block">{formatPrice(prod.price)}</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          prod.stock > 10 ? 'bg-emerald-950 text-emerald-400' : prod.stock > 0 ? 'bg-amber-950 text-amber-400' : 'bg-red-955/30 text-red-500'
                        }`}>
                          {prod.stock}
                        </span>
                      </td>

                      {/* Publish status toggle button */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleTogglePublish(prod.id, prod.isPublished)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            prod.isPublished 
                              ? 'bg-green-950/60 border-green-800/80 text-green-400' 
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title={prod.isPublished ? 'Gỡ công khai (Đang hiện)' : 'Bật công khai (Đang ẩn)'}
                        >
                          <Power size={14} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {prod.isPublished && (
                            <a
                              href={`/products/${prod.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800"
                              title="Xem trang bán hàng"
                            >
                              <Eye size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 text-red-500 hover:text-red-400 rounded-lg transition-colors border border-slate-800"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 bg-slate-850 hover:bg-red-950 text-slate-500 hover:text-red-500 rounded-lg transition-colors border border-slate-800"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Write/Edit Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="font-extrabold text-base text-slate-100">
                  {editingId ? 'Chỉnh Sửa Thông Tin Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cập nhật mô tả, giá nhập/bán, phân loại và bộ sưu tập hình ảnh sản phẩm.
                </p>
              </div>

              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Core Info row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Tên Sản Phẩm *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên sản phẩm (Ví dụ: Ba chỉ bò Mỹ cắt lát)..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-red-650 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  {/* SKU */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mã sản phẩm (SKU)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: BO-BACHI-01..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200 font-mono"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Price and stock row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Base Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Đơn giá gốc (VND) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Nhập giá gốc..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  
                  {/* Sale Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Giá khuyến mãi (VND)</label>
                    <input
                      type="number"
                      placeholder="Bỏ trống nếu không giảm giá..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. Image uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Thumbnail upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Ảnh Đại Diện (Thumbnail)</label>
                    <div className="relative group rounded-xl border border-dashed border-slate-800 hover:border-red-800 bg-slate-950 flex flex-col items-center justify-center p-4 text-center cursor-pointer h-[120px] overflow-hidden transition-all">
                      {thumbnailPreview ? (
                        <>
                          <img src={thumbnailPreview} alt="thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-102 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                            <Upload className="w-5 h-5 text-slate-200 mb-1" />
                            <span className="text-[10px] text-slate-350 font-bold">Thay thế ảnh</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-650 mb-2 group-hover:text-red-500" />
                          <span className="text-[10px] text-slate-400 font-bold">Chọn ảnh đại diện sản phẩm</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">Tải lên file PNG, JPG dưới 5MB</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThumbnailChange} />
                    </div>
                  </div>

                  {/* Multi images upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Album ảnh phụ (Tối đa 8 ảnh)</label>
                    <div className="relative group rounded-xl border border-dashed border-slate-800 hover:border-red-800 bg-slate-950 flex flex-col items-center justify-center p-4 text-center cursor-pointer h-[120px] overflow-hidden transition-all">
                      <Upload className="w-5 h-5 text-slate-650 mb-2 group-hover:text-red-500" />
                      <span className="text-[10px] text-slate-400 font-bold">Chọn nhiều ảnh phụ</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">Giữ Ctrl để chọn nhiều ảnh</span>
                      <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImagesChange} />
                    </div>
                  </div>
                </div>

                {/* Previews of additional images */}
                {imagePreviews.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Danh sách ảnh phụ hiện có ({imagePreviews.length})</label>
                    <div className="flex flex-wrap gap-3">
                      {imagePreviews.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-850 bg-slate-950 group">
                          <img src={img} alt={`sub-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImagePreview(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-650 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Tag selection & management */}
                <div className="border-t border-slate-800/80 pt-5">
                  <div className="flex flex-col sm:flex-row gap-6 justify-between">
                    
                    {/* Select existing tags */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Chọn Tags sản phẩm</label>
                      {tags.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Chưa có tag nào trên hệ thống. Hãy tạo tag đầu tiên ở ô bên phải.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleToggleTag(tag.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                  isSelected
                                    ? 'bg-red-950/60 border-red-600 text-red-400 font-extrabold'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Create tag inline form */}
                    <div className="w-full sm:w-64 bg-slate-900 border border-slate-850 rounded-xl p-3">
                      <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">Tạo tag mới inline</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tên tag..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-red-600 text-slate-250"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                        />
                        <button
                          type="button"
                          disabled={creatingTag || !newTagName.trim()}
                          onClick={handleCreateTagInline}
                          className="bg-red-800 hover:bg-red-750 disabled:opacity-50 text-white p-2 rounded-lg text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 5. Short Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mô tả ngắn</label>
                  <textarea
                    rows="2"
                    placeholder="Mô tả tóm tắt hiển thị ở thẻ danh sách sản phẩm..."
                    className="w-full bg-slate-950 border border-slate-855 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200 resize-none"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                  />
                </div>

                {/* 6. Detail Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mô tả chi tiết sản phẩm</label>
                  <textarea
                    rows="6"
                    placeholder="Chi tiết về nguồn gốc, hạn sử dụng, hướng dẫn chế biến, bảo quản..."
                    className="w-full bg-slate-950 border border-slate-855 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200 resize-y"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* 7. Published Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="publishCheck"
                    className="w-4.5 h-4.5 bg-slate-950 border border-slate-800 rounded focus:ring-red-650 text-red-700 cursor-pointer"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <label htmlFor="publishCheck" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                    Công khai bán sản phẩm ngay sau khi tạo/lưu (Publish)
                  </label>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-750"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                form="productForm"
                disabled={submitting}
                className="px-5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-red-950/40"
              >
                <Save size={14} />
                {submitting ? 'Đang lưu...' : (editingId ? 'Cập nhật sản phẩm' : 'Đăng sản phẩm')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProductPage;
