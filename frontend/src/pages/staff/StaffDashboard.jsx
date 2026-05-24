import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/axios';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle, 
  Send, 
  User, 
  LogOut, 
  History, 
  ExternalLink, 
  Shield, 
  Check, 
  Calendar,
  MessageCircle,
  Inbox,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import StaffNewsPage from './StaffNewsPage';
import StaffProductPage from './StaffProductPage';

const StaffDashboard = () => {
  const { user, socket, logout } = useAuth();
  
  // Modules: 'crm' | 'news' | 'products'
  const [currentModule, setCurrentModule] = useState('crm');
  
  // Tabs: 'waiting' | 'active' | 'history'
  const [activeTab, setActiveTab] = useState('active');
  
  // Lists
  const [waitingRequests, setWaitingRequests] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  
  // Selected Support Conversation
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  
  const messagesEndRef = useRef(null);

  // 1. Fetch support data from APIs
  const fetchWaiting = async () => {
    try {
      const res = await api.get('/support/waiting');
      setWaitingRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch waiting requests', err);
    }
  };

  const fetchActive = async () => {
    try {
      const res = await api.get('/support/active');
      setActiveRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch active requests', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/support/history');
      setHistoryRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch support history', err);
    }
  };

  const loadAllLists = () => {
    fetchWaiting();
    fetchActive();
    fetchHistory();
  };

  useEffect(() => {
    loadAllLists();
    
    // Auto-refresh lists every 30 seconds as fallback
    const interval = setInterval(loadAllLists, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch messages for selected ticket
  const fetchMessages = async (ticketId) => {
    setLoadingChat(true);
    try {
      const res = await api.get(`/support/${ticketId}/messages`);
      const { request, messages } = res.data.data;
      setSelectedTicket(request);
      setMessages(messages || []);
    } catch (err) {
      toast.error('Không thể tải lịch sử tin nhắn');
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Scroll to bottom helper
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 3. Socket listeners for real-time CRM updates
  useEffect(() => {
    if (!socket) return;

    // Join staff room
    socket.emit('authenticate', { userId: user.id, role: user.role });

    // Listening for a new support request from any user
    socket.on('new_support_request', (request) => {
      setWaitingRequests(prev => {
        if (prev.find(r => r.id === request.id)) return prev;
        return [request, ...prev];
      });
      toast.success(`Yêu cầu hỗ trợ mới từ ${request.user.fullName}`);
    });

    // Listening when another staff accepts a request
    socket.on('support_request_handled', ({ requestId }) => {
      setWaitingRequests(prev => prev.filter(r => r.id !== requestId));
      fetchActive(); // reload active list in case it's this staff's
    });

    // Listening for changes in ticket status (Completed/Closed)
    socket.on('support_request_status_changed', ({ requestId, status }) => {
      // Remove from active list
      setActiveRequests(prev => prev.filter(r => r.id !== requestId));
      
      // If it is the currently viewed ticket, update its status
      if (selectedTicket && selectedTicket.id === requestId) {
        setSelectedTicket(prev => ({ ...prev, status }));
      }
      
      fetchHistory(); // refresh history tab
    });

    // Real-time message receiver
    socket.on('receive_message', (message) => {
      // Append if it belongs to the selected conversation
      if (selectedTicket && message.supportRequestId === selectedTicket.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
      
      // Also update the updated timestamp/latest message in the active requests list
      setActiveRequests(prev => {
        return prev.map(req => {
          if (req.id === message.supportRequestId) {
            return {
              ...req,
              updatedAt: new Date().toISOString(),
              messages: req.messages ? [...req.messages, message] : [message]
            };
          }
          return req;
        });
      });
    });

    return () => {
      socket.off('new_support_request');
      socket.off('support_request_handled');
      socket.off('support_request_status_changed');
      socket.off('receive_message');
    };
  }, [socket, selectedTicket, user.id, user.role]);

  // Join ticket socket room when selecting
  useEffect(() => {
    if (socket && selectedTicket) {
      socket.emit('request_support', { userId: selectedTicket.userId });
    }
  }, [socket, selectedTicket?.id]);

  // 4. CRM Core Actions
  const handleAccept = async (requestId) => {
    setSubmittingAction(true);
    try {
      const res = await api.post(`/support/${requestId}/accept`);
      toast.success('Đã nhận yêu cầu hỗ trợ');
      await fetchWaiting();
      await fetchActive();
      setActiveTab('active');
      
      // Select the newly accepted ticket
      await fetchMessages(requestId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleComplete = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn thành phiên hỗ trợ này?')) return;
    setSubmittingAction(true);
    try {
      await api.post(`/support/${requestId}/complete`);
      toast.success('Đã hoàn thành phiên hỗ trợ');
      setSelectedTicket(null);
      setMessages([]);
      fetchActive();
      fetchHistory();
    } catch (err) {
      toast.error('Không thể hoàn thành hỗ trợ');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleClose = async (requestId) => {
    if (!window.confirm('Đóng hoàn toàn ticket này? Sẽ không thể mở lại.')) return;
    setSubmittingAction(true);
    try {
      await api.post(`/support/${requestId}/close`);
      toast.success('Đã đóng ticket');
      setSelectedTicket(null);
      setMessages([]);
      fetchActive();
      fetchHistory();
    } catch (err) {
      toast.error('Không thể đóng ticket');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedTicket || selectedTicket.status !== 'ACTIVE') return;

    // Send via socket (for instant realtime sync) and it gets saved immediately
    socket.emit('send_message', {
      requestId: selectedTicket.id,
      senderId: user.id,
      content: inputText.trim()
    });
    
    setInputText('');
  };

  // Helper: Format relative duration
  const getSupportDuration = (start, end) => {
    if (!start || !end) return '';
    const diffMs = new Date(end) - new Date(start);
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    if (diffMins > 0) return `${diffMins} phút ${diffSecs} giây`;
    return `${diffSecs} giây`;
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
      {/* 1. Left Sidebar: Header & Tabs & List */}
      <div className="w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-red-500" size={22} />
              <span className="font-extrabold text-sm tracking-wider text-red-500">SUPPORT CRM</span>
            </div>
            <button 
              onClick={logout} 
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
          
          {/* User profile inside sidebar */}
          <div className="flex items-center gap-3 py-1.5 px-2 bg-slate-900 rounded-xl border border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center font-bold text-xs">
              {user?.fullName[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate leading-none text-slate-100">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.role}</p>
            </div>
            <a 
              href="/" 
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 no-underline transition-all"
            >
              Shop <ExternalLink size={10} />
            </a>
          </div>
          
          {/* Module Navigation Menu */}
          <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-800/60 pt-3">
            <button
              onClick={() => setCurrentModule('crm')}
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                currentModule === 'crm'
                  ? 'bg-red-800 border-red-700 text-white shadow-md'
                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageCircle size={14} />
              <span>Hỗ trợ khách hàng</span>
            </button>
            <button
              onClick={() => setCurrentModule('products')}
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                currentModule === 'products'
                  ? 'bg-red-800 border-red-700 text-white shadow-md'
                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Inbox size={14} />
              <span>Quản lý sản phẩm</span>
            </button>
            <button
              onClick={() => setCurrentModule('news')}
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                currentModule === 'news'
                  ? 'bg-red-800 border-red-700 text-white shadow-md'
                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={14} />
              <span>Quản lý tin tức</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons (Zendesk style) */}
        {currentModule === 'crm' && (
          <div className="grid grid-cols-3 bg-slate-950/60 p-1 border-b border-slate-800 shrink-0 text-center">
            <button
              onClick={() => setActiveTab('waiting')}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                activeTab === 'waiting' 
                  ? 'bg-red-700 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Clock size={16} />
              <span>Đang chờ ({waitingRequests.length})</span>
            </button>
            
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                activeTab === 'active' 
                  ? 'bg-red-700 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare size={16} />
              <span>Hỗ trợ ({activeRequests.length})</span>
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                activeTab === 'history' 
                  ? 'bg-red-700 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <History size={16} />
              <span>Lịch sử ({historyRequests.length})</span>
            </button>
          </div>
        )}

        {/* Dynamic Ticket Queue List */}
        {currentModule === 'crm' ? (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800 bg-slate-950/20">
            
            {activeTab === 'waiting' && (
              waitingRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  Không có cuộc chat nào đang chờ.
                </div>
              ) : (
                waitingRequests.map(req => (
                  <div key={req.id} className="p-4 hover:bg-slate-900/50 transition cursor-pointer flex flex-col gap-2 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 tracking-wider">WAITING</span>
                      <span className="text-[10px] text-slate-500 font-medium">{new Date(req.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                        {req.user.fullName[0]}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-slate-100 truncate">{req.user.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{req.user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(req.id);
                      }}
                      disabled={submittingAction}
                      className="w-full mt-1.5 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-extrabold rounded-lg transition shadow-md"
                    >
                      NHẬN HỖ TRỢ
                    </button>
                  </div>
                ))
              )
            )}

            {activeTab === 'active' && (
              activeRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  Bạn chưa nhận cuộc chat nào.
                </div>
              ) : (
                activeRequests.map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => fetchMessages(req.id)}
                    className={`p-4 hover:bg-slate-900/40 transition cursor-pointer flex flex-col gap-2 ${
                      selectedTicket?.id === req.id ? 'bg-slate-800/80 border-l-4 border-red-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 tracking-wider">ACTIVE</span>
                      <span className="text-[10px] text-slate-500 font-medium">{new Date(req.updatedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                        {req.user.fullName[0]}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="font-bold text-sm text-slate-100 truncate">{req.user.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {req.messages && req.messages.length > 0 
                            ? req.messages[req.messages.length - 1].content 
                            : 'Đã kết nối, đang chat...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'history' && (
              historyRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  Không có lịch sử lưu trữ.
                </div>
              ) : (
                historyRequests.map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => fetchMessages(req.id)}
                    className={`p-4 hover:bg-slate-900/40 transition cursor-pointer flex flex-col gap-2 ${
                      selectedTicket?.id === req.id ? 'bg-slate-800/80 border-l-4 border-red-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wider ${
                        req.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600/30 text-slate-400'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(req.closedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                        {req.user.fullName[0]}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="font-bold text-sm text-slate-100 truncate">{req.user.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate">Staff: {req.assignedStaff?.fullName || 'Không rõ'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/40 mt-1">
                      <span>{req._count?.messages || 0} tin nhắn</span>
                      <span className="italic truncate">{getSupportDuration(req.acceptedAt || req.createdAt, req.closedAt)}</span>
                    </div>
                  </div>
                ))
              )
            )}

          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-950/20 text-slate-400 p-5 text-xs leading-relaxed border-t border-slate-800/40 space-y-4">
            {currentModule === 'products' ? (
              <>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <h4 className="font-extrabold text-slate-200 mb-2 text-[11px] uppercase tracking-wider">Quản lý sản phẩm</h4>
                  <p>
                    Xem danh sách, cập nhật thông tin sản phẩm, giá cả, và quản lý các thẻ phân loại của thịt/thực phẩm nhập khẩu.
                  </p>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <h4 className="font-extrabold text-slate-200 mb-2 text-[11px] uppercase tracking-wider">Hướng dẫn</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Nhập đầy đủ SKU và Slug hợp lệ</li>
                    <li>Thêm nhãn (Tags) để tối ưu tìm kiếm</li>
                    <li>Kiểm tra số lượng tồn kho định kỳ</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <h4 className="font-extrabold text-slate-200 mb-2 text-[11px] uppercase tracking-wider">Tin tức & Cẩm nang</h4>
                  <p>
                    Tại đây bạn có thể soạn thảo, xuất bản và cập nhật các bài đăng chia sẻ kinh nghiệm ẩm thực, chế biến thịt nhập khẩu.
                  </p>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <h4 className="font-extrabold text-slate-200 mb-2 text-[11px] uppercase tracking-wider">Gợi ý viết bài</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Mẹo rã đông thịt đúng cách</li>
                    <li>Cách làm bít tết chuẩn Âu</li>
                    <li>Phân biệt các loại bò Wagyu</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Middle/Right Area: Conversational Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f1f5f9]">
        {currentModule === 'news' ? (
          <StaffNewsPage />
        ) : currentModule === 'products' ? (
          <StaffProductPage />
        ) : selectedTicket ? (
          <>
            {/* Active conversation Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-extrabold border border-red-200">
                  {selectedTicket.user.fullName[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">{selectedTicket.user.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedTicket.status === 'ACTIVE' 
                        ? 'bg-green-500 animate-pulse' 
                        : selectedTicket.status === 'COMPLETED' 
                          ? 'bg-blue-500' 
                          : 'bg-slate-400'
                    }`} />
                    <span className={`text-xs font-bold ${
                      selectedTicket.status === 'ACTIVE' 
                        ? 'text-green-600' 
                        : selectedTicket.status === 'COMPLETED' 
                          ? 'text-blue-600' 
                          : 'text-slate-500'
                    }`}>
                      {selectedTicket.status === 'ACTIVE' 
                        ? 'Đang hỗ trợ trực tiếp' 
                        : selectedTicket.status === 'COMPLETED' 
                          ? 'Hỗ trợ đã hoàn thành' 
                          : 'Hỗ trợ đã đóng hoàn toàn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons based on status */}
              <div className="flex gap-2">
                {selectedTicket.status === 'ACTIVE' && (
                  <>
                    <button 
                      onClick={() => handleComplete(selectedTicket.id)}
                      disabled={submittingAction}
                      className="px-4 py-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition shadow-md flex items-center gap-1.5"
                    >
                      <Check size={14} /> HOÀN THÀNH
                    </button>
                    <button 
                      onClick={() => handleClose(selectedTicket.id)}
                      disabled={submittingAction}
                      className="px-4 py-2 text-xs font-extrabold bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
                    >
                      ĐÓNG TICKET
                    </button>
                  </>
                )}
                
                {selectedTicket.status === 'COMPLETED' && (
                  <button 
                    onClick={() => handleClose(selectedTicket.id)}
                    disabled={submittingAction}
                    className="px-4 py-2 text-xs font-extrabold bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
                  >
                    LƯU TRỮ & ĐÓNG HOÀN TOÀN
                  </button>
                )}
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50">
              
              {/* Support request ticket info banner */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200/80 max-w-xl mx-auto text-center flex flex-col gap-1.5 shadow-sm">
                <Calendar size={20} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phiên Hỗ Trợ #{selectedTicket.id}</p>
                <p className="text-xs text-slate-500 leading-normal">
                  Yêu cầu bắt đầu vào {new Date(selectedTicket.createdAt).toLocaleString()}
                  {selectedTicket.acceptedAt && ` và được nhận lúc ${new Date(selectedTicket.acceptedAt).toLocaleTimeString()}`}
                </p>
                {selectedTicket.closedAt && (
                  <div className="text-[10px] text-blue-600 font-extrabold bg-blue-50 py-1.5 px-3 rounded-lg w-max mx-auto border border-blue-200/40">
                    KẾT THÚC: {new Date(selectedTicket.closedAt).toLocaleString()} ({getSupportDuration(selectedTicket.acceptedAt || selectedTicket.createdAt, selectedTicket.closedAt)})
                  </div>
                )}
              </div>

              {loadingChat ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700" />
                </div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic text-sm">
                  Chưa có tin nhắn nào trong phiên này.
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      {/* Name of sender above message if from user/other staff */}
                      {msg.senderId !== user.id && (
                        <span className="text-[10px] text-slate-400 font-bold ml-3 mb-0.5">
                          {msg.sender.fullName} ({msg.sender.role})
                        </span>
                      )}
                      
                      <div className={`p-3 rounded-2xl shadow-sm leading-relaxed text-sm ${
                        msg.senderId === user.id 
                          ? 'bg-red-700 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                      }`}>
                        <p>{msg.content}</p>
                        <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-white/10">
                          <span className={`text-[9px] ${msg.senderId === user.id ? 'text-red-200/80' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.senderId === user.id && <Check size={10} className="text-red-200" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Message Area */}
            {selectedTicket.status === 'ACTIVE' ? (
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3 shadow-inner shrink-0">
                <input
                  type="text"
                  placeholder="Nhập câu trả lời hỗ trợ khách hàng..."
                  className="flex-1 px-5 py-3.5 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white border border-slate-200 text-sm font-medium transition-all"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="px-5 bg-red-700 text-white font-extrabold rounded-xl flex items-center justify-center hover:bg-red-800 disabled:opacity-50 transition shadow-md"
                >
                  <Send size={16} className="mr-1.5" /> Gửi
                </button>
              </form>
            ) : (
              <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 font-bold shrink-0">
                Phiên hỗ trợ này đã hoàn thành hoặc lưu trữ. Bạn không thể gửi thêm tin nhắn.
              </div>
            )}
          </>
        ) : (
          /* Empty CRM State Dashboard */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white p-8">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm mb-4">
              <Inbox size={32} />
            </div>
            
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Hộp Thư Hỗ Trợ CRM</h2>
            <p className="text-sm text-slate-500 text-center max-w-sm mt-2 leading-relaxed">
              Chào mừng bạn đến với hệ thống CRM Ticket. Chọn cuộc trò chuyện bên cột trái để xử lý sự cố của khách hàng.
            </p>
            
            {/* Quick stats board inside empty state */}
            <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-md bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 shadow-sm text-center">
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Đang chờ</p>
                <p className="text-2xl font-black text-slate-950 mt-1">{waitingRequests.length}</p>
              </div>
              <div className="border-x border-slate-200/80">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hỗ trợ</p>
                <p className="text-2xl font-black text-slate-950 mt-1">{activeRequests.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Lịch sử</p>
                <p className="text-2xl font-black text-slate-950 mt-1">{historyRequests.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
