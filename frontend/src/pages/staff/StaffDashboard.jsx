import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Users, Clock, CheckCircle, Send, User, LogOut } from 'lucide-react';

const StaffDashboard = () => {
  const { user, socket, logout } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!socket) return;

    console.log('🔌 StaffDashboard: Socket connected, setting up listeners');

    // Get initial pending requests
    const fetchPending = () => {
      console.log('📡 Fetching pending requests...');
      socket.emit('get_pending_requests');
    };

    fetchPending();

    socket.on('connect', () => {
      console.log('🔌 Socket reconnected, fetching pending...');
      fetchPending();
    });

    socket.on('pending_requests', (requests) => {
      console.log('📦 Received pending requests:', requests.length);
      setPendingRequests(requests);
    });

    socket.on('new_support_request', (request) => {
      console.log('🔔 New support request received:', request);
      setPendingRequests(prev => {
        if (prev.find(r => r.id === request.id)) return prev;
        return [request, ...prev];
      });
      // Try to show notification
      if (Notification.permission === 'granted') {
        new Notification('Yêu cầu hỗ trợ mới!', { body: `Khách hàng ${request.user.fullName} đang chờ.` });
      }
    });

    socket.on('support_request_handled', ({ requestId }) => {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    });

    socket.on('receive_message', (message) => {
      if (activeRequest && message.supportRequestId === activeRequest.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('support_request_accepted', (request) => {
      if (request.assignedStaffId === user.id) {
        setActiveRequest(request);
        setMessages(request.messages || []);
      }
    });

    return () => {
      socket.off('pending_requests');
      socket.off('new_support_request');
      socket.off('support_request_handled');
      socket.off('receive_message');
      socket.off('support_request_accepted');
    };
  }, [socket, activeRequest, user.id]);

  const handleAccept = (requestId) => {
    socket.emit('accept_support_request', { requestId, staffId: user.id });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRequest) return;

    socket.emit('send_message', {
      requestId: activeRequest.id,
      senderId: user.id,
      content: inputText
    });
    setInputText('');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100">
      {/* Sidebar: Support Queue */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-red-800 text-white flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <Clock size={18} /> Đang chờ ({pendingRequests.length})
          </h2>
          <button onClick={logout} title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400 italic">
              Không có yêu cầu nào
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="p-4 border-b hover:bg-gray-50 transition cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                      {req.user.fullName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{req.user.fullName}</p>
                      <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleAccept(req.id)}
                  className="w-full mt-2 py-2 bg-red-700 text-white text-sm font-bold rounded hover:bg-red-800 transition"
                >
                  CHẤP NHẬN
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRequest ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  {activeRequest.user.fullName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{activeRequest.user.fullName}</h3>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Đang hỗ trợ
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  socket.emit('close_support_request', { requestId: activeRequest.id });
                  setActiveRequest(null);
                }}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-600 border rounded-lg hover:border-red-200 transition"
              >
                KẾT THÚC
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f0f2f5]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                    msg.senderId === user.id 
                      ? 'bg-red-700 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderId === user.id ? 'text-red-100' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-3">
              <input
                type="text"
                placeholder="Nhập nội dung tin nhắn..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 border-none"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className="w-12 h-12 rounded-full bg-red-700 text-white flex items-center justify-center hover:bg-red-800 transition shadow-lg">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-medium">Chọn một yêu cầu để bắt đầu hỗ trợ</p>
            <p className="text-sm mt-2">Các tin nhắn mới sẽ xuất hiện ở cột bên trái</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
