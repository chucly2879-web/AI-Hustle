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

interface Prompt {
  title: string;
  category: string;
  description: string;
  content: string;
  isVip?: boolean;
}

const PROMPTS: Prompt[] = [
  { 
    title: 'Viết bài SEO chuyên sâu', 
    category: 'Content', 
    description: 'Tạo bài viết 1000 chữ chuẩn SEO với dàn ý chi tiết.',
    content: 'Bạn là một chuyên gia SEO kỳ cựu. Hãy lập một dàn ý chi tiết cho bài viết blog với tiêu đề: [Tiêu đề bài viết]. Yêu cầu bài viết chuẩn SEO, tập trung vào từ khóa [Từ khóa chính], có các thẻ H2, H3 và phần FAQ ở cuối.'
  },
  { 
    title: 'Mô tả sản phẩm thôi miên', 
    category: 'E-commerce', 
    description: 'Viết mô tả sản phẩm thu hút theo công thức AIDA.',
    content: 'Bạn là một bậc thầy về Copywriting bán hàng. Hãy viết mô tả sản phẩm cho: [Tên sản phẩm]. Đặc điểm nổi bật gồm: [Các tính năng chính]. Sử dụng công thức AIDA (Attention, Interest, Desire, Action) để thôi miên khách hàng chốt đơn ngay lập tức.'
  },
  { 
    title: 'Kịch bản TikTok Viral', 
    category: 'Video', 
    description: 'Lên kịch bản video ngắn thu hút trong 3 giây đầu.',
    content: 'Hãy viết một kịch bản video TikTok dài 45 giây về [Chủ đề video]. Yêu cầu: 3 giây đầu phải có Hook cực mạnh về [Nỗi đau khách hàng], 30 giây tiếp theo chia sẻ 3 mẹo về [Giải pháp], và 10 giây cuối kêu gọi hành động [Lời kêu gọi].'
  },
  { 
    title: '[VIP] Chiến dịch FB Ads triệu đô', 
    category: 'Marketing', 
    description: 'Cấu trúc bài viết quảng cáo Facebook tỷ lệ chuyển đổi cực cao.',
    content: 'Bạn là chuyên gia chạy quảng cáo Facebook Ads. Hãy viết 3 mẫu nội dung quảng cáo cho sản phẩm [Tên sản phẩm] nhắm tới đối tượng [Đối tượng]. Mẫu 1: Đánh vào nỗi đau. Mẫu 2: Đánh vào lợi ích. Mẫu 3: Kể chuyện (Storytelling). Kèm theo gợi ý hình ảnh/video cho từng mẫu.',
    isVip: true
  },
  { 
    title: '[VIP] Kịch bản chốt đơn Telesale', 
    category: 'Sales', 
    description: 'Quy trình xử lý từ chối và chốt đơn qua điện thoại.',
    content: 'Xây dựng kịch bản Telesale cho sản phẩm [Tên sản phẩm]. Bao gồm: Chào hỏi gây ấn tượng, Khai thác nhu cầu, Xử lý 3 lời từ chối phổ biến nhất: [Lời từ chối 1], [Lời từ chối 2], [Lời từ chối 3] và Kỹ thuật chốt đơn giả định.',
    isVip: true
  },
  { 
    title: '[VIP] Phễu bán hàng tự động (Funnel)', 
    category: 'Marketing', 
    description: 'Thiết kế hành trình khách hàng từ nhận biết đến mua hàng.',
    content: 'Hãy thiết kế một phễu bán hàng 4 giai đoạn cho [Sản phẩm/Dịch vụ]. Giai đoạn 1: Thu hút (Lead Magnet). Giai đoạn 2: Nuôi dưỡng (Email sequence). Giai đoạn 3: Chuyển đổi (Sales page). Giai đoạn 4: Chăm sóc sau bán. Viết tiêu đề và nội dung chính cho từng giai đoạn.',
    isVip: true
  },
  { 
    title: '[VIP] Tối ưu hóa gian hàng Shopee Pro', 
    category: 'E-commerce', 
    description: 'Chiến lược đứng top tìm kiếm và tối ưu tỷ lệ click.',
    content: 'Bạn là chuyên gia vận hành sàn TMĐT. Hãy tối ưu sản phẩm [Tên sản phẩm]. Viết tiêu đề chứa từ khóa hot, 5 điểm nổi bật (Bullet points) đánh vào tâm lý khách hàng, và bộ 18 hashtag chuẩn SEO Shopee.',
    isVip: true
  },
  { 
    title: 'Email Marketing Bán Hàng', 
    category: 'Marketing', 
    description: 'Viết chuỗi email bán hàng tự động thuyết phục.',
    content: 'Viết một email bán hàng cho sản phẩm [Tên sản phẩm] gửi đến đối tượng [Đối tượng khách hàng]. Tập trung vào việc giải quyết vấn đề [Vấn đề của họ] và đưa ra ưu đãi [Ưu đãi đặc biệt]. Giọng văn thân thiện nhưng chuyên nghiệp.'
  },
  { 
    title: 'Nghiên cứu từ khóa ngách', 
    category: 'SEO', 
    description: 'Tìm kiếm các từ khóa có độ cạnh tranh thấp.',
    content: 'Tìm cho tôi 20 từ khóa ngách (long-tail keywords) về chủ đề [Chủ đề chính] có độ cạnh tranh thấp nhưng tỷ lệ chuyển đổi cao. Sắp xếp theo bảng gồm: Từ khóa, Ý định tìm kiếm, và Độ khó ước tính.'
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
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});
  const [isPromptRunning, setIsPromptRunning] = useState(false);
  const [promptResult, setPromptResult] = useState('');
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [userRole, setUserRole] = useState<'free' | 'pro'>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
        fallbackCopyTextToClipboard(text, index);
      });
    } else {
      fallbackCopyTextToClipboard(text, index);
    }
  };

  const fallbackCopyTextToClipboard = (text: string, index: number) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure the textarea is not visible
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  };

  const openPromptEditor = (prompt: Prompt) => {
    if (prompt.isVip && userRole !== 'pro') {
      setShowUpgradeModal(true);
      return;
    }
    const vars: Record<string, string> = {};
    const matches = prompt.content.match(/\[(.*?)\]/g) || [];
    matches.forEach(m => {
      const varName = m.slice(1, -1);
      vars[varName] = '';
    });
    setEditingPrompt(prompt);
    setPromptVariables(vars);
    setPromptResult('');
  };

  const getFinalPrompt = () => {
    if (!editingPrompt) return '';
    let final = editingPrompt.content;
    Object.entries(promptVariables).forEach(([key, value]) => {
      final = final.replace(`[${key}]`, value || `[${key}]`);
    });
    return final;
  };

  const runPromptWithAI = async () => {
    if (!editingPrompt) return;
    setIsPromptRunning(true);
    try {
      const result = await generateSideHustleIdea(getFinalPrompt());
      setPromptResult(result);
    } catch (error) {
      console.error(error);
      setPromptResult('Có lỗi xảy ra khi chạy AI. Vui lòng thử lại.');
    } finally {
      setIsPromptRunning(false);
    }
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
          <button 
            onClick={() => {
              setSelectedPost(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">AI Hustle</span>
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#ideas" className="hover:text-orange-500 transition-colors">Ý tưởng</a>
            <a href="#prompts" className="hover:text-orange-500 transition-colors">Thư viện Prompt</a>
            <a href="#blog" className="hover:text-orange-500 transition-colors">Blog</a>
            {userRole === 'pro' && <a href="#masterclass" className="text-orange-600 font-bold">Masterclass</a>}
            <a href="#generator" className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all">Thử AI ngay</a>
            <button 
              onClick={() => setUserRole(userRole === 'free' ? 'pro' : 'free')}
              className="text-[10px] px-2 py-1 border border-gray-200 rounded hover:bg-gray-100"
            >
              {userRole === 'free' ? 'Mô phỏng Pro' : 'Thoát Pro'}
            </button>
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
              Tận dụng sức mạnh AI để tự động hóa việc viết bài, đăng sản phẩm và xây dựng nguồn thu nhập thụ động bền vững. <br className="hidden md:block" />
              <span className="font-semibold text-orange-600">Tham gia cùng 1,200+ Freelancer đang dẫn đầu xu hướng.</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#generator" className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 group shadow-xl shadow-black/10">
                Khám phá ý tưởng AI <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#prompts" className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                Xem thư viện Prompt
              </a>
            </div>

            {/* Trust Bar */}
            <div className="mt-20 pt-10 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Được tin dùng bởi các chuyên gia từ</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
                <div className="font-black text-xl italic">TECHHUB</div>
                <div className="font-black text-xl">AI_INSIDER</div>
                <div className="font-black text-xl tracking-tighter">FUTURE_BIZ</div>
                <div className="font-black text-xl">DIGITAL_NOMAD</div>
              </div>
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

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Quy trình 3 bước đơn giản</h2>
            <p className="text-gray-500">Bắt đầu hành trình chinh phục AI của bạn ngay hôm nay.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Khám phá ý tưởng",
                desc: "Sử dụng trình tạo ý tưởng AI để tìm ra ngách kinh doanh phù hợp nhất với kỹ năng của bạn."
              },
              {
                step: "02",
                title: "Sử dụng Prompt",
                desc: "Sao chép các câu lệnh (Prompt) đã được tối ưu sẵn để bắt đầu tạo nội dung hoặc sản phẩm."
              },
              {
                step: "03",
                title: "Tối ưu & Kiếm tiền",
                desc: "Áp dụng các hướng dẫn từ Blog để tối ưu quy trình và bắt đầu nhận những khoản thu nhập đầu tiên."
              }
            ].map((s, i) => (
              <div key={i} className="relative group">
                <div className="text-6xl font-black text-gray-50 mb-4 group-hover:text-orange-50 transition-colors">{s.step}</div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
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

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Học viên nói gì về chúng tôi?</h2>
            <p className="text-gray-500">Những câu chuyện thành công thực tế từ cộng đồng.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Nguyễn Văn A",
                role: "Freelancer Content",
                text: "Nhờ bộ Prompt của AI Hustle, tôi đã tăng năng suất viết bài lên gấp 5 lần. Thu nhập hiện tại đã ổn định ở mức 20tr/tháng.",
                avatar: "https://i.pravatar.cc/150?u=a"
              },
              {
                name: "Trần Thị B",
                role: "Chủ shop Shopee",
                text: "Công cụ tạo mô tả sản phẩm AI giúp gian hàng của tôi chuyên nghiệp hơn hẳn. Tỷ lệ chuyển đổi tăng 30% sau 1 tháng áp dụng.",
                avatar: "https://i.pravatar.cc/150?u=b"
              },
              {
                name: "Lê Văn C",
                role: "Digital Marketer",
                text: "Lộ trình cá nhân hóa từ AI rất sát thực tế. Tôi đã tìm thấy ngách kinh doanh phù hợp chỉ sau 15 phút tìm hiểu.",
                avatar: "https://i.pravatar.cc/150?u=c"
              }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex gap-1 text-orange-400 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-600 italic mb-6">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                className="bg-white p-6 rounded-2xl border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="p-3 bg-orange-50 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{prompt.title}</h4>
                      {prompt.isVip && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white text-[8px] font-black uppercase rounded">
                          <Star className="w-2 h-2 fill-current" /> VIP
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 rounded text-gray-500">{prompt.category}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{prompt.description}</p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => openPromptEditor(prompt)}
                      className="text-xs font-bold bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <PenTool className="w-3 h-3" /> Tùy chỉnh & Chạy
                    </button>
                    <button 
                      onClick={() => handleCopy(prompt.content, idx)}
                      className="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Đã sao chép!
                        </>
                      ) : (
                        'Sao chép nhanh'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prompt Editor Modal */}
      <AnimatePresence>
        {editingPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{editingPrompt.title}</h3>
                    <p className="text-xs text-gray-400">Tùy chỉnh biến để tạo câu lệnh hoàn hảo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingPrompt(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Inputs */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Nhập thông tin</h4>
                      {Object.keys(promptVariables).map(varName => (
                        <div key={varName} className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">{varName}</label>
                          <input 
                            type="text"
                            value={promptVariables[varName]}
                            onChange={(e) => setPromptVariables(prev => ({ ...prev, [varName]: e.target.value }))}
                            placeholder={`Nhập ${varName.toLowerCase()}...`}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                      <h4 className="font-bold text-orange-800 text-sm mb-2">Mẹo nhỏ:</h4>
                      <p className="text-xs text-orange-700 leading-relaxed">
                        Càng cung cấp thông tin chi tiết, AI sẽ trả về kết quả càng chất lượng. Hãy thử mô tả kỹ hơn về đối tượng khách hàng hoặc phong cách viết bạn muốn.
                      </p>
                    </div>
                  </div>

                  {/* Right: Preview & Result */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Xem trước câu lệnh</h4>
                      <div className="p-5 bg-gray-900 rounded-2xl text-gray-300 text-sm font-mono leading-relaxed relative group">
                        <div className="whitespace-pre-wrap">{getFinalPrompt()}</div>
                        <button 
                          onClick={() => handleCopy(getFinalPrompt(), -1)}
                          className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Share2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={runPromptWithAI}
                        disabled={isPromptRunning}
                        className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isPromptRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        Chạy thử với AI
                      </button>
                      <button 
                        onClick={() => handleCopy(getFinalPrompt(), -1)}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2",
                          copiedIndex === -1 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {copiedIndex === -1 ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" /> Đã sao chép!
                          </>
                        ) : (
                          'Sao chép'
                        )}
                      </button>
                    </div>

                    {promptResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Kết quả mẫu từ AI</h4>
                        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-inner max-h-60 overflow-y-auto prose prose-sm prose-orange">
                          <ReactMarkdown>{promptResult}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* AI Masterclass Section (Pro Only) */}
      <AnimatePresence>
        {userRole === 'pro' && (
          <motion.section 
            id="masterclass"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-24 bg-orange-950 text-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
                <div>
                  <span className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-2 block">Khu vực dành riêng cho Pro</span>
                  <h2 className="text-4xl font-bold">AI Masterclass Dashboard</h2>
                </div>
                <p className="text-orange-200/60 max-w-md text-sm">Chào mừng bạn trở lại! Hãy tiếp tục hành trình làm chủ AI với các bài học thực chiến mới nhất.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    title: "Bài 1: Tư duy triệu đô với Prompt Engineering", 
                    desc: "Học cách giao tiếp với AI như một lập trình viên ngôn ngữ tự nhiên.",
                    duration: "45:20", 
                    status: "Đã hoàn thành" 
                  },
                  { 
                    title: "Bài 2: Xây dựng hệ thống Content tự động 100%", 
                    desc: "Quy trình sử dụng Make.com và ChatGPT để tự động hóa bài viết.",
                    duration: "1:12:05", 
                    status: "Đang học" 
                  },
                  { 
                    title: "Bài 3: Kỹ thuật chốt đơn khách hàng quốc tế", 
                    desc: "Cách tìm kiếm và đàm phán với khách hàng trên Upwork/Fiverr.",
                    duration: "58:10", 
                    status: "Chưa xem" 
                  }
                ].map((lesson, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="aspect-video bg-gray-800 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 fill-current" />
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-[10px] rounded">{lesson.duration}</div>
                    </div>
                    <h4 className="font-bold mb-1">{lesson.title}</h4>
                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">{lesson.desc}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{lesson.status}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white max-w-md w-full rounded-[40px] p-10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-600" />
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Star className="w-10 h-10 fill-current" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Nội dung này bị khóa!</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Bạn đang cố gắng truy cập vào **Prompt VIP** dành riêng cho thành viên gói Pro. Hãy nâng cấp ngay để mở khóa toàn bộ kho tài nguyên.
              </p>
              <div className="space-y-3 mb-10">
                <button 
                  onClick={() => { setUserRole('pro'); setShowUpgradeModal(false); }}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20"
                >
                  Nâng cấp Pro ngay (199k)
                </button>
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Để sau
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Hoàn tiền 100% trong 7 ngày nếu không hài lòng.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lựa chọn lộ trình của bạn</h2>
            <p className="text-gray-500">Từ người mới bắt đầu đến chuyên gia kiếm tiền bằng AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="p-8 rounded-3xl border border-gray-100 hover:border-orange-200 transition-all flex flex-col bg-white">
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Người mới (Starter)</h3>
                <div className="text-3xl font-black mb-2">Miễn phí</div>
                <p className="text-sm text-gray-500">Khám phá sức mạnh AI cơ bản.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> 
                  <span>Truy cập <strong>50+ Prompt</strong> cộng đồng</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> 
                  <span>Giới hạn <strong>5 lượt chạy AI</strong>/ngày</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> 
                  <span>Bản tin xu hướng hàng tuần</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-400 italic">
                  <X className="w-4 h-4 mt-0.5 shrink-0" /> 
                  <span>Không có Prompt VIP</span>
                </li>
              </ul>
              <button className="w-full py-4 border border-black rounded-xl font-bold hover:bg-black hover:text-white transition-all">
                Bắt đầu ngay
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl border-2 border-orange-500 bg-orange-50/30 relative flex flex-col md:scale-105 shadow-xl shadow-orange-500/10 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase rounded-full">Khuyên dùng</div>
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Chuyên nghiệp (Pro)</h3>
                <div className="text-3xl font-black mb-2">199k<span className="text-sm font-normal text-gray-400">/tháng</span></div>
                <p className="text-sm text-gray-500">Dành cho Freelancer muốn đột phá thu nhập.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /> 
                  <span>Mở khóa <strong>500+ Prompt VIP</strong> thực chiến</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /> 
                  <span><strong>Không giới hạn</strong> lượt chạy AI</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /> 
                  <span>Truy cập <strong>AI Masterclass</strong> (Video)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /> 
                  <span>Tham gia <strong>Cộng đồng kín</strong> trên Zalo</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /> 
                  <span>Cập nhật Prompt mới mỗi ngày</span>
                </li>
              </ul>
              <button className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
                Nâng cấp Pro ngay
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 rounded-3xl border border-gray-100 hover:border-orange-200 transition-all flex flex-col bg-white">
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Doanh nghiệp (Elite)</h3>
                <div className="text-3xl font-black mb-2">Liên hệ</div>
                <p className="text-sm text-gray-500">Giải pháp AI tùy chỉnh cho đội ngũ.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> 
                  <span><strong>Xây dựng AI Agent</strong> riêng cho shop</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> 
                  <span>Đào tạo <strong>In-house</strong> cho nhân viên</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> 
                  <span>Tài khoản <strong>Quản trị viên</strong> (Multi-user)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> 
                  <span>Hỗ trợ kỹ thuật <strong>24/7</strong> ưu tiên</span>
                </li>
              </ul>
              <button className="w-full py-4 border border-black rounded-xl font-bold hover:bg-black hover:text-white transition-all">
                Liên hệ tư vấn
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mt-24 overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-6 px-4 text-sm font-bold uppercase tracking-wider text-gray-400">Tính năng</th>
                    <th className="py-6 px-4 text-center font-bold">Starter</th>
                    <th className="py-6 px-4 text-center font-bold text-orange-500">Pro</th>
                    <th className="py-6 px-4 text-center font-bold text-blue-600">Elite</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-4 font-medium">Thư viện Prompt</td>
                    <td className="py-5 px-4 text-center text-gray-500">50+ Cơ bản</td>
                    <td className="py-5 px-4 text-center font-bold">500+ VIP</td>
                    <td className="py-5 px-4 text-center">Tùy chỉnh riêng</td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-4 font-medium">Lượt chạy AI</td>
                    <td className="py-5 px-4 text-center text-gray-500">5 lượt/ngày</td>
                    <td className="py-5 px-4 text-center font-bold text-green-600">Không giới hạn</td>
                    <td className="py-5 px-4 text-center">Ưu tiên băng thông</td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-4 font-medium">Đào tạo Video</td>
                    <td className="py-5 px-4 text-center text-gray-500"><X className="w-4 h-4 mx-auto text-gray-300" /></td>
                    <td className="py-5 px-4 text-center font-bold">Full Masterclass</td>
                    <td className="py-5 px-4 text-center">Workshop trực tiếp</td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-4 font-medium">Hỗ trợ kỹ thuật</td>
                    <td className="py-5 px-4 text-center text-gray-500">Cộng đồng</td>
                    <td className="py-5 px-4 text-center font-bold">Zalo 1-1</td>
                    <td className="py-5 px-4 text-center">Quản lý tài khoản riêng</td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-4 font-medium">Công cụ tự động hóa</td>
                    <td className="py-5 px-4 text-center text-gray-500"><X className="w-4 h-4 mx-auto text-gray-300" /></td>
                    <td className="py-5 px-4 text-center font-bold">Mẫu Make/Zapier</td>
                    <td className="py-5 px-4 text-center">Thiết kế hệ thống riêng</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Magnet Section */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-500 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-orange-500/20 text-orange-400 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-orange-500/30">
                Quà tặng miễn phí
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Tải ngay Ebook <br />
                <span className="text-orange-500">"10 Cách Kiếm 1000$ Đầu Tiên Với AI"</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Chúng tôi đã tổng hợp những phương pháp thực chiến nhất, không lý thuyết suông. Hơn 10,000 người đã tải và bắt đầu hành trình của mình.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "Lộ trình chi tiết từng bước",
                  "Danh sách 50+ công cụ AI miễn phí",
                  "Mẫu kịch bản chốt đơn khách hàng quốc tế"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl">
                <h3 className="text-2xl font-bold mb-2 text-center">Nhận Ebook Ngay</h3>
                <p className="text-gray-400 text-center mb-8 text-sm">Link tải sẽ được gửi trực tiếp vào email của bạn.</p>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setEmailSubscribed(true); }}>
                  <input 
                    type="text" 
                    placeholder="Họ và tên của bạn" 
                    required
                    className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <input 
                    type="email" 
                    placeholder="Địa chỉ Email" 
                    required
                    className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <button className="w-full py-5 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2">
                    {emailSubscribed ? "Đã gửi! Kiểm tra email nhé" : "Tải Ebook Miễn Phí"}
                  </button>
                </form>
                <p className="mt-6 text-[10px] text-gray-500 text-center">
                  Bằng cách đăng ký, bạn đồng ý với chính sách bảo mật của chúng tôi.
                </p>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-orange-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Nhận bộ tài liệu "AI Masterclass" Miễn Phí</h2>
          <p className="text-orange-100 text-lg mb-10">
            Hơn 5,000 người đã đăng ký nhận bản tin hàng tuần về các công cụ AI mới nhất và cách áp dụng chúng để kiếm tiền.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã đăng ký!'); }}>
            <input 
              type="email" 
              placeholder="Email của bạn..." 
              required
              className="flex-1 px-6 py-4 rounded-2xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
            <button className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-xl">
              Đăng ký ngay
            </button>
          </form>
          <p className="mt-6 text-orange-200 text-xs">Chúng tôi cam kết không spam. Bạn có thể hủy đăng ký bất cứ lúc nào.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <button 
            onClick={() => {
              setSelectedPost(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">AI Hustle Explorer</span>
          </button>
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
