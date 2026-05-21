import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Eye, ThumbsUp, ThumbsDown, MessageSquare, Trash2, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/axios';

const NewsDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [myReaction, setMyReaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  const fetchArticleAndComments = async () => {
    setLoading(true);
    try {
      // Get article details
      const artRes = await api.get(`/news/${slug}`);
      const artData = artRes.data.data;
      setArticle(artData);

      // Get comments
      const commRes = await api.get(`/news/${artData.id}/comments`);
      setComments(commRes.data.data);

      // If user logged in, get their reaction
      if (user) {
        try {
          const reactRes = await api.get(`/news/${artData.id}/my-reaction`);
          setMyReaction(reactRes.data.data.userReaction);
        } catch (e) {
          console.error('Failed to fetch my reaction:', e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch article details:', err);
      toast.error('Không tìm thấy bài viết hoặc bài viết chưa được công bố');
      navigate('/news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticleAndComments();
  }, [slug, user]);

  const handleReact = async (type) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thực hiện bình chọn!');
      navigate('/login', { state: { from: `/news/${slug}` } });
      return;
    }

    try {
      const res = await api.post(`/news/${article.id}/react`, { type });
      const { likes, dislikes, userReaction } = res.data.data;
      setArticle((prev) => ({ ...prev, likes, dislikes }));
      setMyReaction(userReaction);
      
      if (res.data.data.action === 'added') {
        toast.success(type === 'LIKE' ? 'Đã thích bài viết!' : 'Đã không thích bài viết!');
      } else if (res.data.data.action === 'updated') {
        toast.success(type === 'LIKE' ? 'Đã đổi thành Thích!' : 'Đã đổi thành Không thích!');
      } else {
        toast.success('Đã hủy tương tác!');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi gửi tương tác');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận!');
      return;
    }
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/news/${article.id}/comments`, { content: commentText.trim() });
      setComments((prev) => [res.data.data, ...prev]);
      setCommentText('');
      // Update article comment count locally
      setArticle((prev) => ({ ...prev, _count: { ...prev._count, comments: (prev._count?.comments || 0) + 1 } }));
      toast.success('Đăng bình luận thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đăng bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      // Update article comment count locally
      setArticle((prev) => ({ ...prev, _count: { ...prev._count, comments: Math.max(0, (prev._count?.comments || 1) - 1) } }));
      toast.success('Đã xóa bình luận');
    } catch (err) {
      toast.error('Không thể xóa bình luận này');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to render content with line breaks properly formatted as premium spacing
  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;
      // Basic markdown headers check
      if (trimmed.startsWith('###')) {
        return <h4 key={index} className="text-xl font-bold text-white mt-8 mb-4 border-l-4 border-red-600 pl-3">{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={index} className="text-2xl font-black text-white mt-10 mb-4 tracking-tight">{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={index} className="text-3xl font-black text-white mt-12 mb-6 tracking-tight">{trimmed.replace('#', '').trim()}</h2>;
      }
      // Check for bullet list
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <li key={index} className="text-slate-300 ml-6 list-disc mb-2 text-base md:text-lg leading-relaxed">{trimmed.substring(1).trim()}</li>;
      }
      return <p key={index} className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 font-normal">{trimmed}</p>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center py-20 pt-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mb-4"></div>
        <p className="text-slate-400 text-sm">Đang tải bài viết...</p>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold text-sm mb-8 no-underline transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Quay lại danh sách tin tức
        </Link>

        {/* Article Banner */}
        <div className="relative rounded-3xl overflow-hidden mb-10 h-64 md:h-[420px] bg-slate-900 border border-slate-800/80 shadow-2xl">
          <img
            src={
              article.thumbnail
                ? (article.thumbnail.startsWith('http') ? article.thumbnail : `http://localhost:5000${article.thumbnail}`)
                : 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop'
            }
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          {/* Header Info Overlaid on banner bottom for premium look */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10 bg-gradient-to-t from-slate-950 to-transparent">
            <span className="text-red-500 font-extrabold tracking-widest text-[11px] uppercase bg-red-950/70 border border-red-900/60 px-3.5 py-1 rounded-full mb-3 inline-block">
              Premium Meat Knowledge
            </span>
            <h1 className="text-2xl md:text-4xl font-black mb-4 tracking-tight leading-tight text-white drop-shadow-md">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-800 border border-red-700 flex items-center justify-center font-bold text-[10px] text-white">
                  {article.createdBy?.fullName?.[0] || 'A'}
                </div>
                <span className="font-bold text-slate-200">{article.createdBy?.fullName || 'Tác giả'}</span>
              </div>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-4 h-4 text-red-600" />
                {formatDate(article.createdAt)}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Eye className="w-4 h-4 text-red-600" />
                {article.views} lượt xem
              </span>
            </div>
          </div>
        </div>

        {/* Article Excerpt */}
        {article.excerpt && (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 border-l-4 border-l-red-700 italic text-slate-300 text-base md:text-lg mb-10 leading-relaxed">
            {article.excerpt}
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-invert max-w-none mb-16 text-slate-300 text-justify">
          {renderContent(article.content)}
        </div>

        {/* Reaction Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 border-y border-slate-800/80 mb-12 gap-4">
          <div>
            <h4 className="font-bold text-base text-slate-200">Bạn thấy bài viết này hữu ích chứ?</h4>
            <p className="text-xs text-slate-500 mt-1">Hãy để lại đánh giá của bạn cho bài viết này nhé.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleReact('LIKE')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                myReaction === 'LIKE'
                  ? 'bg-red-800 border-red-700 text-white shadow-lg shadow-red-950/40 scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-red-900/40'
              }`}
            >
              <ThumbsUp className="w-4.5 h-4.5" />
              <span>Thích ({article.likes || 0})</span>
            </button>

            <button
              onClick={() => handleReact('DISLIKE')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                myReaction === 'DISLIKE'
                  ? 'bg-slate-800 border-slate-700 text-white scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-red-900/40'
              }`}
            >
              <ThumbsDown className="w-4.5 h-4.5" />
              <span>Không thích ({article.dislikes || 0})</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 md:p-8">
          <div className="flex items-center gap-3.5 mb-8">
            <MessageSquare className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-black text-white">
              Bình luận ({article._count?.comments || 0})
            </h3>
          </div>

          {/* Comment Form */}
          <div className="mb-10">
            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center font-bold text-sm text-white shrink-0">
                  {user.fullName?.[0] || 'U'}
                </div>
                
                {/* Inputs */}
                <div className="flex-1 flex flex-col gap-3">
                  <textarea
                    rows="3"
                    placeholder="Chia sẻ ý kiến của bạn về bài viết này..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all resize-none"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-950/40"
                    >
                      <Send className="w-4 h-4" />
                      {submittingComment ? 'Đang gửi...' : 'Đăng bình luận'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-slate-950/60 rounded-2xl p-6 text-center border border-slate-850">
                <p className="text-sm text-slate-400 mb-4">
                  Bạn cần đăng nhập tài khoản để có thể bình luận bài viết này.
                </p>
                <Link
                  to="/login"
                  state={{ from: `/news/${slug}` }}
                  className="inline-block bg-red-800 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm no-underline transition-colors"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-6 divide-y divide-slate-850">
            {comments.length === 0 ? (
              <p className="text-center text-slate-500 italic py-6 text-sm">
                Chưa có bình luận nào cho bài viết này. Hãy là người đầu tiên nêu ý kiến nhé!
              </p>
            ) : (
              comments.map((comment, index) => {
                const isCommentOwner = user && comment.userId === user.id;
                const canDelete = isCommentOwner || (user && ['ADMIN', 'STAFF'].includes(user.role));

                return (
                  <div key={comment.id} className={`flex gap-4 pt-6 ${index === 0 ? 'pt-0 border-t-0' : ''}`}>
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 shrink-0 overflow-hidden">
                      {comment.user?.avatar ? (
                        <img src={comment.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        comment.user?.fullName?.[0] || 'U'
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <div>
                          <span className="font-bold text-sm text-slate-200">
                            {comment.user?.fullName || 'Người dùng'}
                          </span>
                          {/* Role tag if STAFF/ADMIN */}
                          {['ADMIN', 'STAFF'].includes(comment.user?.role) && (
                            <span className="text-[10px] bg-red-950/60 border border-red-900/60 text-red-500 font-extrabold px-2 py-0.5 rounded ml-2 uppercase tracking-wider">
                              {comment.user?.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>

                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line text-justify">
                        {comment.content}
                      </p>
                    </div>

                    {/* Actions */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-slate-500 hover:text-red-500 p-1.5 rounded-lg transition-colors align-self-start mt-0.5 shrink-0"
                        title="Xóa bình luận"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;
