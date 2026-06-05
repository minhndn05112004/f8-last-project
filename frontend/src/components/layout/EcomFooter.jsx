import { Link } from 'react-router-dom'

const EcomFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Info */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 no-underline mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl"><img src="https://cdn-icons-png.flaticon.com/512/6903/6903187.png" alt="logo" /></div>
              <span className="text-xl font-bold tracking-tight text-white">
                Anthony <span className="text-red-600">Shop</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Chuyên cung cấp thịt sạch nhập khẩu quốc tế. Chất lượng hàng đầu, giao hàng tận nơi.
            </p>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white font-bold mb-6">Hỗ trợ khách hàng</h4>
            <ul className="space-y-4 list-none p-0">
              <li><Link to="#" className="text-slate-400 hover:text-white no-underline text-sm transition-colors">Chính sách bảo hành</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-white no-underline text-sm transition-colors">Chính sách đổi trả</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-white no-underline text-sm transition-colors">Vận chuyển</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">Liên hệ</h4>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-700/20 flex items-center justify-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider m-0">Hotline</p>
                <p className="text-white font-bold text-lg m-0">1800 2929</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Anthony Shop. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="#" className="text-slate-500 hover:text-white no-underline">Privacy Policy</Link>
            <Link to="#" className="text-slate-500 hover:text-white no-underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default EcomFooter
