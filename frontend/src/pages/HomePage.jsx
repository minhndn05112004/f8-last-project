import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/axios'

const Hero = () => (
  <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950">
    {/* Background Image with Overlay */}
    <div className="absolute inset-0 z-0">
      <img
        src="https://www.wildcountrymeats.com/wp-content/uploads/2025/10/shop-meat-cuts.jpg"
        alt="Premium Meat"
        className="w-full h-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
    </div>

    {/* Content */}
    <div className="container relative z-10 text-center text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-block px-6 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 font-bold mb-6 tracking-widest text-sm">
          Thịt sạch cao cấp
        </div>

        {/* The "Badge" from image */}
        <div className="flex justify-center mb-8">
          <div className="w-48 h-48 rounded-full border-2 border-white/20 flex flex-col items-center justify-center relative bg-black/40 backdrop-blur-sm">
            <div className="text-white/60 text-xs font-bold tracking-[0.2em] mb-1">ANTHONY</div>
            <div className="text-3xl font-bold text-white mb-2">ĐI CHỢ</div>
            <div className="text-5xl font-black text-red-600 leading-none">Online</div>
            <div className="absolute -bottom-4 bg-red-700 text-white px-6 py-2 rounded-full font-bold text-xs shadow-lg">MUA NGAY</div>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl text-white/80 font-medium italic mb-12">
          DỊCH VỤ GIAO HÀNG TẬN NHÀ
        </h2>
      </motion.div>
    </div>

    {/* Wave Divider */}
    <div className="hero-wave">
      <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
      </svg>
    </div>
  </section>
)

const Introduction = () => {
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Nguồn gốc rõ ràng",
      desc: "Từng miếng thịt được chọn lọc từ nguồn nông, 3 tuyến kiểm dịch nghiêm ngặt."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ),
      title: "Công nghệ cấp đông",
      desc: "Được xử lý với mọi công nghệ của Châu Âu và đúng quy chuẩn xuyên suốt."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Giao hàng nhanh",
      desc: "Thịt sạch được giao nhanh trong 0-4h từ khi đặt hàng, đảm bảo dinh dưỡng của thịt."
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container text-center">
        <h3 className="text-2xl font-bold mb-16 text-slate-800">Thịt sạch nhập khẩu quốc tế</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 mb-6">
                {f.icon}
              </div>
              <h4 className="font-bold text-lg mb-4">{f.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const ProductCard = ({ product }) => {
  const fallbackImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop';
  const image = product.thumbnail
    ? (product.thumbnail.startsWith('http') ? product.thumbnail : `http://localhost:5000${product.thumbnail}`)
    : fallbackImg;

  const hasDiscount = product.salePrice && product.salePrice < product.price;

  const formatPrice = (p) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="bg-white rounded-2xl overflow-hidden premium-shadow transition-all group flex flex-col justify-between"
    >
      <div>
        <div className="relative h-72 overflow-hidden bg-slate-100">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.target.src = fallbackImg; }}
          />
          {product.tags && product.tags.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
              {product.tags.slice(0, 2).map((t) => (
                <span key={t.id} className="bg-red-650 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 text-center">
          <h4 className="font-bold text-lg mb-2 text-slate-900 line-clamp-2 min-h-[56px] flex items-center justify-center">
            {product.name}
          </h4>
          <p className="text-slate-500 text-xs mb-4 line-clamp-2 min-h-[32px]">
            {product.shortDescription || 'Thịt sạch nhập khẩu chất lượng cao, tươi ngon mỗi ngày.'}
          </p>
          <div className="mb-4">
            {hasDiscount ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-red-600 font-extrabold text-lg">{formatPrice(product.salePrice)}</span>
                <span className="text-slate-400 line-through text-sm">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="text-slate-800 font-extrabold text-lg">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 pt-0">
        <Link
          to={`/products/${product.slug}`}
          className="block w-full py-3 rounded-lg border border-slate-200 font-bold text-sm text-slate-700 hover:bg-red-800 hover:text-white hover:border-red-800 text-center no-underline transition-all"
        >
          XEM CHI TIẾT
        </Link>
      </div>
    </motion.div>
  );
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products', {
          params: {
            limit: 3,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        })
        setProducts(res.data.data || [])
      } catch (err) {
        console.error('Failed to fetch featured products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <section className="py-24 bg-slate-50">
      <div className="container text-center">
        <h2 className="text-4xl font-bold mb-4 text-slate-900">Sản Phẩm Mới Nhất</h2>
        <div className="w-20 h-1 bg-red-600 mx-auto mb-16"></div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-slate-500 italic mb-12">Đang cập nhật danh mục sản phẩm mới...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <Link to="/products" className="inline-block bg-red-800 text-white font-bold px-10 py-4 rounded-lg hover:bg-red-900 transition-colors no-underline shadow-lg">
          XEM TẤT CẢ SẢN PHẨM
        </Link>
      </div>
    </section>
  )
}

const NewsSection = () => {
  const [latestNews, setLatestNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get('/news/latest')
        setLatestNews(res.data.data || [])
      } catch (err) {
        console.error('Failed to fetch latest news:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [])

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-4 text-slate-900">Góc Tin Tức</h2>
          <div className="w-20 h-1 bg-red-600 mx-auto mb-16"></div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
          </div>
        </div>
      </section>
    )
  }

  if (latestNews.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div>
            <span className="text-red-600 font-bold tracking-widest text-xs uppercase">BÀI VIẾT MỚI NHẤT</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-950 mt-2 tracking-tight">Cẩm nang & Tin ẩm thực</h2>
          </div>
          <Link to="/news" className="text-red-700 hover:text-red-800 font-bold text-sm tracking-wider uppercase border-b-2 border-red-700 pb-1 mt-4 md:mt-0 inline-block no-underline">
            Xem tất cả bài viết &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latestNews.map((news, idx) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col bg-white rounded-2xl border border-slate-150 overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
            >
              <Link to={`/news/${news.slug}`} className="block relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={
                    news.thumbnail
                      ? (news.thumbnail.startsWith('http') ? news.thumbnail : `http://localhost:5000${news.thumbnail}`)
                      : 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop'
                  }
                  alt={news.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop'
                  }}
                />
              </Link>
              <div className="p-6 flex-1 flex flex-col">
                <span className="text-[11px] font-bold text-red-600 mb-2">
                  {new Date(news.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <h3 className="font-bold text-base mb-2 group-hover:text-red-700 transition-colors line-clamp-2">
                  <Link to={`/news/${news.slug}`} className="text-slate-900 no-underline hover:text-red-700">
                    {news.title}
                  </Link>
                </h3>
                <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed flex-1">
                  {news.excerpt || 'Đang cập nhật tóm tắt nội dung bài viết...'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>Tác giả: <b>{news.createdBy?.fullName || 'Shop'}</b></span>
                  <span>{news.views || 0} lượt xem</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Partners = () => {
  const logos = [
    { name: 'KFC', src: 'https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/1280px-KFC_logo.svg.png' },
    { name: 'LOTTE', src: 'https://upload.wikimedia.org/wikipedia/vi/f/fd/Lotteria_logo.png?utm_source=vi.wikipedia.org&utm_campaign=index&utm_content=original' },
    { name: 'Jollibee', src: 'https://1000logos.net/wp-content/uploads/2019/03/jollibee-logo-png.png' },
    { name: 'McDonald', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1280px-McDonald%27s_Golden_Arches.svg.png' },
    { name: 'Texas Chicken', src: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Texas_Chicken_logo.png' },
    { name: 'Popeyes', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Popeyes_logo.svg/1280px-Popeyes_logo.svg.png' },
    { name: 'Burger King', src: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Burger_King_2020.svg' },
    { name: 'DQ', src: 'https://1000logos.net/wp-content/uploads/2020/12/Dairy-Queen-Logo.png' },
    { name: 'PIZZA HUT', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Pizza_hut_logo_international.svg/1280px-Pizza_hut_logo_international.svg.png' },
  ]

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-100 overflow-hidden">
      <div className="container text-center mb-10">
        <h3 className="text-xl font-bold text-slate-800">Các Đối Tác Của Anthony Shop</h3>
      </div>
      <div className="relative w-full overflow-hidden py-4 flex">
        <div className="flex animate-marquee">
          {/* First group of logos */}
          <div className="flex gap-16 md:gap-24 items-center pr-16 md:pr-24 flex-shrink-0">
            {logos.map((logo, idx) => (
              <img
                key={`first-${idx}`}
                src={logo.src}
                alt={logo.name}
                className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 flex-shrink-0"
              />
            ))}
          </div>
          {/* Second group of logos (exact clone with matching padding for seamless looping) */}
          <div className="flex gap-16 md:gap-24 items-center pr-16 md:pr-24 flex-shrink-0">
            {logos.map((logo, idx) => (
              <img
                key={`second-${idx}`}
                src={logo.src}
                alt={logo.name}
                className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const HomePage = () => {
  return (
    <div className="flex flex-col">
      <Hero />
      <Introduction />
      <FeaturedProducts />
      <NewsSection />
      <Partners />
    </div>
  )
}

export default HomePage
