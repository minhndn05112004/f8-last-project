import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Save, 
  Plus, 
  Info,
  DollarSign,
  Package,
  FileText,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/axios';

const StaffProductCreatePage = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  
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
  
  // Image uploads states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Tag Management Inline state
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

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
    fetchTags();
  }, []);

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

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
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
    
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
    }

    try {
      await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Thêm sản phẩm mới thành công!');
      navigate('/staff/products');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-white font-sans p-6 md:p-8">
      {/* Top action bar */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link to="/staff/products" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="text-xs text-slate-450 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span>Sản phẩm</span>
            <span>/</span>
            <span className="text-red-500">Thêm mới</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 mt-1">Thêm Sản Phẩm Mới</h1>
        </div>
      </div>

      {/* Main split-form workspace */}
      <div className="flex-1 overflow-y-auto pr-1">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
          
          {/* Left Area (2/3 width on desktop): Core details form cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Info Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-2">
                <FileText className="text-red-500" size={18} />
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Thông tin mô tả</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Tên Sản Phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sản phẩm (Ví dụ: Ba chỉ bò Mỹ cắt lát)..."
                  className="w-full bg-slate-950 border border-slate-805 focus:border-red-600 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mã sản phẩm (SKU)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: BO-BACHI-01..."
                  className="w-full bg-slate-950 border border-slate-805 focus:border-red-600 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-205 font-mono"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mô tả ngắn</label>
                <textarea
                  rows="2"
                  placeholder="Mô tả tóm tắt ngắn gọn hiển thị tại thẻ sản phẩm ở trang chủ/danh sách..."
                  className="w-full bg-slate-950 border border-slate-805 focus:border-red-600 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200 resize-none"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Mô tả chi tiết</label>
                <textarea
                  rows="8"
                  placeholder="Mô tả chi tiết sản phẩm bao gồm nguồn gốc xuất xứ, độ dày lát cắt, hướng dẫn bảo quản, chế biến..."
                  className="w-full bg-slate-950 border border-slate-805 focus:border-red-600 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200 resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Inventory & Pricing Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-2">
                <DollarSign className="text-red-500" size={18} />
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Giá bán & Tồn kho</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Đơn giá gốc (VND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 250000..."
                    className="w-full bg-slate-950 border border-slate-805 focus:border-red-600 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Giá khuyến mãi (VND)</label>
                  <input
                    type="number"
                    placeholder="Bỏ trống nếu không giảm giá..."
                    className="w-full bg-slate-950 border border-slate-805 focus:border-red-600 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full bg-slate-950 border border-slate-805 focus:border-red-600 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Media/Images Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-2">
                <Upload className="text-red-500" size={18} />
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Hình ảnh sản phẩm</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thumbnail upload box */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Ảnh Đại Diện (Thumbnail)</label>
                  <div className="relative group rounded-xl border border-dashed border-slate-800 hover:border-red-800 bg-slate-950 flex flex-col items-center justify-center p-4 text-center cursor-pointer h-[150px] overflow-hidden transition-all">
                    {thumbnailPreview ? (
                      <>
                        <img src={thumbnailPreview} alt="thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-102 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveThumbnail();
                            }}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-600 mb-2 group-hover:text-red-500 transition-colors" />
                        <span className="text-[10px] text-slate-400 font-bold">Chọn ảnh đại diện sản phẩm</span>
                        <span className="text-[9px] text-slate-500 mt-1">Tải lên file PNG, JPG dưới 5MB</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThumbnailChange} />
                  </div>
                </div>

                {/* Multiple upload box */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Album ảnh phụ (Tối đa 8 ảnh)</label>
                  <div className="relative group rounded-xl border border-dashed border-slate-800 hover:border-red-800 bg-slate-950 flex flex-col items-center justify-center p-4 text-center cursor-pointer h-[150px] overflow-hidden transition-all">
                    <Upload className="w-6 h-6 text-slate-600 mb-2 group-hover:text-red-500 transition-colors" />
                    <span className="text-[10px] text-slate-400 font-bold">Chọn nhiều ảnh phụ</span>
                    <span className="text-[9px] text-slate-500 mt-1">Giữ Ctrl hoặc chọn nhiều ảnh một lúc</span>
                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImagesChange} />
                  </div>
                </div>
              </div>

              {/* Sub-images preview list */}
              {imagePreviews.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Hình ảnh album đã chọn ({imagePreviews.length})</label>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 group">
                        <img src={img} alt={`sub-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImagePreview(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Area (1/3 width on desktop): Organization, status, and tags */}
          <div className="space-y-6">
            
            {/* Status & Action Control */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-2">
                <Info className="text-red-500" size={18} />
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Trạng thái phát hành</h3>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <span className="text-xs font-bold text-slate-350 select-none">Công khai bán sản phẩm</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-red-800/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-800"></div>
                </label>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/45 border border-red-750"
                >
                  <Save size={16} />
                  {submitting ? 'ĐANG LƯU SẢN PHẨM...' : 'ĐĂNG BÁN SẢN PHẨM'}
                </button>
                <Link
                  to="/staff/products"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-750/70 text-center no-underline transition-colors"
                >
                  HỦY BỎ
                </Link>
              </div>
            </div>

            {/* Tags Selection Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-2">
                <Tag className="text-red-500" size={18} />
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">Nhãn phân loại (Tags)</h3>
              </div>

              {/* Tag select box list */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Chọn tags cho sản phẩm</label>
                {tags.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Chưa có tag nào trên hệ thống.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleTag(tag.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-red-950/60 border-red-650 text-red-400 font-extrabold'
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

              {/* Tag creation box inline */}
              <div className="bg-slate-950 rounded-xl border border-slate-850 p-3.5 space-y-2.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tạo nhãn mới trực tiếp</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tên tag (Ví dụ: Bò Mỹ)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-red-600 text-slate-200"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={creatingTag || !newTagName.trim()}
                    onClick={handleCreateTagInline}
                    className="bg-red-800 hover:bg-red-750 disabled:opacity-50 text-white px-3 rounded-lg text-xs font-black transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </form>
      </div>

    </div>
  );
};

export default StaffProductCreatePage;
