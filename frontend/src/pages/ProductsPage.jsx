import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/axios';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';

const ProductsPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // State
  const [products, setProducts] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch Tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get('/tags');
        if (res.data?.success) {
          setTags(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };
    fetchTags();
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 9,
        sortBy,
        sortOrder,
        isPublished: 'true',
      };

      if (search.trim()) params.search = search.trim();
      if (selectedTag) params.tagSlug = selectedTag;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await api.get('/products', { params });
      if (res.data?.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedTag, sortBy, sortOrder, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setSelectedTag('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Add to cart handler
  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCartId(productId);
    await addToCart(productId, 1, navigate);
    setAddingToCartId(null);
  };

  // Get tag color scheme
  const getTagColorClass = (slug) => {
    const schemes = {
      'thit-bo': 'bg-red-50 text-red-700 border-red-200',
      'thit-heo': 'bg-pink-50 text-pink-700 border-pink-200',
      'thit-ga': 'bg-amber-50 text-amber-700 border-amber-200',
      'xuc-xich': 'bg-orange-50 text-orange-700 border-orange-200',
      'do-hop': 'bg-blue-50 text-blue-700 border-blue-200',
      'nhap-khau': 'bg-purple-50 text-purple-700 border-purple-200',
      'khuyen-mai': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return schemes[slug] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Premium Header Banner */}
      <div className="relative bg-slate-900 text-white overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
        {/* Decorative background grid and shapes */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-red-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-amber-600 rounded-full blur-[100px] opacity-15 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-block px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
            Anthony Shop - Thịt Nhập Khẩu Cao Cấp
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Danh Sách Sản Phẩm
          </h1>
          <p className="text-slate-350 text-lg md:text-xl max-w-2xl mx-auto font-light text-slate-300">
            Khám phá nguồn thực phẩm sạch, tươi ngon thượng hạng được nhập khẩu trực tiếp từ các nông trang danh tiếng toàn cầu.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 md:mt-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* FILTER SIDEBAR */}
          <aside className="w-full lg:w-1/4 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-28">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  Bộ lọc tìm kiếm
                </h2>
                <button 
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-750 transition-colors uppercase tracking-wider"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tìm kiếm sản phẩm</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Nhập tên, loại thịt..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                    </svg>
                  </span>
                </div>
              </form>

              {/* Tag Selection Chips */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nhóm sản phẩm</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSelectedTag(''); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedTag === ''
                        ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/10'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    Tất cả
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => { setSelectedTag(tag.slug); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedTag === tag.slug
                          ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/10'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Khoảng giá (VND)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                    placeholder="Từ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-xs"
                  />
                  <span className="text-slate-400 text-xs">─</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                    placeholder="Đến"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Sorting */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sắp xếp theo</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-xs cursor-pointer"
                >
                  <option value="createdAt-desc">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="name-asc">Tên A-Z</option>
                  <option value="stock-desc">Số lượng kho lớn</option>
                </select>
              </div>
            </div>
          </aside>

          {/* PRODUCTS GRID SECTION */}
          <main className="w-full lg:w-3/4">
            {loading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
                    <div className="bg-slate-200 aspect-[4/3] w-full"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-slate-200 rounded-full w-2/3"></div>
                      <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-200 rounded-full w-5/6"></div>
                      <div className="flex gap-2 pt-2">
                        <div className="h-5 bg-slate-200 rounded-full w-12"></div>
                        <div className="h-5 bg-slate-200 rounded-full w-16"></div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="h-6 bg-slate-200 rounded-full w-24"></div>
                        <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* Empty state */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center max-w-xl mx-auto my-8">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-slate-500 mb-6 text-sm">
                  Chúng tôi không tìm thấy sản phẩm nào khớp với điều kiện lọc của bạn. Thử thay đổi từ khóa hoặc bộ lọc xem sao!
                </p>
                <button 
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-750 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  Xóa bộ lọc và làm mới
                </button>
              </div>
            ) : (
              /* Products list */
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {products.map((product) => {
                    const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
                    const rawImage = product.images?.[0] || product.thumbnail || null;
                    const mainImage = getImageUrl(rawImage, fallbackImg);
                    const onSale = product.salePrice && product.salePrice < product.price;

                    return (
                      <div 
                        key={product.id}
                        onClick={() => navigate(`/products/${product.slug}`)}
                        className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col h-full cursor-pointer"
                      >
                        {/* Thumbnail Container */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                          <img
                            src={mainImage}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {/* Sale Badge */}
                          {onSale && (
                            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm z-10 animate-pulse">
                              Giảm giá
                            </span>
                          )}
                          {/* Stock Status Badge */}
                          <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm z-10 ${
                            product.stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng'}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mb-2.5">
                              {product.tags && product.tags.slice(0, 3).map((tag) => (
                                <span 
                                  key={tag.id} 
                                  className={`text-[9px] font-semibold px-2 py-0.5 border rounded-full ${getTagColorClass(tag.slug)}`}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>

                            {/* Title & Description */}
                            <h3 className="font-bold text-slate-800 text-base mb-1.5 group-hover:text-red-600 transition-colors line-clamp-2 min-h-[48px]">
                              {product.name}
                            </h3>
                            <p className="text-slate-500 text-xs font-light line-clamp-2 mb-4 leading-relaxed">
                              {product.shortDescription || product.description || 'Chưa có mô tả ngắn về sản phẩm.'}
                            </p>
                          </div>

                          {/* Footer: Price & Add button */}
                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                            <div className="flex flex-col">
                              {onSale ? (
                                <>
                                  <span className="text-xs text-slate-400 line-through font-light leading-none">
                                    {formatPrice(product.price)}
                                  </span>
                                  <span className="text-base font-bold text-red-600 leading-tight mt-0.5">
                                    {formatPrice(product.salePrice)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-base font-bold text-slate-800 leading-tight">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>

                            <button
                              disabled={product.stock <= 0 || addingToCartId === product.id}
                              onClick={(e) => handleAddToCart(product.id, e)}
                              className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center ${
                                product.stock <= 0
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-red-50 text-red-600 border-red-150 hover:bg-red-600 hover:text-white hover:border-red-600 hover:scale-105 active:scale-95 shadow-sm'
                              }`}
                              title={product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                            >
                              {addingToCartId === product.id ? (
                                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION CONTROLS */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                            pagination.page === pageNum
                              ? 'bg-red-600 text-white border border-red-600 shadow-sm shadow-red-600/10'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
