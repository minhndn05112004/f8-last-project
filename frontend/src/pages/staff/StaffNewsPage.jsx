import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, CheckCircle, EyeOff, Upload, X, Save, Search, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/axios';

const StaffNewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Preview mode in Form modal
  const [previewMode, setPreviewMode] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/news', {
        params: {
          all: 'true', // staff gets all articles, including drafts
          limit: 100, // fetch all for internal view
        },
      });
      setArticles(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const resetForm = () => {
    setTitle('');
    setExcerpt('');
    setContent('');
    setIsPublished(false);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setEditingId(null);
    setPreviewMode(false);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (art) => {
    setTitle(art.title || '');
    setExcerpt(art.excerpt || '');
    setContent(art.content || '');
    setIsPublished(art.isPublished || false);
    setThumbnailFile(null);
    setThumbnailPreview(art.thumbnail ? `http://localhost:5000${art.thumbnail}` : '');
    setEditingId(art.id);
    setPreviewMode(false);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File không được lớn hơn 5MB');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung bài viết!');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('excerpt', excerpt.trim());
    formData.append('content', content.trim());
    formData.append('isPublished', isPublished ? 'true' : 'false');
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      if (editingId) {
        await api.put(`/news/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Cập nhật bài viết thành công!');
      } else {
        await api.post('/news', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Tạo bài viết mới thành công!');
      }
      setIsModalOpen(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này không?')) return;

    try {
      await api.delete(`/news/${id}`);
      toast.success('Đã xóa bài viết thành công');
      fetchArticles();
    } catch (err) {
      console.error(err);
      toast.error('Không thể xóa bài viết');
    }
  };

  const filteredArticles = articles.filter(
    (art) =>
      art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-white font-sans p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="text-red-500" size={28} />
            <span>Quản Lý Tin Tức & Cẩm Nang</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Tạo mới, chỉnh sửa, và quản lý các bài viết trên hệ thống.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-red-800 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 border border-red-750 transition-all shrink-0 align-self-start"
        >
          <Plus size={16} /> Viết Bài Mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 mb-6 flex gap-4 items-center shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề hoặc tóm tắt bài viết..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600 transition-all placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-3" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách bài viết...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-500">
            <AlertCircle size={44} className="text-slate-600 mb-3" />
            <p className="text-sm font-bold">Không tìm thấy bài viết nào</p>
            <p className="text-xs text-slate-500 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc viết bài mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-4 px-6">Ảnh bìa</th>
                  <th className="py-4 px-4">Bài viết</th>
                  <th className="py-4 px-4 text-center">Trạng thái</th>
                  <th className="py-4 px-4 text-center">Xem</th>
                  <th className="py-4 px-4">Ngày tạo</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-950/20 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-4 px-6 shrink-0">
                      <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                        {art.thumbnail ? (
                          <img
                            src={`http://localhost:5000${art.thumbnail}`}
                            alt="thumb"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=150&auto=format&fit=crop';
                            }}
                          />
                        ) : (
                          <FileText size={16} className="text-slate-700" />
                        )}
                      </div>
                    </td>

                    {/* Title & Author */}
                    <td className="py-4 px-4 max-w-[280px]">
                      <div className="font-bold text-slate-200 line-clamp-1 hover:text-red-500 transition-colors">
                        {art.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <span>Tác giả:</span>
                        <span className="font-bold text-slate-400">{art.createdBy?.fullName || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Status Toggle Tag */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {art.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-950/60 border border-green-900/60 text-green-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <CheckCircle size={10} /> Đã Đăng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/80 border border-slate-700/80 text-slate-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <EyeOff size={10} /> Bản Nháp
                        </span>
                      )}
                    </td>

                    {/* Views Count */}
                    <td className="py-4 px-4 text-center text-slate-300 font-semibold">{art.views || 0}</td>

                    {/* Created Date */}
                    <td className="py-4 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(art.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {art.isPublished && (
                          <a
                            href={`/news/${art.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800"
                            title="Xem trên trang chủ"
                          >
                            <Eye size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(art)}
                          className="p-1.5 bg-slate-850 hover:bg-slate-800 text-red-500 hover:text-red-400 rounded-lg transition-colors border border-slate-800"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="p-1.5 bg-slate-850 hover:bg-red-950 text-slate-500 hover:text-red-500 rounded-lg transition-colors border border-slate-800"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Write/Edit News Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="font-extrabold text-base text-slate-100">
                  {editingId ? 'Chỉnh Sửa Bài Viết' : 'Viết Bài Mới'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editingId ? 'Thay đổi nội dung thông tin bài viết' : 'Đăng tải các kiến thức hoặc công thức ẩm thực'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mode toggle */}
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    previewMode
                      ? 'bg-slate-800 text-red-500 border-red-900/50'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-white'
                  }`}
                >
                  {previewMode ? 'Sửa nội dung' : 'Xem thử bài viết'}
                </button>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body / Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
              {previewMode ? (
                // Article Preview Mode
                <div className="max-w-2xl mx-auto py-4">
                  {thumbnailPreview && (
                    <div className="rounded-2xl overflow-hidden h-48 md:h-72 mb-6 border border-slate-800">
                      <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-snug">{title || 'Tiêu đề trống'}</h1>
                  
                  {excerpt && (
                    <div className="p-4 rounded-xl bg-slate-900/50 border-l-4 border-l-red-600 italic text-slate-400 text-sm mb-6">
                      {excerpt}
                    </div>
                  )}
                  
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line text-justify mt-6 border-t border-slate-850 pt-6">
                    {content || 'Nội dung bài viết chưa được nhập'}
                  </div>
                </div>
              ) : (
                // Article Write Mode Form
                <form id="newsForm" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Input details */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Tiêu Đề Bài Viết *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nhập tiêu đề (ít nhất 5 ký tự)..."
                          className="w-full bg-slate-950 border border-slate-850 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>

                      {/* Excerpt */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Tóm Tắt Ngắn (Excerpt)</label>
                        <textarea
                          rows="2"
                          placeholder="Mô tả tóm tắt nội dung bài viết hiển thị ở thẻ tin tức..."
                          className="w-full bg-slate-950 border border-slate-850 focus:border-red-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600 transition-all text-slate-200 resize-none"
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Right: Upload thumbnail */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Ảnh Đại Diện Bài Viết</label>
                      <div className="relative group rounded-xl border border-dashed border-slate-800 hover:border-red-800 bg-slate-950 flex flex-col items-center justify-center p-4 text-center cursor-pointer h-[130px] overflow-hidden transition-all">
                        {thumbnailPreview ? (
                          <>
                            <img src={thumbnailPreview} alt="upload" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300" />
                            <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                              <Upload className="w-5 h-5 text-slate-200 mb-1" />
                              <span className="text-[10px] text-slate-300 font-bold">Thay thế hình ảnh</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-slate-600 mb-2 group-hover:text-red-500 transition-colors" />
                            <span className="text-[10px] text-slate-400 font-bold">Tải ảnh đại diện bài viết</span>
                            <span className="text-[9px] text-slate-500 mt-1">Hỗ trợ PNG, JPG (Max 5MB)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content (Textarea Markdown/Text) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nội Dung Chi Tiết *</label>
                    <div className="bg-slate-950 rounded-xl border border-slate-850 focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 transition-all p-1.5 flex flex-col">
                      {/* Quick hints */}
                      <div className="flex gap-4 p-1.5 text-[9px] text-slate-500 border-b border-slate-900 bg-slate-950 select-none">
                        <span>Định dạng hỗ trợ:</span>
                        <span><b># Tiêu đề 1</b></span>
                        <span><b>## Tiêu đề 2</b></span>
                        <span><b>- Danh sách</b></span>
                      </div>
                      <textarea
                        rows="12"
                        required
                        placeholder="Nội dung bài viết..."
                        className="w-full bg-transparent border-0 rounded-b-xl px-3 py-2 text-xs focus:outline-none transition-all text-slate-200 resize-y min-h-[220px]"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Published Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="publishCheck"
                      className="w-4.5 h-4.5 bg-slate-950 border border-slate-800 rounded focus:ring-red-600 text-red-700 cursor-pointer"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                    />
                    <label htmlFor="publishCheck" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                      Công khai bài viết ngay sau khi lưu (Publish)
                    </label>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-750"
              >
                Hủy bỏ
              </button>
              
              {!previewMode && (
                <button
                  type="submit"
                  form="newsForm"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-red-950/40"
                >
                  <Save size={14} />
                  {submitting ? 'Đang lưu...' : (editingId ? 'Cập nhật bài viết' : 'Đăng bài viết')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffNewsPage;
