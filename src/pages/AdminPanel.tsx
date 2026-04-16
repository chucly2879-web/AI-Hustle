import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  LayoutDashboard, 
  Mail, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  ChevronRight,
  Download,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { runCustomPrompt } from '../services/gemini';

type Tab = 'overview' | 'users' | 'subscribers' | 'blog';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    tag: 'Kinh nghiệm',
    content: '',
    date: new Date().toLocaleDateString('vi-VN')
  });
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Admin Dashboard | AI Hustle";

    // Check if user is admin
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user || (user.email !== 'tranbaosadec@gmail.com' && user.email !== 'admin@ai-hustle-phi.vercel.app' && user.email !== 'chucly2879@gmail.com')) {
        navigate('/dang-nhap-admin');
      }
    });

    // Fetch Users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Subscribers
    const qSubscribers = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'));
    const unsubscribeSubscribers = onSnapshot(qSubscribers, (snapshot) => {
      setSubscribers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Blog Posts
    const qBlog = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
    const unsubscribeBlog = onSnapshot(qBlog, (snapshot) => {
      setBlogPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeSubscribers();
      unsubscribeBlog();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteBlogPost = async (postId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await deleteDoc(doc(db, 'blog_posts', postId));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await updateDoc(doc(db, 'blog_posts', editingPost.id), {
          ...blogFormData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'blog_posts'), {
          ...blogFormData,
          createdAt: serverTimestamp()
        });
      }
      setShowBlogModal(false);
      setEditingPost(null);
      setBlogFormData({
        title: '',
        tag: 'Kinh nghiệm',
        content: '',
        date: new Date().toLocaleDateString('vi-VN')
      });
    } catch (error) {
      console.error("Error saving blog post:", error);
    }
  };

  const openEditModal = (post: any) => {
    setEditingPost(post);
    setBlogFormData({
      title: post.title,
      tag: post.tag,
      content: post.content,
      date: post.date
    });
    setShowBlogModal(true);
  };

  const handleAiGenerateBlog = async () => {
    if (!blogFormData.title) {
      alert('Vui lòng nhập tiêu đề để AI có cơ sở tạo nội dung!');
      return;
    }
    setIsAiGenerating(true);
    try {
      const prompt = `Bạn là một blogger chuyên nghiệp về công nghệ và AI. 
      Hãy viết một bài blog cực kỳ chuyên sâu, hấp dẫn và chuẩn SEO cho tiêu đề: "${blogFormData.title}". 
      
      Yêu cầu:
      1. Ngôn ngữ: Tiếng Việt.
      2. Định dạng: Markdown (dùng H2, H3, bôi đậm, danh sách).
      3. Cấu trúc bài viết:
         - Mở đầu thu hút.
         - Ít nhất 3 mục chính giải thích chi tiết.
         - Các ví dụ thực tế hoặc danh sách công cụ gợi ý.
         - Kết luận và lời khuyên.
      4. Độ dài: Ít nhất 500 từ.`;
      
      const result = await runCustomPrompt(prompt);
      setBlogFormData(prev => ({ ...prev, content: result }));
    } catch (error) {
      console.error(error);
      alert('Lỗi khi tạo nội dung với AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiSuggestTitle = async () => {
    setIsAiGenerating(true);
    try {
      const prompt = `Hãy gợi ý 5 tiêu đề bài viết blog cực kỳ thu hút (clickbait nhưng giá trị) về chủ đề AI, Kiếm tiền online và Tự động hóa doanh nghiệp trong năm 2024. Chỉ trả về danh sách các tiêu đề, con số đầu dòng.`;
      const result = await runCustomPrompt(prompt);
      alert("Gợi ý từ AI:\n\n" + result);
    } catch (error) {
      alert('Lỗi khi gợi ý tiêu đề.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const exportSubscribers = () => {
    const headers = ['Họ Tên', 'Email', 'Ngày Đăng Ký'];
    const csvData = subscribers.map(sub => [
      sub.fullName,
      sub.email,
      sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleString() : sub.createdAt
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const migrateHardcodedPosts = async () => {
    const BLOG_POSTS = [
      { 
        title: 'Cách tôi viết 10 bài blog/ngày với AI', 
        date: '13/04/2024', 
        tag: 'Content',
        content: `
# Cách tôi viết 10 bài blog/ngày với AI

Bạn đang tốn cả ngày trời chỉ để hoàn thành một bài viết? Với sự hỗ trợ của AI, một Freelancer có thể sản xuất 10 bài blog chất lượng cao mỗi ngày mà vẫn đảm bảo chuẩn SEO và giá trị cho người đọc.

## 1. Thay đổi tư duy: AI là "Trợ lý", bạn là "Tổng biên tập"
Sai lầm lớn nhất của nhiều người là copy-paste hoàn toàn nội dung từ AI. Để bài viết có thứ hạng cao trên Google, bạn cần đóng vai trò là người định hướng, kiểm soát chất lượng và thêm vào "chất riêng" mà AI không có.

## 2. Quy trình 5 bước viết bài thần tốc

### Bước 1: Nghiên cứu từ khóa và lập kế hoạch (5 phút)
Thay vì ngồi nghĩ, hãy yêu cầu AI tìm các chủ đề ngách đang có xu hướng nhưng ít cạnh tranh.

### Bước 2: Xây dựng cấu trúc bài viết (Outline) chuyên sâu (5 phút)
Một cấu trúc tốt là 50% sự thành công. Đừng chỉ yêu cầu AI "viết bài", hãy yêu cầu nó "lập dàn ý".

### Bước 3: Viết từng phần với các Prompt chuyên biệt (15 phút)
Đừng bắt AI viết cả bài một lúc vì nội dung sẽ bị nông. Hãy bắt nó viết từng mục trong dàn ý.

### Bước 4: "Nhân bản hóa" và Kiểm tra sự thật (10 phút)
Thêm các câu chuyện cá nhân hoặc trải nghiệm thực tế của bạn. Kiểm tra lại các số liệu, dẫn chứng mà AI đưa ra.

### Bước 5: Tối ưu SEO On-page và Hình ảnh (5 phút)
Dùng AI để viết Meta Description và tiêu đề thu hút.

## 3. Kết luận
Việc viết 10 bài/ngày không khó nếu bạn làm chủ được quy trình. Hãy thử áp dụng ngay hôm nay!
        `
      },
      { 
        title: 'Top 5 công cụ AI cho người bán hàng Shopee', 
        date: '12/04/2024', 
        tag: 'E-commerce',
        content: `
# Top 5 công cụ AI cho người bán hàng Shopee

Kinh doanh trên Shopee ngày càng cạnh tranh. Dưới đây là 5 công cụ AI giúp bạn tối ưu gian hàng và tăng doanh số hiệu quả.

1. **ChatGPT/Gemini:** Viết mô tả sản phẩm chuẩn SEO và trả lời tin nhắn khách hàng.
2. **Canva Magic Studio:** Thiết kế ảnh bìa sản phẩm chuyên nghiệp chỉ trong vài giây.
3. **Midjourney:** Tạo ảnh mẫu (model) mặc quần áo hoặc sử dụng sản phẩm mà không cần thuê studio.
4. **CapCut AI:** Tự động tạo video giới thiệu sản phẩm từ hình ảnh có sẵn.
5. **Shopee Analytics Tools:** Phân tích từ khóa và đối thủ cạnh tranh bằng AI.

Sử dụng bộ công cụ này sẽ giúp bạn tiết kiệm 80% thời gian vận hành gian hàng.
        `
      },
      { 
        title: 'Hướng dẫn kiếm tiền từ Affiliate bằng AI', 
        date: '10/04/2024', 
        tag: 'Marketing',
        content: `
# Hướng dẫn kiếm tiền từ Affiliate bằng AI

Tiếp thị liên kết (Affiliate Marketing) là cách tuyệt vời để tạo thu nhập thụ động. AI giúp bạn làm điều này dễ dàng hơn bao giờ hết.

## Các bước thực hiện:
1. **Chọn ngách sản phẩm:** Sử dụng AI để nghiên cứu các ngách tiềm năng.
2. **Tạo nội dung review:** Dùng AI viết bài đánh giá hoặc kịch bản video review sản phẩm.
3. **Xây dựng kênh phân phối:** Sử dụng AI để quản lý Fanpage hoặc kênh TikTok tự động.
4. **Tối ưu hóa chuyển đổi:** Thử nghiệm các tiêu đề và lời kêu gọi hành động (CTA) khác nhau bằng AI.

Bắt đầu ngay hôm nay với một ngách nhỏ và kiên trì tối ưu hóa nội dung của bạn!
        `
      },
    ];

    try {
      for (const post of BLOG_POSTS) {
        await addDoc(collection(db, 'blog_posts'), {
          ...post,
          createdAt: serverTimestamp()
        });
      }
      alert('Đã nhập 3 bài viết mẫu vào database thành công!');
    } catch (error) {
      console.error("Error migrating posts:", error);
      alert('Lỗi khi nhập bài viết.');
    }
  };

  const stats = [
    { label: 'Tổng người dùng', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Đăng ký Ebook', value: subscribers.length, icon: Mail, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Bài viết Blog', value: blogPosts.length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-none">AI Hustle</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink 
            icon={LayoutDashboard} 
            label="Tổng quan" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarLink 
            icon={Users} 
            label="Người dùng" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <SidebarLink 
            icon={Mail} 
            label="Subscribers" 
            active={activeTab === 'subscribers'} 
            onClick={() => setActiveTab('subscribers')} 
          />
          <SidebarLink 
            icon={FileText} 
            label="Bài viết Blog" 
            active={activeTab === 'blog'} 
            onClick={() => setActiveTab('blog')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Về trang chủ</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 capitalize">
              {activeTab === 'overview' ? 'Tổng quan hệ thống' : 
               activeTab === 'users' ? 'Quản lý người dùng' : 
               activeTab === 'subscribers' ? 'Danh sách đăng ký' : 'Quản lý Blog'}
            </h2>
            <p className="text-gray-500 font-medium">Chào mừng trở lại, Quản trị viên</p>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'subscribers' && (
              <button 
                onClick={exportSubscribers}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                <Download className="w-4 h-4" /> Xuất CSV
              </button>
            )}
            {activeTab === 'blog' && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={migrateHardcodedPosts}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  <Download className="w-4 h-4" /> Nhập bài mẫu
                </button>
                <button 
                  onClick={() => {
                    setEditingPost(null);
                    setBlogFormData({
                      title: '',
                      tag: 'Kinh nghiệm',
                      content: '',
                      date: new Date().toLocaleDateString('vi-VN')
                    });
                    setShowBlogModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                >
                  <Plus className="w-4 h-4" /> Viết bài mới
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.bg)}>
                          <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Users */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h4 className="font-black text-gray-900">Người dùng mới nhất</h4>
                        <button onClick={() => setActiveTab('users')} className="text-orange-500 text-xs font-bold hover:underline">Xem tất cả</button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                                {user.displayName?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900">{user.displayName || 'Người dùng'}</p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                              </div>
                            </div>
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                              user.role === 'pro' ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                            )}>
                              {user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Subscribers */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h4 className="font-black text-gray-900">Đăng ký mới nhất</h4>
                        <button onClick={() => setActiveTab('subscribers')} className="text-orange-500 text-xs font-bold hover:underline">Xem tất cả</button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {subscribers.slice(0, 5).map((sub) => (
                          <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center font-bold text-orange-500">
                                <Mail className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900">{sub.fullName}</p>
                                <p className="text-xs text-gray-400">{sub.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : 'Vừa xong'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm người dùng..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                        <Filter className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50">
                          <th className="px-6 py-4">Người dùng</th>
                          <th className="px-6 py-4">Vai trò</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4">Ngày tham gia</th>
                          <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                                  {user.displayName?.[0] || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-gray-900">{user.displayName || 'Người dùng'}</p>
                                  <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                value={user.role}
                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'banned' : 'active')}
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                  user.status === 'active' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                )}
                              >
                                {user.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {user.status}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400">
                              {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : '---'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'subscribers' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50">
                    <div className="relative max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50">
                          <th className="px-6 py-4">Họ Tên</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Ngày Đăng Ký</th>
                          <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {subscribers.filter(s => s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.fullName.toLowerCase().includes(searchQuery.toLowerCase())).map((sub) => (
                          <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-sm text-gray-900">{sub.fullName}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{sub.email}</td>
                            <td className="px-6 py-4 text-xs text-gray-400">
                              {sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleString() : '---'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'blog' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        <img 
                          src={`https://picsum.photos/seed/${post.id}/800/450`} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-orange-500">
                            {post.tag}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-black text-gray-900 mb-2 line-clamp-2">{post.title}</h4>
                        <p className="text-xs text-gray-400 mb-6">{post.date}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditModal(post)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteBlogPost(post.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <button className="text-orange-500 text-xs font-bold flex items-center gap-1 hover:underline">
                            Xem bài <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blog Post Modal */}
        <AnimatePresence>
          {showBlogModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold text-xl">{editingPost ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h3>
                  <button 
                    onClick={() => setShowBlogModal(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleBlogSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700">Tiêu đề bài viết</label>
                        <button 
                          type="button"
                          onClick={handleAiSuggestTitle}
                          className="text-[10px] font-bold text-orange-500 hover:underline"
                        >
                          Gợi ý tiêu đề AI
                        </button>
                      </div>
                      <input 
                        required
                        type="text" 
                        value={blogFormData.title}
                        onChange={(e) => setBlogFormData({...blogFormData, title: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        placeholder="Nhập tiêu đề..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Chủ đề (Tag)</label>
                      <select 
                        value={blogFormData.tag}
                        onChange={(e) => setBlogFormData({...blogFormData, tag: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      >
                        <option value="Content">Content</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Video">Video</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="SEO">SEO</option>
                        <option value="Kinh nghiệm">Kinh nghiệm</option>
                        <option value="Công cụ">Công cụ</option>
                        <option value="Hướng dẫn">Hướng dẫn</option>
                        <option value="Xu hướng">Xu hướng</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Nội dung (Markdown)</label>
                      <button 
                        type="button"
                        onClick={handleAiGenerateBlog}
                        disabled={isAiGenerating}
                        className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-all disabled:opacity-50"
                      >
                        {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Tạo nội dung với AI
                      </button>
                    </div>
                    <textarea 
                      required
                      rows={12}
                      value={blogFormData.content}
                      onChange={(e) => setBlogFormData({...blogFormData, content: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono text-sm"
                      placeholder="# Tiêu đề bài viết..."
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowBlogModal(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                    >
                      {editingPost ? 'Cập nhật bài viết' : 'Đăng bài viết'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
        active 
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}
