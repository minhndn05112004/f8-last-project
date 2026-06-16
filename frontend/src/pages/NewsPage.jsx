import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MessageSquare, ThumbsUp, Eye, User, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/axios';
import { getImageUrl } from '../utils/imageUrl';

const NewsPage = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 6; // 6 items per page for clean grid

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/news', {
        params: {
          page: currentPage,
          limit,
          search: searchQuery,
        },
      });
      setNewsList(res.data.data);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalItems(res.data.pagination.total || 0);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNews();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-28 pb-20">
      {/* Banner/Header */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-red-900/30 py-16 mb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.15),transparent)]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-red-500 font-bold tracking-widest text-xs uppercase bg-red-950/50 border border-red-900/50 px-4 py-1.5 rounded-full">
            Blog & Cẩm nang
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 mb-4 tracking-tight">
            Góc Tin Tức & <span className="text-red-600">Ẩm Thực</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            Cập nhật tin tức mới nhất về các loại thịt nhập khẩu cao cấp, công thức chế biến chuẩn nhà hàng và mẹo nội trợ hữu ích.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-md mx-auto relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-600 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-red-800 hover:bg-red-700 text-white font-bold px-6 rounded-xl text-sm transition-colors shadow-lg shadow-red-950/50 border border-red-700/30"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {loading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-800"></div>
                <div className="p-6">
                  <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                  <div className="h-6 bg-slate-800 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6 mb-4"></div>
                  <div className="h-8 bg-slate-800 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : newsList.length === 0 ? (
          // Empty state
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800/50 rounded-2xl max-w-xl mx-auto px-6">
            <div className="w-16 h-16 bg-red-950/30 border border-red-900/30 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Không tìm thấy bài viết</h3>
            <p className="text-slate-400 text-sm mb-6">
              Chúng tôi không tìm thấy bài viết nào phù hợp với từ khóa của bạn. Vui lòng thử lại với từ khóa khác.
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  setTimeout(fetchNews, 0);
                }}
                className="bg-red-800 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                Xem tất cả bài viết
              </button>
            )}
          </div>
        ) : (
          <>
            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsList.map((news) => (
                <article
                  key={news.id}
                  className="bg-slate-900 hover:bg-slate-900/80 rounded-2xl border border-slate-800/80 hover:border-red-900/30 overflow-hidden flex flex-col transition-all duration-300 group shadow-xl"
                >
                  {/* Thumbnail */}
                  <Link to={`/news/${news.slug}`} className="block relative h-52 overflow-hidden bg-slate-950">
                    <img
                      src={getImageUrl(news.thumbnail, 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop')}
                      alt={news.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60"></div>
                  </Link>

                  {/* Content Body */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-red-500" />
                        {formatDate(news.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-red-500" />
                        {news.createdBy?.fullName || 'Tác giả'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-2 group-hover:text-red-500 transition-colors line-clamp-2">
                      <Link to={`/news/${news.slug}`} className="no-underline text-white hover:text-red-500">
                        {news.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                      {news.excerpt || 'Đang cập nhật tóm tắt nội dung bài viết...'}
                    </p>

                    {/* Footer / Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1" title="Lượt xem">
                          <Eye className="w-4 h-4 text-slate-500" />
                          {news.views || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Lượt thích">
                          <ThumbsUp className="w-4 h-4 text-slate-500" />
                          {news.likes || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Bình luận">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          {news._count?.comments || 0}
                        </span>
                      </div>

                      <Link
                        to={`/news/${news.slug}`}
                        className="text-red-500 hover:text-red-400 font-bold uppercase tracking-wider text-[11px] no-underline transition-colors flex items-center gap-1"
                      >
                        Đọc tiếp &rarr;
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 font-bold text-sm rounded-xl border transition-colors ${
                      currentPage === i + 1
                        ? 'bg-red-800 text-white border-red-700 shadow-md shadow-red-950/40'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 p-2.5 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
