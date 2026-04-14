import React, { useState } from 'react';
import { 
  Sparkles, 
  PenTool, 
  Palette, 
  Code2, 
  Languages, 
  Briefcase, 
  ArrowRight, 
  Zap, 
  TrendingUp,
  Search,
  Loader2,
  CheckCircle2,
  BookOpen,
  Terminal,
  ShoppingBag,
  Star,
  MessageCircle,
  MessageSquare,
  Facebook,
  X,
  ChevronLeft,
  Share2,
  Twitter,
  Linkedin,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { generateSideHustleIdea } from './services/gemini';

interface SideHustle {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  potential: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất Cao';
  tools: string[];
}

const SIDE_HUSTLES: SideHustle[] = [
  {
    id: 'content',
    title: 'Viết nội dung (Content)',
    description: 'Sử dụng AI để viết blog, kịch bản video, bài đăng mạng xã hội hoặc sách điện tử.',
    icon: <PenTool className="w-6 h-6" />,
    difficulty: 'Dễ',
    potential: 'Trung bình',
    tools: ['ChatGPT', 'Claude', 'Jasper']
  },
  {
    id: 'art',
    title: 'Nghệ thuật & Thiết kế',
    description: 'Tạo logo, minh họa sách, hoặc bán các tác phẩm nghệ thuật kỹ thuật số được tạo bởi AI.',
    icon: <Palette className="w-6 h-6" />,
    difficulty: 'Trung bình',
    potential: 'Cao',
    tools: ['Midjourney', 'DALL-E 3', 'Canva Magic']
  },
  {
    id: 'coding',
    title: 'Lập trình & Công cụ',
    description: 'Xây dựng các tiện ích mở rộng trình duyệt hoặc ứng dụng nhỏ giải quyết vấn đề cụ thể.',
    icon: <Code2 className="w-6 h-6" />,
    difficulty: 'Khó',
    potential: 'Rất Cao',
    tools: ['Cursor', 'GitHub Copilot', 'v0.dev']
  },
  {
    id: 'translation',
    title: 'Dịch thuật chuyên sâu',
    description: 'Cung cấp dịch vụ dịch thuật và bản địa hóa nhanh chóng với độ chính xác cao nhờ AI.',
    icon: <Languages className="w-6 h-6" />,
    difficulty: 'Dễ',
    potential: 'Trung bình',
    tools: ['DeepL', 'Google Translate AI', 'ChatGPT']
  },
  {
    id: 'consulting',
    title: 'Tư vấn giải pháp AI',
    description: 'Giúp các doanh nghiệp nhỏ tự động hóa quy trình bằng các công cụ AI hiện có.',
    icon: <Briefcase className="w-6 h-6" />,
    difficulty: 'Trung bình',
    potential: 'Cao',
    tools: ['Make.com', 'Zapier', 'OpenAI API']
  },
  {
    id: 'ecommerce-seo',
    title: 'Tối ưu SEO TMĐT',
    description: 'Sử dụng AI để viết tiêu đề, mô tả và tối ưu từ khóa giúp sản phẩm đứng top Shopee/Lazada.',
    icon: <ShoppingBag className="w-6 h-6" />,
    difficulty: 'Dễ',
    potential: 'Cao',
    tools: ['ChatGPT', 'Shopee Analytics', 'KeywordTool.io']
  },
  {
    id: 'niche-site',
    title: 'Xây dựng Niche Site',
    description: 'Tạo các website chuyên biệt về một ngách sản phẩm và kiếm tiền từ tiếp thị liên kết (Affiliate).',
    icon: <Star className="w-6 h-6" />,
    difficulty: 'Trung bình',
    potential: 'Rất Cao',
    tools: ['WordPress', 'Gemini AI', 'Google Search Console']
  }
];

const PROMPTS = [
  { 
    title: 'Viết bài SEO', 
    category: 'Content', 
    description: 'Tạo bài viết 1000 chữ chuẩn SEO về bất kỳ chủ đề nào.',
    content: 'Bạn là một chuyên gia SEO kỳ cựu. Hãy lập một dàn ý chi tiết cho bài viết blog với tiêu đề: [Nhập tiêu đề]. Yêu cầu bài viết chuẩn SEO, có các thẻ H2, H3 và FAQ.'
  },
  { 
    title: 'Mô tả sản phẩm', 
    category: 'E-commerce', 
    description: 'Viết mô tả sản phẩm thu hút, tăng tỷ lệ chốt đơn Shopee.',
    content: 'Bạn là một bậc thầy về Copywriting bán hàng. Hãy viết mô tả sản phẩm cho: [Tên sản phẩm]. Sử dụng công thức AIDA để thôi miên khách hàng.'
  },
  { 
    title: 'Kịch bản TikTok', 
    category: 'Video', 
    description: 'Lên kịch bản video ngắn viral trong vòng 30 giây.',
    content: 'Hãy viết một kịch bản video TikTok dài 45 giây về [Chủ đề]. Bao gồm 3 giây đầu gây sốc, 30 giây giá trị và 10 giây kêu gọi hành động.'
  },
  { 
    title: 'Email Marketing', 
    category: 'Marketing', 
    description: 'Viết chuỗi email bán hàng tự động cực kỳ thuyết phục.',
    content: 'Viết một email bán hàng cho sản phẩm [Tên sản phẩm] gửi đến đối tượng [Đối tượng]. Tập trung vào nỗi đau và giải pháp.'
  },
  { 
    title: 'Nghiên cứu từ khóa', 
    category: 'SEO', 
    description: 'Tìm kiếm các từ khóa ngách có độ cạnh tranh thấp.',
    content: 'Tìm cho tôi 20 từ khóa ngách (long-tail keywords) về chủ đề [Chủ đề] có độ cạnh tranh thấp nhưng tỷ lệ chuyển đổi cao.'
  },
];

const BLOG_POSTS = [
  { 
    title: 'Cách tôi viết 10 bài blog/ngày với AI', 
    date: '13/04/2024', 
    tag: 'Kinh nghiệm',
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
    tag: 'Công cụ',
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
    tag: 'Hướng dẫn',
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

export default function App() {
  const [interests, setInterests] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [showContact, setShowContact] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // Auto-scroll to top when post is selected
  React.useEffect(() => {
    if (selectedPost) {
      window.scrollTo(0, 0);
    }
  }, [selectedPost]);

  const categories = ['Tất cả', ...new Set(PROMPTS.map(p => p.category))];
  const filteredPrompts = activeCategory === 'Tất cả' 
    ? PROMPTS 
    : PROMPTS.filter(p => p.category === activeCategory);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interests.trim()) return;

    setIsLoading(true);
    const result = await generateSideHustleIdea(interests);
    setAiResult(result);
    setIsLoading(false);
  };

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900">
        {/* Blog Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <button 
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lại trang chủ
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <article className="lg:col-span-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    {selectedPost.tag}
                  </span>
                  <span className="text-gray-400 text-sm">{selectedPost.date} • 5 phút đọc</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                  {selectedPost.title}
                </h1>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    CL
                  </div>
                  <div>
                    <div className="font-bold text-sm">Chuc Ly</div>
                    <div className="text-xs text-gray-400">AI Content Specialist</div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all">
                      <Facebook className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-all">
                      <Twitter className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-blue-700 hover:text-blue-700 transition-all">
                      <Linkedin className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <img 
                src={`https://picsum.photos/seed/${selectedPost.title}/1200/600`} 
                alt={selectedPost.title}
                className="w-full aspect-video object-cover rounded-3xl mb-12 shadow-2xl shadow-orange-500/10"
                referrerPolicy="no-referrer"
              />

              {/* Table of Contents */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-12 border border-gray-100">
                <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
                  <List className="w-5 h-5 text-orange-500" />
                  Mục lục nội dung
                </div>
                <nav className="space-y-2 text-sm">
                  <a href="#section-1" className="block text-gray-600 hover:text-orange-500 transition-colors pl-4 border-l-2 border-transparent hover:border-orange-500">1. Thay đổi tư duy: AI là "Trợ lý"</a>
                  <a href="#section-2" className="block text-gray-600 hover:text-orange-500 transition-colors pl-4 border-l-2 border-transparent hover:border-orange-500">2. Quy trình 5 bước viết bài thần tốc</a>
                  <a href="#section-3" className="block text-gray-600 hover:text-orange-500 transition-colors pl-4 border-l-2 border-transparent hover:border-orange-500">3. Các công cụ hỗ trợ đắc lực</a>
                  <a href="#section-4" className="block text-gray-600 hover:text-orange-500 transition-colors pl-4 border-l-2 border-transparent hover:border-orange-500">4. Kết luận</a>
                </nav>
              </div>

              <div className="prose prose-lg prose-orange max-w-none">
                <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
              </div>

              <div className="mt-16 pt-8 border-t border-gray-100">
                <h3 className="font-bold text-xl mb-6">Bình luận</h3>
                <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400 italic">
                  Tính năng bình luận đang được phát triển...
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-12">
              <div className="sticky top-28">
                <div className="bg-black text-white rounded-3xl p-8 mb-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/40 transition-colors" />
                  <h3 className="text-xl font-bold mb-4 relative z-10">Đừng bỏ lỡ!</h3>
                  <p className="text-gray-400 text-sm mb-6 relative z-10">
                    Nhận ngay bộ 100+ Prompt độc quyền giúp bạn x10 năng suất làm việc.
                  </p>
                  <button className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors relative z-10">
                    Tải xuống miễn phí
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Bài viết liên quan
                  </h3>
                  <div className="space-y-6">
                    {BLOG_POSTS.filter(p => p.title !== selectedPost.title).map((post, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedPost(post)}
                        className="group cursor-pointer flex gap-4"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          <img 
                            src={`https://picsum.photos/seed/${post.title}/200/200`} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 uppercase font-bold mt-1 block">{post.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 py-12 border-t border-gray-100 mt-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">AI Hustle Explorer</span>
            </div>
            <p className="text-gray-400 text-sm">© 2024 AI Hustle. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">AI Hustle</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#ideas" className="hover:text-orange-500 transition-colors">Ý tưởng</a>
            <a href="#prompts" className="hover:text-orange-500 transition-colors">Thư viện Prompt</a>
            <a href="#blog" className="hover:text-orange-500 transition-colors">Blog</a>
            <a href="#generator" className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all">Thử AI ngay</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              Dành cho Freelancer & Chủ shop Online
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Làm việc ít hơn, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Kiếm tiền nhiều hơn
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10 leading-relaxed">
              Tận dụng sức mạnh AI để tự động hóa việc viết bài, đăng sản phẩm và xây dựng nguồn thu nhập thụ động bền vững.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#generator" className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 group">
                Khám phá ý tưởng AI <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#prompts" className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                Xem thư viện Prompt
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features/Stats */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6">
              <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold mb-1">X10 Hiệu suất</h3>
                <p className="text-sm text-gray-500">Viết blog và đăng sản phẩm nhanh gấp 10 lần bình thường.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Tối ưu TMĐT</h3>
                <p className="text-sm text-gray-500">Tăng tỷ lệ chuyển đổi cho gian hàng Shopee/Lazada của bạn.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6">
              <div className="p-3 bg-green-50 rounded-xl text-green-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Thu nhập thụ động</h3>
                <p className="text-sm text-gray-500">Xây dựng hệ thống tự động mang lại tiền ngay cả khi bạn ngủ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Side Hustle Ideas Grid */}
      <section id="ideas" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="text-left">
            <h2 className="text-3xl font-bold mb-2">Ý tưởng nghề nghiệp AI</h2>
            <p className="text-gray-500">Những hướng đi tốt nhất cho người có toàn thời gian.</p>
          </div>
          <a href="#" className="text-orange-500 font-bold flex items-center gap-1 hover:underline">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SIDE_HUSTLES.map((hustle, idx) => (
            <motion.div
              key={hustle.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-orange-500 group-hover:text-white transition-colors mb-6">
                {hustle.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{hustle.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {hustle.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {hustle.tools.map(tool => (
                  <span key={tool} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
                    {tool}
                  </span>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-xs font-medium">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400 uppercase tracking-wider">Độ khó</span>
                  <span className={cn(
                    hustle.difficulty === 'Dễ' ? 'text-green-600' : 
                    hustle.difficulty === 'Trung bình' ? 'text-orange-600' : 'text-red-600'
                  )}>{hustle.difficulty}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-gray-400 uppercase tracking-wider">Tiềm năng</span>
                  <span className="text-blue-600">{hustle.potential}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Prompt Library Section */}
      <section id="prompts" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Thư viện Prompt mẫu</h2>
            <p className="text-gray-500">Sao chép và sử dụng ngay để tối ưu công việc hàng ngày của bạn.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeCategory === cat 
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPrompts.map((prompt, idx) => (
              <motion.div 
                layout
                key={prompt.title} 
                className="bg-white p-6 rounded-2xl border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{prompt.title}</h4>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 rounded text-gray-500">{prompt.category}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{prompt.description}</p>
                  <button 
                    onClick={() => handleCopy(prompt.content, idx)}
                    className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Đã sao chép!
                      </>
                    ) : (
                      'Sao chép câu lệnh'
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Idea Generator Section */}
      <section id="generator" className="py-24 bg-black text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] -z-0" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trình tạo ý tưởng cá nhân hóa</h2>
            <p className="text-gray-400">Nhập kỹ năng của bạn, AI sẽ thiết kế lộ trình kiếm tiền riêng cho bạn.</p>
          </div>

          <form onSubmit={handleGenerate} className="mb-12">
            <div className="relative group">
              <input 
                type="text" 
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Ví dụ: Tôi có kinh nghiệm viết blog và đăng sản phẩm Shopee..."
                className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <button 
                type="submit"
                disabled={isLoading || !interests.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span className="hidden sm:inline">Phân tích</span>
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-6 text-orange-500">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Lộ trình đề xuất cho bạn</h3>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300">
                  <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                    {aiResult}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">Bài viết mới nhất</h2>
          <a href="#" className="text-sm font-bold text-orange-500 hover:underline">Xem Blog</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedPost(post)}
              className="group cursor-pointer"
            >
              <div className="aspect-video bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                <div className="absolute top-4 left-4 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold uppercase rounded shadow-sm z-10">
                  {post.tag}
                </div>
                <img 
                  src={`https://picsum.photos/seed/${idx + 50}/800/450`} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs text-gray-400 mb-2 block">{post.date}</span>
              <h4 className="font-bold group-hover:text-orange-500 transition-colors">{post.title}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">AI Hustle Explorer</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 AI Hustle. Được tạo ra để truyền cảm hứng cho cộng đồng Freelancer Việt Nam.
          </p>
          <div className="flex items-center gap-6 text-gray-400">
            <a href="#" className="hover:text-black transition-colors">Facebook</a>
            <a href="#" className="hover:text-black transition-colors">YouTube</a>
            <a href="#" className="hover:text-black transition-colors">TikTok</a>
          </div>
        </div>
      </footer>

      {/* Blog Post Modal (Removed in favor of full page view) */}

      {/* Floating Contact Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {showContact && (
            <>
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                href="https://zalo.me/your-number"
                target="_blank"
                className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="Chat Zalo"
              >
                <MessageCircle className="w-6 h-6" />
              </motion.a>
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                href="https://m.me/your-profile"
                target="_blank"
                className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="Chat Facebook"
              >
                <Facebook className="w-6 h-6" />
              </motion.a>
            </>
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowContact(!showContact)}
          className="w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-orange-600 transition-colors"
        >
          {showContact ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
