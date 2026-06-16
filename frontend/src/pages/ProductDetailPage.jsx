import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/axios';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // State
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch Product Details
  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/slug/${slug}`);
      if (res.data?.success) {
        const prod = res.data.data;
        setProduct(prod);
        
        // Set active image
        const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
        const rawImages = [prod.thumbnail, ...(prod.images || [])].filter(Boolean);
        const allImages = rawImages.map(img => getImageUrl(img));
        setActiveImage(allImages[0] || fallbackImg);
        
        // Fetch related products
        if (prod.tags && prod.tags.length > 0) {
          fetchRelated(prod.tags.map((t) => t.slug).join(','), prod.id);
        } else {
          setRelatedProducts([]);
          setLoadingRelated(false);
        }
      } else {
        toast.error('Không tìm thấy sản phẩm');
        navigate('/products');
      }
    } catch (err) {
      console.error('Error fetching product detail:', err);
      toast.error('Có lỗi xảy ra khi tải thông tin sản phẩm');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  // Fetch Related Products
  const fetchRelated = async (tagSlugs, excludeId) => {
    try {
      setLoadingRelated(true);
      const res = await api.get('/products/related', {
        params: { tagSlugs, excludeId, limit: 4 },
      });
      if (res.data?.success) {
        setRelatedProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching related products:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProductDetails();
      // Reset quantity
      setQuantity(1);
    }
  }, [slug, fetchProductDetails]);

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Quantity controls
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      toast.error('Vượt quá số lượng còn lại trong kho');
    }
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    await addToCart(product.id, quantity, navigate);
    setAddingToCart(false);
  };

  // Render tag colors
  const getTagColorClass = (tagSlug) => {
    const schemes = {
      'thit-bo': 'bg-red-50 text-red-700 border-red-200',
      'thit-heo': 'bg-pink-50 text-pink-700 border-pink-200',
      'thit-ga': 'bg-amber-50 text-amber-700 border-amber-200',
      'xuc-xich': 'bg-orange-50 text-orange-700 border-orange-200',
      'do-hop': 'bg-blue-50 text-blue-700 border-blue-200',
      'nhap-khau': 'bg-purple-50 text-purple-700 border-purple-200',
      'khuyen-mai': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return schemes[tagSlug] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  if (loading) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-slate-500 text-sm font-medium">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const rawImages = [product.thumbnail, ...(product.images || [])].filter(Boolean);
  const allImages = rawImages.map(img => getImageUrl(img));
  const onSale = product.salePrice && product.salePrice < product.price;
  const discountPercent = onSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-8">
          <Link to="/" className="hover:text-red-600 no-underline transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-red-600 no-underline transition-colors">Sản phẩm</Link>
          <span>/</span>
          <span className="text-slate-800 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product detail core info */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* LEFT COLUMN: Gallery */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              {/* Main Image Frame */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group">
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                {onSale && (
                  <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                    Giảm -{discountPercent}%
                  </span>
                )}
              </div>

              {/* Thumbnails list */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-16 flex-shrink-0 rounded-xl overflow-hidden border transition-all ${
                        activeImage === img
                          ? 'border-red-600 ring-2 ring-red-500/20'
                          : 'border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <img src={img} alt={`${product.name}-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Detail Info */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between">
              <div>
                {/* Meta tags */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {product.tags && product.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/products?tagSlug=${tag.slug}`}
                      className={`text-xs font-semibold px-3 py-1 border rounded-full no-underline transition-colors ${getTagColorClass(tag.slug)}`}
                    >
                      {tag.name}
                    </Link>
                  ))}
                  {product.sku && (
                    <span className="text-slate-400 text-xs font-mono ml-auto">
                      SKU: <span className="text-slate-600 font-semibold">{product.sku}</span>
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
                  {product.name}
                </h1>

                {/* Stock Status Badge */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-medium text-slate-600">
                    {product.stock > 0 ? `Còn hàng (Hiện có ${product.stock} sản phẩm)` : 'Hết hàng'}
                  </span>
                </div>

                {/* Pricing Block */}
                <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 flex items-center gap-4">
                  {onSale ? (
                    <>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Giá cũ</p>
                        <span className="text-lg text-slate-400 line-through font-light leading-none">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div>
                        <p className="text-xs font-medium text-red-500 uppercase tracking-wider mb-1">Giá khuyến mãi</p>
                        <span className="text-3xl font-extrabold text-red-600 leading-tight">
                          {formatPrice(product.salePrice)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Đơn giá</p>
                      <span className="text-3xl font-extrabold text-slate-800 leading-tight">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Short description */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Mô tả ngắn</h3>
                  <p className="text-slate-650 text-sm leading-relaxed font-light text-slate-600">
                    {product.shortDescription || 'Sản phẩm nhập khẩu chất lượng cao từ Anthony Shop. Đảm bảo vệ sinh an toàn thực phẩm và giữ trọn hương vị tươi ngon nhất.'}
                  </p>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="pt-6 border-t border-slate-100">
                {product.stock > 0 ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Quantity Picker */}
                    <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 p-1 w-full sm:w-32">
                      <button
                        onClick={handleDecrease}
                        className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-bold"
                        disabled={quantity <= 1}
                      >
                        ─
                      </button>
                      <span className="text-sm font-bold text-slate-800 px-3">{quantity}</span>
                      <button
                        onClick={handleIncrease}
                        className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-bold"
                        disabled={quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="flex-1 px-8 py-3.5 bg-red-600 hover:bg-red-750 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-md shadow-red-600/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {addingToCart ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang thêm vào giỏ...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          Thêm vào giỏ hàng
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-xl text-sm cursor-not-allowed text-center uppercase tracking-wider"
                  >
                    Sản phẩm tạm hết hàng
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Description */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-800 pb-3 border-b border-slate-100 mb-5">
            Thông Tin Chi Tiết Sản Phẩm
          </h2>
          <div className="prose max-w-none text-slate-600 text-sm leading-relaxed font-light whitespace-pre-wrap">
            {product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Có thể bạn quan tâm</span>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 mt-1">Sản Phẩm Tương Tự</h2>
              </div>
              <Link to="/products" className="text-xs font-bold text-slate-500 hover:text-red-600 uppercase tracking-wider transition-colors no-underline">
                Xem tất cả
              </Link>
            </div>

            {loadingRelated ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse h-64"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((p) => {
                  const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
                  const rawImage = p.images?.[0] || p.thumbnail || null;
                  const pImage = getImageUrl(rawImage, fallbackImg);
                  const pOnSale = p.salePrice && p.salePrice < p.price;

                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/products/${p.slug}`)}
                      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col h-full cursor-pointer"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <img src={pImage} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {pOnSale && (
                          <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                            Sale
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-red-600 transition-colors line-clamp-1">
                            {p.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {p.tags?.slice(0, 2).map((t) => (
                              <span key={t.id} className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full border ${getTagColorClass(t.slug)}`}>
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between mt-auto">
                          <div className="flex flex-col">
                            {pOnSale ? (
                              <>
                                <span className="text-[10px] text-slate-400 line-through leading-none">{formatPrice(p.price)}</span>
                                <span className="text-sm font-bold text-red-600 leading-tight mt-0.5">{formatPrice(p.salePrice)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-slate-800 leading-tight">{formatPrice(p.price)}</span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-red-600 group-hover:underline flex items-center gap-0.5">
                            Xem
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;
