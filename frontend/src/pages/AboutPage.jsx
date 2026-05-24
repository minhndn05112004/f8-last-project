import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Eye, 
  Heart, 
  Award, 
  MapPin, 
  Phone, 
  Clock, 
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Globe,
  Truck,
  Sparkles
} from 'lucide-react';

const AboutPage = () => {
  // State for active map tab
  const [activeBranch, setActiveBranch] = useState('hn');
  
  // State for FAQ accordion
  const [openFaq, setOpenFaq] = useState(null);

  const branches = [
    {
      id: 'hn',
      city: 'Hà Nội',
      name: 'Chi nhánh Hà Nội',
      address: '120 Trần Duy Hưng, Cầu Giấy, Hà Nội',
      hotline: '024.7300.7300',
      hours: '08:00 - 22:00',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.4443900984954!2d105.80164871488316!3d21.014902986006766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab5ef7e4b9cb%3A0x6e2db05934522818!2zMTIwIFRy4bqnbiBEdXkgSMawbmcsIFRydW5nIEjDsmEsIEPhuqd1IEdp4bqleSwgSMOgIE7hu5lpLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1653300000000!5m2!1sen!2s'
    },
    {
      id: 'dn',
      city: 'Đà Nẵng',
      name: 'Chi nhánh Đà Nẵng',
      address: '45 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
      hotline: '0236.730.7300',
      hours: '08:00 - 22:00',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.0298816654763!2d108.21200231481165!3d16.063777988883656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219b5b47a06ab%3A0xe5a3e1b7c0ff74!2zNDUgTmd1eeG7hW4gVsSDbiBMaW5oLCBCw6xuaCBIacOqbiwgSOG6o2kgQ2jDonUsIMSQw6AgTuG6tW5nLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1653300000001!5m2!1sen!2s'
    },
    {
      id: 'hcm',
      city: 'TP. Hồ Chí Minh',
      name: 'Chi nhánh TP.HCM',
      address: '88 Nguyễn Huệ, Quận 1, TP.HCM',
      hotline: '028.7300.7300',
      hours: '08:00 - 22:00',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4602324222046!2d106.702310114749!3d10.776019392321857!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a1b6a78b%3A0x1d368e7188b8d4e4!2zODggTmd1eeG7hW4gSHXhu4csIELhurNuIE5naMOpLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1653300000002!5m2!1sen!2s'
    }
  ];

  const values = [
    {
      icon: <Award className="w-8 h-8 text-red-600" />,
      title: 'Chất lượng',
      description: 'Chỉ cung cấp những thớ thịt nhập khẩu hảo hạng từ các trang trại uy tín trên thế giới, đảm bảo độ tươi ngon vượt trội.'
    },
    {
      icon: <Eye className="w-8 h-8 text-red-600" />,
      title: 'Minh bạch',
      description: 'Nguồn gốc xuất xứ rõ ràng, đầy đủ chứng từ nhập khẩu chính ngạch và giấy kiểm dịch từ các cơ quan chức năng.'
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-red-600" />,
      title: 'An toàn',
      description: 'Bảo quản bằng công nghệ cấp đông Châu Âu khép kín, tuyệt đối không chất bảo quản hay phụ gia độc hại.'
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      title: 'Tận tâm',
      description: 'Luôn lắng nghe, tận tình tư vấn và giao hàng hỏa tốc trong 0-4h để bảo toàn chất lượng dinh dưỡng của thực phẩm.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Chọn nguồn cung',
      description: 'Hợp tác trực tiếp với các trang trại nuôi thả tự nhiên đạt chuẩn hữu cơ tại Mỹ, Úc, Nhật Bản.'
    },
    {
      number: '02',
      title: 'Kiểm định chất lượng',
      description: 'Mỗi lô thịt đều trải qua 3 tuyến kiểm dịch nghiêm ngặt trước khi đóng gói xuất khẩu.'
    },
    {
      number: '03',
      title: 'Cấp đông chuẩn quốc tế',
      description: 'Sử dụng công nghệ cấp đông nhanh (Quick Freezing) tại -40°C để giữ nguyên dưỡng chất và cấu trúc cơ thịt.'
    },
    {
      number: '04',
      title: 'Vận chuyển lạnh',
      description: 'Vận chuyển khép kín trong các container lạnh chuyên dụng xuyên suốt hành trình về Việt Nam.'
    },
    {
      number: '05',
      title: 'Giao đến khách hàng',
      description: 'Đóng gói hút chân không hai lớp và giao nhanh bằng thùng giữ nhiệt tận tay khách hàng.'
    }
  ];

  const faqs = [
    {
      question: 'Thịt nhập khẩu tại Anthony Shop có nguồn gốc từ đâu?',
      answer: 'Tất cả các sản phẩm thịt bò, heo, cừu tại Anthony Shop đều được nhập khẩu chính ngạch từ các quốc gia phát triển mạnh về chăn nuôi như Mỹ (USDA Prime/Choice), Úc (MSA Certified), Nhật Bản (Wagyu A5), Canada... Chúng tôi cam kết cung cấp đầy đủ giấy chứng nhận nguồn gốc xuất xứ (CO) và kiểm dịch vệ sinh an toàn thực phẩm.'
    },
    {
      question: 'Anthony Shop có giao hàng toàn quốc không?',
      answer: 'Chúng tôi hỗ trợ giao hàng hỏa tốc bằng thùng giữ nhiệt chuyên dụng trong vòng 2-4h tại nội thành Hà Nội, Đà Nẵng và TP.HCM. Đối với các tỉnh thành lân cận khác, chúng tôi cung cấp dịch vụ giao hàng thông qua hệ thống xe tải đông lạnh chuyên dụng để đảm bảo sản phẩm luôn duy trì ở nhiệt độ tiêu chuẩn và không bị rã đông trong quá trình vận chuyển.'
    },
    {
      question: 'Làm thế nào để bảo quản thịt nhập khẩu đúng cách tại nhà?',
      answer: 'Để bảo toàn nguyên vẹn độ ngọt và giá trị dinh dưỡng, bạn nên bảo quản thịt trong ngăn đá hoặc tủ đông chuyên dụng ở nhiệt độ dưới -18°C. Trước khi chế biến, hãy rã đông tự nhiên bằng cách chuyển thịt xuống ngăn mát tủ lạnh từ 4-8 tiếng. Tránh rã đông trực tiếp bằng nước nóng hoặc lò vi sóng ở nhiệt độ quá cao vì sẽ làm mất đi các dưỡng chất tự nhiên trong thịt.'
    },
    {
      question: 'Sản phẩm của Anthony Shop có đầy đủ chứng nhận an toàn thực phẩm không?',
      answer: 'Hoàn toàn có. 100% sản phẩm bày bán tại Anthony Shop đều vượt qua các đợt kiểm dịch khắt khe của Bộ Nông nghiệp & Phát triển Nông thôn và Bộ Y tế Việt Nam. Sản phẩm được sơ chế và đóng gói tại cơ sở đạt tiêu chuẩn HACCP và ISO 22000 về hệ thống quản lý an toàn thực phẩm.'
    }
  ];

  return (
    <div className="flex flex-col bg-white overflow-hidden">
      
      {/* 1. HERO BANNER */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-slate-950 pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1920&auto=format&fit=crop"
            alt="Premium Imported Meat Banner"
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        </div>

        <div className="container relative z-10 px-4 py-16 md:py-24">
          <div className="max-w-3xl text-left text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 font-bold mb-6 tracking-widest text-xs uppercase animate-pulse">
                <Sparkles className="w-4.5 h-4.5" /> ANTHONY SHOP
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
                Thịt Nhập Khẩu <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">Cao Cấp Hảo Hạng</span>
              </h1>
              <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed font-light">
                Chào mừng bạn đến với Anthony Shop - Hệ thống phân phối thực phẩm nhập khẩu cao cấp hàng đầu Việt Nam. Chúng tôi mang đến cho gia đình bạn những thớ thịt tươi ngon nhất được tuyển chọn nghiêm ngặt từ những nông trại hàng đầu tại Mỹ, Úc, Nhật Bản...
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="bg-red-700 text-white font-bold px-8 py-4 rounded-xl hover:bg-red-800 transition-all duration-300 shadow-lg hover:shadow-red-700/20 transform hover:-translate-y-1 no-underline flex items-center gap-2"
                >
                  Khám phá sản phẩm <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#brand-story"
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-300 no-underline"
                >
                  Tìm hiểu câu chuyện
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Curved bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden line-height-0">
          <svg className="relative block w-full h-[40px] text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79-22.2,103.59-32.17,158-33.46,158-3.75,326.69,56.77,482,51.84,182.26-5.78,348.64-56.77,560-26.06V0Z" fill="currentColor"></path>
          </svg>
        </div>
      </section>

      {/* 2. GIỚI THIỆU THƯƠNG HIỆU */}
      <section id="brand-story" className="py-20 md:py-28 bg-white">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-red-600 font-bold tracking-widest text-xs uppercase block mb-3">VỀ CHÚNG TÔI</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                  Tinh Hoa Ẩm Thực Nhập Khẩu Cho Bữa Ăn Trọn Vẹn
                </h2>
                <div className="w-16 h-1 bg-red-600 mb-8"></div>
                <div className="space-y-5 text-slate-600 text-sm md:text-base leading-relaxed font-light">
                  <p>
                    Được thành lập với khát vọng mang đến nguồn thực phẩm cao cấp cho thị trường Việt Nam, <strong>Anthony Shop</strong> tự hào là đối tác phân phối thịt nhập khẩu uy tín từ các thương hiệu chăn nuôi danh giá bậc nhất thế giới.
                  </p>
                  <p>
                    Mỗi sản phẩm tại cửa hàng của chúng tôi đều trải qua quy trình đánh giá và bảo quản nghiêm ngặt bằng công nghệ cấp đông sâu Châu Âu hiện đại. Điều này giúp giữ nguyên cấu trúc protein, vị ngọt tự nhiên và dinh dưỡng dồi dào nguyên bản của miếng thịt.
                  </p>
                  <p>
                    Chúng tôi không chỉ bán thịt sạch, chúng tôi mang tới một phong cách sống ẩm thực thượng lưu - nơi sự an toàn, chất lượng và trải nghiệm của khách hàng luôn được đặt ở vị thế độc tôn.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="border-l-4 border-red-600 pl-4">
                    <h3 className="text-2xl font-black text-slate-900 m-0">100%</h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Chất lượng nhập khẩu</p>
                  </div>
                  <div className="border-l-4 border-red-600 pl-4">
                    <h3 className="text-2xl font-black text-slate-900 m-0">Giao nhanh</h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Trong vòng 2 giờ</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="col-12 col-lg-6">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-red-800/10 rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=1000&auto=format&fit=crop"
                  alt="Premium Steak Cuts Anthony Shop"
                  className="w-full h-[400px] md:h-[480px] object-cover rounded-2xl shadow-xl border border-slate-100"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TẦM NHÌN / SỨ MỆNH */}
      <section className="py-20 bg-slate-950 text-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950/20 to-slate-950"></div>
        <div className="container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-red-500 font-bold tracking-widest text-xs uppercase">ĐỊNH HƯỚNG PHÁT TRIỂN</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-white">Tầm Nhìn & Sứ Mệnh</h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          <div className="row g-4 justify-content-center">
            {/* Vision Card */}
            <div className="col-12 col-md-6">
              <motion.div
                whileHover={{ y: -8, borderColor: 'rgba(239, 68, 68, 0.4)' }}
                className="h-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col transition-all duration-300 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl group-hover:bg-red-600/20 transition-all duration-300"></div>
                <div className="w-14 h-14 bg-red-700/20 border border-red-600/30 rounded-xl flex items-center justify-center text-red-500 mb-6">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">TẦM NHÌN</h3>
                <p className="text-slate-300 text-sm leading-relaxed font-light flex-1">
                  Trở thành thương hiệu phân phối thực phẩm nhập khẩu hàng đầu Việt Nam. Anthony Shop định hướng xây dựng hệ thống chi nhánh phủ khắp toàn quốc, là lựa chọn số một của người tiêu dùng thông thái khi nghĩ về thịt sạch và các sản phẩm ẩm thực ngoại nhập hảo hạng.
                </p>
              </motion.div>
            </div>

            {/* Mission Card */}
            <div className="col-12 col-md-6">
              <motion.div
                whileHover={{ y: -8, borderColor: 'rgba(239, 68, 68, 0.4)' }}
                className="h-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col transition-all duration-300 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl group-hover:bg-red-600/20 transition-all duration-300"></div>
                <div className="w-14 h-14 bg-red-700/20 border border-red-600/30 rounded-xl flex items-center justify-center text-red-500 mb-6">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">SỨ MỆNH</h3>
                <p className="text-slate-300 text-sm leading-relaxed font-light flex-1">
                  Mang nguồn dinh dưỡng chất lượng cao chuẩn quốc tế tới bàn ăn của mọi gia đình Việt. Chúng tôi cam kết đem lại sự an tâm tuyệt đối về chất lượng vệ sinh thực phẩm, tối ưu trải nghiệm mua sắm và hỗ trợ chăm sóc sức khỏe cộng đồng qua từng thớ thịt.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GIÁ TRỊ CỐT LÕI */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-red-600 font-bold tracking-widest text-xs uppercase">BẢO CHỨNG THƯƠNG HIỆU</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">Giá Trị Cốt Lõi</h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          <div className="row g-4">
            {values.map((val, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="h-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
                    {val.icon}
                  </div>
                  <h4 className="font-extrabold text-lg mb-3 text-slate-900">{val.title}</h4>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                    {val.description}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. QUY TRÌNH NHẬP KHẨU */}
      <section className="py-20 md:py-28 bg-slate-50 relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-red-600 font-bold tracking-widest text-xs uppercase">QUY TRÌNH KHÉP KÍN</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">Từ Đồng Cỏ Đến Bàn Ăn</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-3">Quy trình nhập khẩu và bảo quản thịt tiêu chuẩn quốc tế</p>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          {/* Timeline UI */}
          <div className="relative mt-12">
            {/* Connection Line for Desktop */}
            <div className="hidden lg:block absolute top-[40px] left-[5%] right-[5%] h-0.5 bg-gradient-to-r from-red-600/20 via-red-600 to-red-600/20 -z-10"></div>
            
            <div className="row g-4 justify-content-center relative z-10">
              {steps.map((step, idx) => (
                <div key={idx} className="col-12 col-md-6 col-lg">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                    className="h-full bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative"
                  >
                    {/* Step Number Badge */}
                    <div className="w-12 h-12 bg-red-700 text-white rounded-full font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-red-700/20">
                      {step.number}
                    </div>
                    <h4 className="font-extrabold text-base mb-2 text-slate-900">{step.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 & 7. CHI NHÁNH CỬA HÀNG & GOOGLE MAPS */}
      <section className="py-20 md:py-28 bg-white border-t border-slate-100">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-red-600 font-bold tracking-widest text-xs uppercase">HỆ THỐNG PHÂN PHỐI</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">Chi Nhánh & Bản Đồ</h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          <div className="row g-5">
            {/* Branch Cards list */}
            <div className="col-12 col-lg-5 flex flex-col gap-4">
              {branches.map((branch) => {
                const isActive = activeBranch === branch.id;
                return (
                  <motion.div
                    key={branch.id}
                    onClick={() => setActiveBranch(branch.id)}
                    whileHover={{ scale: 1.01 }}
                    className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 flex gap-4 ${
                      isActive 
                        ? 'border-red-600 bg-red-50/20 shadow-md' 
                        : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-extrabold text-base text-slate-900 m-0">{branch.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {branch.city}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mb-3 leading-relaxed">{branch.address}</p>
                      
                      <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-red-600" />
                          <span>Hotline: <b>{branch.hotline}</b></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-red-600" />
                          <span>Mở cửa: {branch.hours}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Google Map Tab Content */}
            <div className="col-12 col-lg-7">
              <div className="h-[350px] md:h-[450px] bg-slate-100 rounded-3xl overflow-hidden premium-shadow border border-slate-100 relative">
                {branches.map((branch) => {
                  const isActive = activeBranch === branch.id;
                  return (
                    <div 
                      key={branch.id} 
                      className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                        isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      {isActive && (
                        <iframe
                          title={branch.name}
                          src={branch.mapUrl}
                          className="w-full h-full border-0"
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-20 md:py-28 bg-slate-50 border-t border-b border-slate-100">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-red-600 font-bold tracking-widest text-xs uppercase">HỎI ĐÁP</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">Câu Hỏi Thường Gặp</h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white border border-slate-150 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 flex items-center justify-between text-left font-bold text-slate-900 hover:text-red-700 transition-colors focus:outline-none"
                  >
                    <span className="text-sm md:text-base pr-4">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-red-600' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FOOTER CTA */}
      <section className="relative py-20 bg-red-950 text-white text-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900/60 to-red-950 z-0"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl z-0"></div>

        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Truck className="w-8 h-8 text-red-500 animate-bounce-subtle" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              Trải Nghiệm Thịt Nhập Khẩu <br />
              Cao Cấp Ngay Hôm Nay
            </h2>
            <p className="text-red-200 text-sm md:text-base mb-8 leading-relaxed font-light">
              Liên hệ ngay để nhận các chương trình ưu đãi đặc biệt và trải nghiệm dịch vụ giao hàng siêu tốc 2-4h từ Anthony Shop. Miễn phí vận chuyển cho các đơn hàng đạt giá trị tối thiểu.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-red-950 hover:bg-slate-100 font-extrabold px-10 py-4 rounded-xl shadow-2xl transition-all duration-300 transform hover:-translate-y-1 no-underline"
            >
              Xem sản phẩm <ArrowRight className="w-5 h-5 text-red-600" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
