import React, { useState, useEffect } from 'react';
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
  ArrowUp,
  Instagram,
  Youtube,
  Github as GithubIcon,
  MessageCircle,
  MessageSquare,
  Facebook,
  X,
  Lock,
  ChevronLeft,
  Share2,
  Twitter,
  Linkedin,
  List,
  FileText,
  Download,
  Eye,
  Users,
  Calendar,
  Mail,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Copy,
  Clock,
  Target,
  Play,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { cn } from './lib/utils';
import { generateSideHustleIdea, runCustomPrompt } from './services/gemini';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocFromServer, doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPanel from './pages/AdminPanel';
import { RoadmapDashboard } from './components/RoadmapWidget';
import { TikTokHookLab } from './components/TikTokHookGenerator';

interface SideHustle {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  potential: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất Cao' | 'Bền vững';
  tools: string[];
  potential_income?: string;
  market_demand?: string;
}

const SIDE_HUSTLES: SideHustle[] = [
  {
    id: 'content',
    title: 'Sáng tạo nội dung AI',
    description: 'Sử dụng AI để viết blog, kịch bản video và nội dung mạng xã hội cho các doanh nghiệp. Tiết kiệm 80% thời gian nghiên cứu.',
    icon: <PenTool className="w-6 h-6" />,
    difficulty: 'Dễ',
    potential: 'Cao',
    tools: ['ChatGPT', 'Claude', 'Jasper'],
    potential_income: '15 - 35 triệu/tháng',
    market_demand: 'Rất cao'
  },
  {
    id: 'art',
    title: 'Thiết kế hình ảnh AI',
    description: 'Tạo logo, hình minh họa và ảnh sản phẩm chuyên nghiệp. Phù hợp cho Freelancer thiết kế và chủ shop.',
    icon: <Palette className="w-6 h-6" />,
    difficulty: 'Trung bình',
    potential: 'Cao',
    tools: ['Midjourney', 'DALL-E 3', 'Canva Magic'],
    potential_income: '20 - 45 triệu/tháng',
    market_demand: 'Cao'
  },
  {
    id: 'coding',
    title: 'Lập trình & Công cụ AI',
    description: 'Xây dựng các tiện ích mở rộng trình duyệt hoặc ứng dụng nhỏ giải quyết vấn đề cụ thể cho doanh nghiệp.',
    icon: <Code2 className="w-6 h-6" />,
    difficulty: 'Khó',
    potential: 'Rất Cao',
    tools: ['Cursor', 'GitHub Copilot', 'v0.dev'],
    potential_income: '40 - 120 triệu/tháng',
    market_demand: 'Bùng nổ'
  },
  {
    id: 'translation',
    title: 'Dịch thuật chuyên sâu AI',
    description: 'Dịch thuật tài liệu, website đa ngôn ngữ với độ chính xác cao. Kết hợp AI và biên tập thủ công.',
    icon: <Languages className="w-6 h-6" />,
    difficulty: 'Dễ',
    potential: 'Trung bình',
    tools: ['DeepL', 'Google Translate AI', 'ChatGPT'],
    potential_income: '8 - 15 triệu/tháng',
    market_demand: 'Trung bình'
  },
  {
    id: 'consulting',
    title: 'Tư vấn giải pháp AI',
    description: 'Giúp doanh nghiệp tự động hóa quy trình, xây dựng Chatbot và tối ưu hóa hiệu suất làm việc.',
    icon: <Briefcase className="w-6 h-6" />,
    difficulty: 'Khó',
    potential: 'Rất Cao',
    tools: ['Make.com', 'Zapier', 'OpenAI API'],
    potential_income: '30 - 70 triệu/tháng',
    market_demand: 'Đang bùng nổ'
  },
  {
    id: 'ecommerce-seo',
    title: 'Tối ưu SEO TMĐT AI',
    description: 'Tối ưu tiêu đề, mô tả sản phẩm Shopee/Lazada/TikTok Shop giúp tăng tỷ lệ chuyển đổi và hiển thị.',
    icon: <ShoppingBag className="w-6 h-6" />,
    difficulty: 'Dễ',
    potential: 'Cao',
    tools: ['ChatGPT', 'Shopee Analytics', 'KeywordTool.io'],
    potential_income: '12 - 30 triệu/tháng',
    market_demand: 'Rất cao'
  },
  {
    id: 'niche-site',
    title: 'Xây dựng Niche Site AI',
    description: 'Xây dựng hệ thống website vệ tinh, blog chuyên sâu để kiếm tiền từ Affiliate và quảng cáo.',
    icon: <Star className="w-6 h-6" />,
    difficulty: 'Trung bình',
    potential: 'Bền vững',
    tools: ['WordPress', 'Gemini AI', 'Google Search Console'],
    potential_income: '20 - 80 triệu/tháng',
    market_demand: 'Ổn định'
  }
];

interface Prompt {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  isVip?: boolean;
}

const PROMPTS: Prompt[] = [
  // --- CONTENT CATEGORY ---
  { 
    id: 'seo-article',
    title: 'Viết bài SEO chuyên sâu', 
    category: 'Content', 
    description: 'Tạo bài viết 1000 chữ chuẩn SEO với dàn ý chi tiết.',
    content: 'Bạn là một chuyên gia SEO kỳ cựu. Hãy thực hiện quy trình sau:\n1. Nghiên cứu 10 từ khóa phụ liên quan đến [Từ khóa chính].\n2. Lập dàn ý chi tiết gồm 5 thẻ H2 và các thẻ H3 tương ứng cho tiêu đề: [Tiêu đề bài viết].\n3. Viết đoạn mở đầu thu hút (Hook) đánh vào nỗi đau của [Đối tượng độc giả].\n4. Viết nội dung chi tiết cho mục H2 đầu tiên.\n5. Đề xuất 3 tiêu đề tối ưu tỷ lệ click (CTR).'
  },
  { 
    id: 'content-production-mega',
    title: '[MEGA] Quy trình sản xuất nội dung 30 ngày', 
    category: 'Content', 
    description: 'Tạo 30 bài viết chất lượng chỉ trong 2 giờ làm việc.',
    content: 'Bạn là Content Director. Hãy xây dựng quy trình sản xuất nội dung cho [Chủ đề] trong 30 ngày. Quy trình:\n1. Brainstorming: Tìm 30 tiêu đề đánh vào 30 nỗi đau khác nhau của khách hàng.\n2. Phân loại định dạng: 10 bài chia sẻ kiến thức, 10 bài kể chuyện, 5 bài bán hàng, 5 bài tương tác.\n3. Sản xuất hàng loạt (Batching): Viết dàn ý cho 30 bài cùng lúc.\n4. Tối ưu hóa AI: Cách dùng Prompt để viết nội dung chi tiết cho từng bài mà không bị trùng lặp.\n5. Lên lịch tự động: Gợi ý các công cụ đăng bài tự động và khung giờ vàng.'
  },
  { 
    id: 'content-agency-mega',
    title: '[MEGA] Vận hành Agency Content AI 10k$', 
    category: 'Content', 
    description: 'Quy trình vận hành Agency nội dung quy mô lớn với doanh thu đột phá.',
    content: 'Bạn là CEO của một Agency Content hàng đầu thế giới. Hãy thiết lập quy trình vận hành Agency triệu đô cho tôi.\n\n### GIAI ĐOẠN 1: LEAD GENERATION (TÌM KHÁCH HÀNG)\n1. Sử dụng LinkedIn Sales Navigator để lọc 100 khách hàng tiềm năng trong ngách [Ngách của tôi].\n2. Viết 3 mẫu Cold Email cá nhân hóa đánh vào nỗi đau về chi phí sản xuất nội dung.\n3. Xây dựng phễu quà tặng (Lead Magnet) là bản phân tích đối thủ cạnh tranh.\n\n### GIAI ĐOẠN 2: SERVICE DESIGN (THIẾT KẾ DỊCH VỤ)\n1. Xây dựng 3 gói dịch vụ: Basic (10 bài), Standard (30 bài + Video), Premium (Trọn gói Omni-channel).\n2. Sử dụng AI để tối ưu chi phí sản xuất xuống còn 1/10 giá thị trường.\n\n### GIAI ĐOẠN 3: AI PRODUCTION WORKFLOW (QUY TRÌNH SẢN XUẤT)\n1. Sử dụng tổ hợp ChatGPT (Viết lách) + Midjourney (Hình ảnh) + Canva (Design) + ElevenLabs (Lồng tiếng).\n2. Thiết lập Workflow trên Make.com để tự động hóa việc đẩy bài từ AI sang Google Docs.\n\n### GIAI ĐOẠN 4: QUALITY CONTROL (KIỂM SOÁT CHẤT LƯỢNG)\n1. Checklist 15 điểm: Văn phong, tính nguyên bản (AI Detection), sự chính xác, tính nhất quán thương hiệu...\n2. Quy trình sửa bài 2 vòng với nhân sự quản lý (Editor).\n\n### GIAI ĐOẠN 5: REPORTING & RETENTION (GIỮ CHÂN KHÁCH HÀNG)\n1. Mẫu báo cáo hiệu quả số lượng bài, lượt tương tác và tỷ lệ chuyển đổi.\n2. Chiến lược Upsell sang các dịch vụ cao cấp hơn.',
    isVip: true
  },
  { 
    id: 'content-ideas-vip',
    title: '[VIP] Sáng tạo 100 ý tưởng nội dung trong 10 phút', 
    category: 'Content', 
    description: 'Kỹ thuật Brainstorming thần tốc để không bao giờ bí ý tưởng.',
    content: 'Bạn là chuyên gia sáng tạo nội dung. Hãy tạo 100 ý tưởng nội dung cho [Chủ đề]. Quy trình:\n1. Phân loại theo 5 nhóm: Giáo dục, Giải trí, Truyền cảm hứng, Bán hàng, Tương tác.\n2. Sử dụng ma trận nội dung: Kết hợp [Chủ đề] với các góc nhìn khác nhau (Người mới, Chuyên gia, Sai lầm thường gặp, Xu hướng tương lai...).\n3. Đề xuất tiêu đề cho 20 ý tưởng tốt nhất.\n4. Gợi ý định dạng phù hợp cho từng nhóm (Video ngắn, Bài viết dài, Infographic).',
    isVip: true
  },
  { 
    id: 'storytelling-branding-vip',
    title: '[VIP] Kể chuyện thương hiệu (Storytelling)', 
    category: 'Content', 
    description: 'Xây dựng câu chuyện thương hiệu chạm đến trái tim khách hàng.',
    content: 'Hãy viết một câu chuyện thương hiệu cho [Tên thương hiệu] theo hành trình anh hùng. Quy trình:\n1. Bối cảnh: Giới thiệu nỗi đau ban đầu của khách hàng.\n2. Biến cố: Thời điểm họ nhận ra cần thay đổi.\n3. Người dẫn đường: Thương hiệu của bạn xuất hiện với giải pháp.\n4. Kết quả: Sự thay đổi tích cực và thành công bền vững.',
    isVip: true
  },

  // --- SOCIAL MEDIA CATEGORY ---
  { 
    id: 'tiktok-viral',
    title: 'Kịch bản TikTok Viral', 
    category: 'Social Media', 
    description: 'Lên kịch bản video ngắn thu hút trong 3 giây đầu.',
    content: 'Hãy viết một kịch bản video TikTok dài 45 giây về [Chủ đề video]. Quy trình:\n- 0-3s (Hook): Sử dụng kỹ thuật "Sự thật gây sốc" hoặc "Câu hỏi ngược đời".\n- 3-15s (Vấn đề): Đào sâu nỗi đau của [Đối tượng].\n- 15-35s (Giải giải pháp): Chia sẻ 3 bước thực hiện đơn giản.\n- 35-45s (CTA): Kêu gọi follow để xem phần tiếp theo hoặc nhận quà.'
  },
  { 
    id: 'fb-content-pro',
    title: 'Nội dung Facebook Fanpage 7 ngày', 
    category: 'Social Media', 
    description: 'Lên kế hoạch nội dung thu hút tương tác tự động.',
    content: 'Bạn là Social Media Manager chuyên nghiệp. Hãy xây dựng kế hoạch nội dung 7 ngày cho Fanpage về [Chủ đề/Ngành hàng]. Quy trình:\n- Ngày 1: Bài viết chia sẻ giá trị/kiến thức.\n- Ngày 2: Bài viết giải trí/meme liên quan.\n- Ngày 3: Bài viết đặt câu hỏi/thảo luận.\n- Ngày 4: Bài viết giới thiệu sản phẩm khéo léo.\n- Ngày 5: Bài viết Feedback khách hàng.\n- Ngày 6: Bài viết đằng sau hậu trường.\n- Ngày 7: Bài viết mini-game/quà tặng.\nYêu cầu: Mỗi bài viết bao gồm Tiêu đề, Nội dung chính và 5 Hashtag.'
  },
  { 
    id: 'tiktok-growth-vip',
    title: '[VIP] Quy trình xây dựng kênh TikTok 100k Follower', 
    category: 'Social Media', 
    description: 'Chiến lược nội dung để phủ sóng thương hiệu thần tốc.',
    content: 'Bạn là chuyên gia tăng trưởng TikTok. Hãy lập kế hoạch 30 ngày để đạt 100k Follower cho kênh [Tên kênh]. Quy trình:\n- Tuần 1: Định vị thương hiệu và tạo 7 video "Hook" cực mạnh.\n- Tuần 2: Tương tác với cộng đồng và bắt trend thông minh.\n- Tuần 3: Chuỗi video Storytelling để gắn kết cảm xúc với người xem.\n- Tuần 4: Tối ưu hóa thuật toán và livestream bán hàng/tăng tương tác.\nYêu cầu: Mỗi tuần đề xuất 3 ý tưởng video cụ thể.',
    isVip: true
  },
  { 
    id: 'youtube-automation-mega',
    title: '[MEGA] Xây dựng kênh YouTube Automation', 
    category: 'Social Media', 
    description: 'Quy trình tạo kênh YouTube kiếm tiền thụ động mà không cần lộ mặt.',
    content: 'Bạn là chuyên gia YouTube Automation. Hãy lập kế hoạch xây dựng kênh cho ngách [Ngách nội dung]. Quy trình:\n1. Nghiên cứu chủ đề: Tìm 10 chủ đề có CPM cao và lượng tìm kiếm lớn.\n2. Quy trình sản xuất: Cách dùng AI để viết kịch bản, tạo giọng đọc (Text-to-speech) và tìm stock video/hình ảnh.\n3. Tối ưu hóa SEO: Cách viết tiêu đề, mô tả và tag để video ăn đề xuất.\n4. Chiến lược tăng trưởng: Cách dùng Shorts để kéo sub cho kênh chính.\n5. Các phương thức kiếm tiền: Ngoài AdSense, hãy đề xuất 3 cách kiếm tiền khác từ kênh này.',
    isVip: true
  },
  { 
    id: 'video-script-expert',
    title: 'Kịch bản Video Review chuyên nghiệp', 
    category: 'Social Media', 
    description: 'Cấu trúc kịch bản review sản phẩm thu hút hàng triệu view.',
    content: 'Viết kịch bản review cho [Tên sản phẩm]. Quy trình:\n1. Mở đầu: Cảnh quay gây tò mò (Unboxing hoặc so sánh).\n2. Trải nghiệm thực tế: Những ưu điểm vượt trội mà ít người biết.\n3. Điểm trừ: Một chút thật thà để tăng độ tin cậy.\n4. So sánh: Với các sản phẩm cùng phân khúc.\n5. Kết luận: Có nên mua hay không?'
  },

  // --- ADS CATEGORY ---
  { 
    id: 'fb-ads-vip',
    title: '[VIP] Chiến dịch FB Ads triệu đô', 
    category: 'Ads', 
    description: 'Cấu trúc bài viết quảng cáo Facebook tỷ lệ chuyển đổi cực cao.',
    content: 'Bạn là chuyên gia chạy quảng cáo Facebook Ads. Hãy thực hiện quy trình viết nội dung quảng cáo cho [Sản phẩm]:\n1. Viết 3 tiêu đề (Headline) khác nhau: 1 đánh vào tò mò, 1 đánh vào lợi ích, 1 đánh vào cảnh báo.\n2. Viết thân bài theo công thức PAS (Problem - Agitate - Solution).\n3. Đề xuất 3 loại hình ảnh/video tương ứng cho từng mẫu nội dung.\n4. Viết câu kêu gọi hành động (CTA) tối ưu cho nút "Gửi tin nhắn".',
    isVip: true
  },
  { 
    id: 'tiktok-ads-script',
    title: 'Kịch bản TikTok Ads chuyển đổi', 
    category: 'Ads', 
    description: 'Kịch bản video ngắn tối ưu cho chạy quảng cáo TikTok.',
    content: 'Hãy viết một kịch bản quảng cáo TikTok cho [Sản phẩm]. Quy trình:\n1. Hook (0-3s): Đập tan nỗi sợ/đánh vào khao khát của khách hàng ngay lập tức.\n2. Chứng minh: Đưa ra kết quả thực tế/sau khi dùng sản phẩm.\n3. Lời giải: Tại sao sản phẩm của bạn là duy nhất.\n4. Ưu đãi: Lý do họ phải mua NGAY LẬP TỨC (Giảm giá/Quà tặng).\n5. CTA: Hướng dẫn bấm vào nút bên dưới.'
  },

  // --- EMAIL CATEGORY ---
  { 
    id: 'email-marketing',
    title: 'Email Marketing Bán Hàng', 
    category: 'Email', 
    description: 'Viết chuỗi email bán hàng tự động thuyết phục.',
    content: 'Viết một chuỗi 3 email bán hàng cho sản phẩm [Tên sản phẩm]. Quy trình:\n- Email 1: Làm quen và trao giá trị (Tặng quà/Chia sẻ mẹo).\n- Email 2: Khơi gợi nỗi đau và giới thiệu giải pháp (Sản phẩm của bạn).\n- Email 3: Tạo sự khan hiếm (Giảm giá có hạn) và chốt đơn.\nYêu cầu: Tiêu đề email phải cực kỳ thu hút để tăng tỷ lệ mở.'
  },
  { 
    id: 'email-newsletter-mega-pro',
    title: '[MEGA] Hệ thống Email Newsletter triệu đô', 
    category: 'Email', 
    description: 'Quy trình xây dựng danh sách email và kiếm tiền từ bản tin định kỳ.',
    content: 'Bạn là chuyên gia Email Marketing. Hãy lập kế hoạch xây dựng Newsletter cho chủ đề [Chủ đề]. Quy trình:\n1. Chọn ngách & Định vị: Tại sao người ta nên đăng ký nhận email của bạn?\n2. Thu thập Lead: Thiết kế Landing Page và quà tặng (Lead Magnet) để thu hút sub.\n3. Cấu trúc nội dung: Dàn ý cho một bản tin hàng tuần (Tin tức, Kiến thức, Tài nguyên, Quảng cáo).\n4. Chiến lược kiếm tiền: Đề xuất 3 cách (Sponsorship, Affiliate, Bán sản phẩm riêng).\n5. Công cụ vận hành: Gợi ý các nền tảng gửi email hiệu quả và chi phí thấp.',
    isVip: true
  },

  // --- SEO CATEGORY ---
  { 
    id: 'niche-keyword-research',
    title: 'Nghiên cứu từ khóa ngách', 
    category: 'SEO', 
    description: 'Tìm kiếm các từ khóa có độ cạnh tranh thấp.',
    content: 'Tìm cho tôi 20 từ khóa ngách (long-tail keywords) về chủ đề [Chủ đề chính]. Quy trình:\n1. Lọc ra các từ khóa có ý định tìm kiếm (Search Intent) là "Mua hàng" hoặc "Tìm giải pháp".\n2. Sắp xếp theo bảng gồm: Từ khóa, Độ khó ước tính, Lượng tìm kiếm hàng tháng.\n3. Đề xuất tiêu đề bài viết cho 5 từ khóa tiềm năng nhất.'
  },
  { 
    id: 'google-maps-seo-vip-pro',
    title: '[VIP] Tối ưu hóa Google Maps (GMB) chuyên sâu', 
    category: 'SEO', 
    description: 'Cách đưa địa điểm kinh doanh của bạn lên top tìm kiếm địa phương.',
    content: 'Bạn là chuyên gia Local SEO. Hãy tối ưu Google Business Profile cho [Tên doanh nghiệp]. Quy trình:\n1. Tối ưu thông tin cơ bản: Tên, Danh mục, Mô tả chứa từ khóa địa phương.\n2. Chiến lược hình ảnh: Các loại ảnh cần đăng để tăng uy tín và thu hút khách.\n3. Quản lý đánh giá: Cách xin review 5 sao và phản hồi để tăng thứ hạng.\n4. Đăng bài (Posts): Lịch trình đăng tin tức/ưu đãi trên Maps để giữ tương tác.\n5. Trích dẫn (Citations): Danh sách các trang vàng/thư mục cần đăng ký để đồng bộ thông tin.',
    isVip: true
  },

  // --- AUTOMATION CATEGORY ---
  { 
    id: 'lead-gen-automation',
    title: 'Tự động hóa tìm kiếm khách hàng (Lead Gen)', 
    category: 'Automation', 
    description: 'Quy trình tự động hóa thu thập Lead từ LinkedIn/Facebook.',
    content: 'Bạn là một Automation Expert. Hãy thiết kế một quy trình tự động hóa việc thu thập Lead từ [Nguồn: LinkedIn/Facebook] và đưa vào [Google Sheets/CRM].\n\nYêu cầu:\n1. Liệt kê các công cụ cần thiết (Make.com, PhantomBuster, Apollo...).\n2. Mô tả từng bước trong Workflow.\n3. Viết kịch bản cho một con bot tự động gửi tin nhắn chào hỏi cá nhân hóa không vi phạm chính sách cộng đồng.'
  },
  { 
    id: 'omni-channel-auto',
    title: 'Hệ thống Auto-posting đa kênh', 
    category: 'Automation', 
    description: 'Tự động đăng bài từ TikTok sang Reels, Shorts và Facebook.',
    content: 'Bạn là chuyên gia Automation Marketing. Hãy hướng dẫn cách thiết lập hệ thống tự động đăng nội dung từ [Kênh gốc: TikTok/Youtube] sang [Kênh phụ: Reels/Shorts/Facebook].\n\nQuy trình:\n1. Giải pháp xóa Logo/Watermark tự động.\n2. Cách dùng Make.com hoặc Repurpose.io để đồng bộ hóa.\n3. Chiến lược xoay tua nội dung để tránh bị đánh giá "nội dung trùng lặp".'
  },
  { 
    id: 'ai-agent-cs-pro',
    title: 'Xây dựng AI Agent CSKH tự động', 
    category: 'Automation', 
    description: 'Thiết kế Agent AI tự động trả lời thắc mắc và chốt đơn.',
    content: 'Bạn là AI Architect. Hãy thiết kế Prompt cho một Chatbot AI có thể tự động trả lời thắc mắc của khách hàng về [Sản phẩm/Dịch vụ] dựa trên file Knowledge Base [Mô tả sản phẩm].\n\nYêu cầu:\n- Phân tích 10 câu hỏi thường gặp nhất.\n- Thiết lập giọng văn: [Thân thiện/Chuyên nghiệp].\n- Kịch bản dẫn dắt khách hàng từ thắc mắc đến để lại thông tin đặt hàng.'
  },
  { 
    id: 'affiliate-empire-mega-pro',
    title: '[MEGA] Đế chế Affiliate Marketing AI', 
    category: 'Automation', 
    description: 'Quy trình từ A-Z để xây dựng nguồn thu nhập thụ động bền vững.',
    content: 'Bạn là triệu phú Affiliate Marketing. Hãy xây dựng lộ trình thành công cho tôi trong ngách [Ngách sản phẩm]. Quy trình 6 giai đoạn:\n1. Giai đoạn Nghiên cứu (Niche Research): Tìm 5 sản phẩm có hoa hồng cao (>30%) và tỷ lệ chuyển đổi tốt trên Shopee/Lazada/Amazon.\n2. Giai đoạn Xây dựng nền tảng (Platform Setup): Hướng dẫn lập kênh TikTok/Reels/Shorts tối ưu cho Affiliate.\n3. Giai đoạn Sản xuất nội dung hàng loạt (Content Machine): Quy trình dùng AI để tạo 3 video/ngày mà không cần lộ mặt.\n4. Giai đoạn Tối ưu hóa chuyển đổi (Conversion Hack): Cách viết Bio, gắn link và dùng "Call to action" để khách bấm mua ngay.\n5. Giai đoạn Thu hút traffic miễn phí (Traffic Secrets): Bí quyết dùng Hashtag và khung giờ đăng bài để video dễ lên xu hướng.\n6. Giai đoạn Tự động hóa & Mở rộng (Scaling): Cách thuê nhân sự hoặc dùng công cụ để vận hành 10 kênh cùng lúc.',
    isVip: true
  },
  
  // --- SALES CATEGORY ---
  { 
    id: 'livestream-script-vip-pro',
    title: '[VIP] Kịch bản Livestream bán hàng bùng nổ', 
    category: 'Sales', 
    description: 'Cấu trúc kịch bản giữ chân người xem và chốt đơn liên tục trên Live.',
    content: 'Bạn là bậc thầy Livestream. Hãy viết kịch bản Live cho buổi bán [Sản phẩm]. Quy trình:\n1. Mở đầu (10 phút đầu): Cách kéo người xem vào và tạo không khí sôi động.\n2. Giới thiệu sản phẩm: Cách trình bày tính năng và lợi ích một cách trực quan.\n3. Tạo game/quà tặng: Cách lồng ghép mini-game để tăng tương tác và giữ chân người xem.\n4. Kịch bản chốt đơn: Cách hô hào và tạo sự khan hiếm (Flash sale) để khách comment mua ngay.\n5. Xử lý thắc mắc: Chuẩn bị câu trả lời cho 5 câu hỏi phổ biến nhất trên Live.',
    isVip: true
  },
  { 
    id: 'high-ticket-closing-vip',
    title: '[VIP] Sát thủ chốt đơn Sale High-Ticket', 
    category: 'Sales', 
    description: 'Kỹ thuật chốt đơn hàng giá trị cao bằng tâm lý học hành vi.',
    content: 'Bạn là bậc thầy bán hàng với tỷ lệ chốt 80% cho các gói dịch vụ trên 5,000$. Hãy xây dựng kịch bản tư vấn hoàn hảo cho [Dịch vụ của tôi].\n\n### PHẦN 1: THIẾT LẬP VỊ THẾ (0-5 PHÚT)\n- Kỹ thuật phá băng (Ice breaking) dựa trên nghiên cứu hồ sơ khách hàng trước đó.\n- Khẳng định vị thế chuyên gia thông qua việc tóm tắt vấn đề của khách hàng nhanh chóng.\n\n### PHẦN 2: CHẨN ĐOÁN NỖI ĐAU (THE DIAGNOSIS)\n- Đặt 5 câu hỏi "Sâu" (Deep questions) để khách hàng tự thừa nhận sự mất mát nếu không giải quyết vấn đề ngay.\n- Kỹ thuật "Spin Selling" để khách hàng thấy được tầm quan trọng của giải pháp.\n\n### PHẦN 3: TRÌNH BÀY GIÁ TRỊ (VALUE PROPOSITION)\n- Tập trung vào "Kết quả cuối cùng" thay vì "Tính năng kỹ thuật".\n- Sử dụng Case study tương tự để chứng minh hiệu quả.\n\n### PHẦN 4: XỬ LÝ TỪ CHỐI (OBJECTION HANDLING)\n- Chống lại câu hỏi về giá: "Giá cao so với cái gì?" và "Giá trị của việc KHÔNG làm gì là bao nhiêu?".\n- Chống lại việc "Để suy nghĩ thêm": Kỹ thuật đóng khung thời gian và sự khan hiếm thực sự.\n\n### PHẦN 5: CHỐT ĐƠN (THE CLOSE)\n- Kỹ thuật "Assumption Close": Coi như khách hàng đã đồng ý và bắt đầu bàn về bước triển khai.\n- Cam kết hỗ trợ đặc biệt để xóa bỏ nỗi sợ rủi ro.',
    isVip: true
  },
  { 
    id: 'objection-handling-master',
    title: 'Xử lý từ chối Sales chuyên sâu', 
    category: 'Sales', 
    description: 'NLP và ngôn ngữ tâm lý để vượt qua mọi lời từ chối.',
    content: 'Hãy soạn thảo nội dung xử lý từ chối cho [Sản phẩm]. Quy trình:\n1. Đồng cảm: Xác nhận sự lo lắng của khách hàng.\n2. Cô lập vấn đề: Chắc chắn đây là rào cản duy nhất.\n3. Đặt câu hỏi: Để họ tự thấy giải pháp trong câu trả lời của họ.\n4. Giải quyết: Cung cấp bằng chứng/case study thành công.'
  },

  // --- E-COMMERCE CATEGORY ---
  { 
    id: 'etsy-digital-mega-pro',
    title: '[MEGA] Kiếm tiền Etsy với sản phẩm số AI', 
    category: 'E-commerce', 
    description: 'Cách tạo và bán sản phẩm kỹ thuật số (Digital Products) trên Etsy.',
    content: 'Bạn là chuyên gia bán hàng trên Etsy. Hãy lập kế hoạch cho cửa hàng bán [Loại sản phẩm kỹ thuật số]. Quy trình:\n1. Nghiên cứu ngách: Tìm các sản phẩm đang bán chạy nhưng ít cạnh tranh.\n2. Sản xuất sản phẩm: Cách dùng AI (Midjourney, ChatGPT, Canva) để tạo file chất lượng cao.\n3. Tối ưu hóa SEO Etsy: Cách viết tiêu đề và 13 thẻ (Tags) để khách hàng dễ tìm thấy.\n4. Chiến lược hình ảnh: Cách tạo Mockup chuyên nghiệp cho sản phẩm kỹ thuật số.\n5. Chăm sóc khách hàng: Các mẫu tin nhắn tự động để tăng tỷ lệ đánh giá 5 sao.',
    isVip: true
  },
  { 
    id: 'product-description-shopee-vip',
    title: '[VIP] Mô tả sản phẩm TMĐT "Thôi miên"', 
    category: 'E-commerce', 
    description: 'Viết mô tả sản phẩm Shopee/Lazada khiến khách hàng mua ngay.',
    content: 'Viết mô tả sản phẩm cho [Tên sản phẩm]. Quy trình:\n1. Pain Point: Đề cập trực tiếp vấn đề khách hàng đang gặp.\n2. Solution: Cách sản phẩm giải quyết vấn đề đó hoàn hảo.\n3. Highlight: 5 lợi ích vượt trội nhất.\n4. Trust: Thông số, bảo hành, cam kết.\n5. Call to action: Ưu đãi chỉ dành cho hôm nay.'
  },
  { 
    id: 'review-response-pro',
    title: 'Phản hồi đánh giá 5 sao chuyên nghiệp', 
    category: 'E-commerce', 
    description: 'Chăm sóc khách hàng qua review để tăng tỷ lệ quay lại.',
    content: 'Hãy viết 5 mẫu phản hồi cho khách hàng đánh giá 5 sao. Yêu cầu:\n- Chứa từ khóa sản phẩm để hỗ trợ SEO.\n- Thể hiện sự trân trọng và cá nhân hóa.\n- Kèm lời mời follow gian hàng để nhận voucher cho lần sau.'
  },

  { 
    id: 'personal-brand-auto-vip',
    title: '[VIP] Tự động hóa nhân hiệu 0đ', 
    category: 'Automation', 
    description: 'Quy trình phủ sóng đa kênh từ 1 nội dung gốc duy nhất.',
    content: 'Bạn là chuyên gia về Omni-channel Marketing. Hãy xây dựng quy trình tự động hóa nhân hiệu cho tôi.\n\n### BƯỚC 1: NỘI DUNG GỐC (PILLAR CONTENT)\n- Cách quay 1 video dài 10 phút chia sẻ kiến thức chuyên sâu.\n- Sử dụng AI để bóc tách 10 ý chính từ video này.\n\n### BƯỚC 2: PHÂN TÁCH ĐA KÊNH\n- 1 Video dài -> 5 Video Shorts/Reels/TikTok (Dùng OpusClip hoặc Munch).\n- 1 Video dài -> 2 Bài blog chuẩn SEO (Dùng ChatGPT).\n- 1 Video dài -> 10 Quotes cho Threads/X.\n\n### BƯỚC 3: PHÂN PHỐI TỰ ĐỘNG\n- Thiết lập lịch đăng bài tự động bằng Metricool hoặc Buffer.\n- Sử dụng Bot để tự động trả lời comment của khách hàng trong 5 phút đầu.',
    isVip: true
  },
  { 
    id: 'fb-ads-scale-mega',
    title: '[MEGA] Scale Facebook Ads x10 ngân sách', 
    category: 'Ads', 
    description: 'Chiến thuật giữ vững ROI khi tăng ngân sách quảng cáo lớn.',
    content: 'Bạn là Media Buyer cấp cao. Hãy lập kế hoạch Scale ngân sách từ 1 triệu -> 10 triệu/ngày cho [Sản phẩm].\n\n### PHẦN 1: KIỂM TRA SẴN SÀNG (AUDIT)\n- Chỉ số CPM, CTR, CR bao nhiêu là an toàn để scale?\n- Kiểm tra tốc độ load Landing page và kịch bản CSKH.\n\n### PHẦN 2: CHIẾN THUẬT SCALE NGANG (HORIZONTAL SCALING)\n- Nhân bản nhóm quảng cáo sang các tệp đối tượng tương tự (Lookalike 1%, 2%, 5%).\n- Thử nghiệm trên các nền tảng khác: Reels, Audience Network.\n\n### PHẦN 3: CHIẾN THUẬT SCALE DỌC (VERTICAL SCALING)\n- Tăng ngân sách 20% sau mỗi 24h nếu ROAS ổn định.\n- Sử dụng quy tắc tự động (Automated Rules) để tắt camp/tăng tiền.\n\n### PHẦN 4: CHỐNG "BÃO" QUẢNG CÁO\n- Cách luân phiên nội dung (Creative Refresh) để tránh nhàm chán quảng cáo.\n- Dự phòng tài khoản quảng cáo và BM.',
    isVip: true
  },
  { 
    id: 'seo-backlink-vip',
    title: '[VIP] Chiến lược xây dựng Backlink chất lượng', 
    category: 'SEO', 
    description: 'Cách sở hữu liên kết từ các website uy tín mà không mất phí.',
    content: 'Bạn là chuyên gia Link Building. Hãy thiết kế chiến dịch Backlink cho website [URL].\n\n### KỸ THUẬT 1: GUEST POSTING THÔNG MINH\n- Cách tìm website cùng ngách và đề xuất nội dung giá trị để họ đăng tin.\n- Mẫu email xin Guest Post tỷ lệ phản hồi cao.\n\n### KỸ THUẬT 2: SKY SCRAPER TECHNIQUE\n- Tìm nội dung tốt nhất của đối thủ và tạo ra nội dung tốt gấp đôi.\n- Tiếp cận những người đang link đến đối thủ để họ trỏ link về bạn.\n\n### KỸ THUẬT 3: BROKEN LINK BUILDING\n- Tìm các link hỏng trên các trang uy tín và đề xuất link của bạn để thay thế.',
    isVip: true
  },
  // --- MARKETING CATEGORY ---
  { 
    id: 'customer-avatar-pro',
    title: 'Phác họa chân dung khách hàng mục tiêu', 
    category: 'Marketing', 
    description: 'Xác định chính xác đối tượng để tối ưu hóa ngân sách.',
    content: 'Hãy phác họa chân dung khách hàng cho [Sản phẩm]. Quy trình:\n1. Nhân khẩu học: Độ tuổi, giới tính, thu nhập.\n2. Tâm lý học: Sở thích, thói quen, giá trị sống.\n3. Vấn đề: Họ đang lo lắng điều gì nhất?\n4. Kênh tiếp cận: Họ ở đâu trên môi trường online?'
  },
  { 
    id: 'branding-positioning-vip',
    title: '[VIP] Chiến lược định vị thương hiệu', 
    category: 'Marketing', 
    description: 'Làm thế nào để trở nên khác biệt trong mắt khách hàng.',
    content: 'Hãy thiết kế định vị thương hiệu cho [Tên thương hiệu]. Quy trình:\n1. USP (Unique Selling Point): Điểm bán hàng độc nhất của bạn.\n2. Sứ mệnh & Tầm nhìn: Bạn mang lại giá trị gì cho xã hội?\n3. Giọng văn (Tone of voice): Bạn muốn khách hàng nhớ đến mình như thế nào?\n4. Đối thủ: Sự khác biệt lớn nhất giữa bạn và họ là gì?',
    isVip: true
  },
  { 
    id: 'launch-strategy-mega-pro',
    title: '[MEGA] Chiến lược Launch sản phẩm Triệu Đô', 
    category: 'Marketing', 
    description: 'Quy trình Product Launch chuẩn quốc tế từ A-Z.',
    content: 'Bạn là chuyên gia Marketing bậc thầy, nổi tiếng với các chiến dịch ra mắt sản phẩm triệu đô. Hãy lập kế hoạch Launch cho [Sản phẩm của tôi].\n\n### GIAI ĐOẠN 1: PRE-LAUNCH (TẠO SỰ TÒ MÒ - 14 NGÀY TRƯỚC)\n- Ngày 1-3: Content "Cảnh báo" về một xu hướng/vấn đề lớn mà sản phẩm sẽ giải quyết.\n- Ngày 4-7: Series Video "Đằng sau hậu trường" quá trình phát triển sản phẩm.\n- Ngày 8-14: Chiến dịch "Waitlist" - Tặng quà đặc biệt cho những người đăng ký sớm.\n\n### GIAI ĐOẠN 2: LAUNCH WEEK (TUẦN LỄ BÙNG NỔ)\n- Ngày 1: Webinar/Livestream ra mắt - Tặng ưu đãi "Early Bird" chỉ trong 2 giờ đầu.\n- Ngày 2-3: Series Video Feedback từ những người dùng thử (Beta Testers).\n- Ngày 4-5: Content "Giải đáp thắc mắc" và "So sánh sản phẩm" để xóa bỏ rào cản mua hàng.\n- Ngày 6-7: Tạo sự khan hiếm thực sự - "Chỉ còn 10 suất ưu đãi cuối cùng" hoặc "Giá sẽ tăng vào ngày mai".\n\n### GIAI ĐOẠN 3: POST-LAUNCH (DUY TRÌ VÀ REMARKETING)\n- Gửi email/tin nhắn cho những người đã mở link nhưng chưa thanh toán.\n- Content "Welcome" cho cộng đồng khách hàng mới để giảm tỷ lệ hoàn tiền.\n- Chiến lược xin Feedback và giới thiệu khách hàng mới (Referral).',
    isVip: true
  },
];

interface VideoTutorial {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category: string;
  level: 'Cơ bản' | 'Nâng cao';
  views: string;
  url: string;
}

const VIDEOS: VideoTutorial[] = [
  {
    id: 'v1',
    title: 'Cách tạo 100 video TikTok/tháng với AI',
    thumbnail: 'https://picsum.photos/seed/vid1/800/450',
    duration: '12:45',
    category: 'Video',
    level: 'Cơ bản',
    views: '1.2k',
    url: '#'
  },
  {
    id: 'v2',
    title: 'Làm chủ Midjourney trong 15 phút',
    thumbnail: 'https://picsum.photos/seed/vid2/800/450',
    duration: '15:20',
    category: 'Design',
    level: 'Cơ bản',
    views: '2.5k',
    url: '#'
  },
  {
    id: 'v3',
    title: 'Xây dựng hệ thống Affiliate tự động với AI',
    thumbnail: 'https://picsum.photos/seed/vid3/800/450',
    duration: '25:10',
    category: 'Automation',
    level: 'Nâng cao',
    views: '800',
    url: '#'
  },
  {
    id: 'v4',
    title: 'Tối ưu SEO Shopee bằng ChatGPT Pro',
    thumbnail: 'https://picsum.photos/seed/vid4/800/450',
    duration: '18:30',
    category: 'E-commerce',
    level: 'Cơ bản',
    views: '1.8k',
    url: '#'
  }
];

const BLOG_POSTS = [
  { 
    title: 'Con đường sự nghiệp và phát triển - Số Chủ Đạo 1', 
    date: '17/04/2024', 
    tag: 'Video',
    content: `
<div class="video-container">
  <iframe src="https://www.youtube.com/embed/HWufRUXZW50?modestbranding=1" width="1280" height="720" frameborder="0" allow="autoplay">
  </iframe>
</div>

## Con đường sự nghiệp và phát triển

Với tố chất lãnh đạo bẩm sinh, người **Số Chủ Đạo 1** phù hợp với các vị trí quản lý, điều hành hoặc những nghề nghiệp đòi hỏi sự sáng tạo và độc lập. Họ thường thành công trong các lĩnh vực:

- **Lãnh đạo & Quản lý:** Giám đốc, trưởng phòng, quản lý dự án.
- **Khởi nghiệp:** Chủ doanh nghiệp, người sáng lập.
- **Sáng tạo:** Nhà thiết kế, nghệ sĩ, kiến trúc sư.
- **Chuyên gia độc lập:** Tư vấn viên, Freelancer chuyên nghiệp.

Họ là những người tiên phong, luôn đi đầu trong mọi hoạt động và có khả năng truyền cảm hứng mạnh mẽ cho cộng đồng.
    `
  },
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
  { 
    title: 'Hướng dẫn Paperclip AI: Cách xây dựng một công ty không cần con người', 
    date: '16/04/2024', 
    tag: 'Xu hướng',
    content: `
# Hướng dẫn Paperclip AI: Cách xây dựng một công ty không cần con người

Trong kỷ nguyên AI, việc vận hành một doanh nghiệp mà không cần nhân sự truyền thống đang trở thành hiện thực. Paperclip AI là một chiến lược tập trung vào việc tự động hóa tối đa các quy trình kinh doanh.

## 1. Paperclip AI là gì?
Paperclip AI không chỉ là một công cụ đơn lẻ, mà là một tư duy hệ thống. Nó dựa trên ý tưởng về việc sử dụng các "Agent AI" (đại lý AI) có khả năng tự suy luận, lập kế hoạch và thực thi các nhiệm vụ phức tạp mà không cần sự can thiệp liên tục của con người.

## 2. Các trụ cột của doanh nghiệp không con người

### Trụ cột 1: Thu thập và Xử lý dữ liệu tự động
Sử dụng các công cụ cào dữ liệu (scraping) kết hợp với AI để phân tích thị trường 24/7.
- **Công cụ:** Browse.ai, Apify, OpenAI API.

### Trụ cột 2: Sáng tạo nội dung và Marketing tự động
Thiết lập các workflow tự động sản xuất bài viết, hình ảnh và video dựa trên xu hướng đang hot.
- **Công cụ:** Make.com, Jasper, HeyGen.

### Trụ cột 3: Chăm sóc khách hàng bằng AI Agent
Sử dụng chatbot thế hệ mới có khả năng hiểu ngữ cảnh và chốt đơn thực sự.
- **Công cụ:** Chatbase, Intercom Fin.

## 3. Quy trình 4 bước để bắt đầu
1. **Module hóa quy trình:** Chia nhỏ mọi hoạt động của công ty thành các bước logic.
2. **Kịch bản hóa (Prompt Engineering):** Viết các "hướng dẫn vận hành" cực kỳ chi tiết cho AI.
3. **Kết nối hệ sinh thái (Automation Glue):** Dùng Make.com hoặc Zapier để kết nối các tool lại với nhau.
4. **Giám sát (Human-in-the-loop):** Bạn chỉ cần đóng vai trò là người kiểm soát cuối cùng hoặc xử lý các ngoại lệ.

## 4. Kết luận
Xây dựng một công ty "Paperclip AI" không phải là để đuổi việc con người, mà là để giải phóng con người khỏi những công việc lặp đi lặp lại, cho phép chúng ta tập trung vào sáng tạo và chiến lược vĩ mô.

Bắt đầu ngay hôm nay bằng cách tự động hóa một quy trình nhỏ nhất trong công việc của bạn!
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
  const [userRole, setUserRole] = useState<'free' | 'pro' | 'admin'>('free'); // Changed back to active role for logic
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const AI_DAILY_LIMIT = 5;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  
  // Firebase State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSubmittingEbook, setIsSubmittingEbook] = useState(false);
  const [ebookFormData, setEbookFormData] = useState({ fullName: '', email: '' });
  const [activeQuickTool, setActiveQuickTool] = useState<string | null>(null);
  const [quickToolInput, setQuickToolInput] = useState('');
  const [quickToolOutput, setQuickToolOutput] = useState('');
  const [isQuickToolLoading, setIsQuickToolLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [firestoreBlogPosts, setFirestoreBlogPosts] = useState<any[]>([]);
  const [firestorePrompts, setFirestorePrompts] = useState<any[]>([]);

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: currentUser?.uid,
        email: currentUser?.email,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    // Optionally show a toast or error boundary
  };

  // Fetch Data
  useEffect(() => {
    const fetchPrompts = onSnapshot(collection(db, 'prompts'), (snapshot) => {
      const promptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestorePrompts(promptsData);
      setIsLoadingPrompts(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'prompts');
      setIsLoadingPrompts(false);
    });

    const fetchBlogPosts = onSnapshot(collection(db, 'blog_posts'), (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestoreBlogPosts(blogData);
      setIsLoadingBlog(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'blog_posts');
      setIsLoadingBlog(false);
    });

    const fetchCss = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setGlobalCustomCss(doc.data().customCss || '');
      }
    }, (error) => {
      handleFirestoreError(error, 'get', 'settings/global');
    });

    return () => {
      fetchPrompts();
      fetchBlogPosts();
      fetchCss();
    };
  }, []);
  const [isLoadingBlog, setIsLoadingBlog] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [activeBlogCategory, setActiveBlogCategory] = useState('Tất cả');
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'admin' | 'roadmap' | 'hooks' | 'ideas'>('home');
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const [globalCustomCss, setGlobalCustomCss] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);

  const BLOG_CATEGORIES = ['Tất cả', 'Yêu thích', 'Content', 'E-commerce', 'Video', 'Marketing', 'Sales', 'SEO'];

  const allBlogPosts = [...firestoreBlogPosts, ...BLOG_POSTS];

  const filteredBlogPosts = allBlogPosts.filter(post => {
    if (activeBlogCategory === 'Tất cả') return true;
    if (activeBlogCategory === 'Yêu thích') return favorites.includes(post.id || post.title);
    return post.tag === activeBlogCategory;
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const allPrompts = [...firestorePrompts, ...PROMPTS];
  const categories = ['Tất cả', 'Yêu thích', 'Content', 'Social Media', 'Ads', 'Email', 'SEO', 'Automation', 'Sales', 'E-commerce', 'Marketing'];
  
  const filteredPrompts = allPrompts.filter(p => {
    if (activeCategory === 'Tất cả') return true;
    if (activeCategory === 'Yêu thích') return favorites.includes(p.id);
    return p.category === activeCategory;
  });

  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = filteredPrompts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCopy = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    if (index !== undefined) setCopiedIndex(index);
    setToastMessage('Đã sao chép vào bộ nhớ tạm!');
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      if (index !== undefined) setCopiedIndex(null);
    }, 2000);
  };

  const openPromptEditor = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    const vars: Record<string, string> = {};
    const matches = (prompt.content.match(/\[(.*?)\]/g) || []) as string[];
    matches.forEach((m: string) => {
      const key = m.slice(1, -1);
      vars[key] = '';
    });
    setPromptVariables(vars);
    setPromptResult('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getFinalPrompt = () => {
    if (!editingPrompt) return '';
    let content = editingPrompt.content;
    Object.entries(promptVariables).forEach(([key, value]) => {
      content = content.replace(`[${key}]`, value || `[${key}]`);
    });
    return content;
  };

  const runPromptWithAI = async () => {
    if (!editingPrompt) return;
    
    if (userRole === 'free' && aiUsageCount >= AI_DAILY_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }

    setIsPromptRunning(true);
    try {
      const finalPrompt = getFinalPrompt();
      const result = await runCustomPrompt(finalPrompt);
      setPromptResult(result);
      if (userRole === 'free') setAiUsageCount(prev => prev + 1);
    } catch (error) {
      console.error(error);
      setPromptResult('Có lỗi xảy ra khi chạy AI. Vui lòng thử lại.');
    } finally {
      setIsPromptRunning(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interests) return;

    if (userRole === 'free' && aiUsageCount >= AI_DAILY_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateSideHustleIdea(interests);
      setAiResult(result);
      if (userRole === 'free') setAiUsageCount(prev => prev + 1);
    } catch (error) {
      console.error(error);
      setAiResult('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEbook(true);
    try {
      await addDoc(collection(db, 'subscribers'), {
        ...ebookFormData,
        type: 'ebook_download',
        timestamp: serverTimestamp()
      });
      setEmailSubscribed(true);
      setToastMessage('Cảm ơn bạn! Link tải Ebook đã được gửi vào email.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingEbook(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToastMessage('Đã đăng xuất thành công');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickToolInput || !activeQuickTool) return;
    setIsQuickToolLoading(true);
    setQuickToolOutput('');

    let systemPrompt = '';
    switch (activeQuickTool) {
      case 'seo-blog':
        systemPrompt = `Bạn là một chuyên gia SEO và Content Marketing. Hãy tạo một dàn ý chi tiết và nội dung bài viết chuẩn SEO cho từ khóa: "${quickToolInput}". Bài viết cần có các thẻ H1, H2, H3, danh sách và lời khuyên tối ưu.`;
        break;
      case 'translate':
        systemPrompt = `Bạn là một biên dịch viên chuyên nghiệp. Hãy dịch đoạn văn bản sau sang tiếng Việt một cách tự nhiên, trôi chảy như người bản xứ: "${quickToolInput}".`;
        break;
      case 'image-prompt':
        systemPrompt = `Bạn là một chuyên gia tạo Prompt cho AI tạo ảnh (Midjourney, DALL-E). Hãy tạo một Prompt chi tiết, chuyên nghiệp bằng tiếng Anh dựa trên ý tưởng: "${quickToolInput}". Bao gồm các thông số về ánh sáng, phong cách, ống kính.`;
        break;
      case 'code-assist':
        systemPrompt = `Bạn là một kỹ sư phần mềm cao cấp. Hãy giải thích, tối ưu hóa hoặc sửa lỗi cho đoạn mã/câu hỏi sau: "${quickToolInput}". Trả lời rõ ràng, kèm ví dụ nếu cần.`;
        break;
    }

    try {
      const result = await runCustomPrompt(systemPrompt);
      setQuickToolOutput(result);
    } catch (error) {
      console.error(error);
      setQuickToolOutput('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsQuickToolLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers({});
    setShowQuizResult(false);
  };

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch or create user profile in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'free');
          } else {
            // Create new profile
            const isDefaultAdmin = user.email === 'tranbaosadec@gmail.com' || user.email === 'admin@ai-hustle-phi.vercel.app' || user.email === 'chucly2879@gmail.com';
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Người dùng',
              role: isDefaultAdmin ? 'admin' : 'free',
              status: 'active',
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, newProfile);
            setUserRole(isDefaultAdmin ? 'admin' : 'free');
          }
        } catch (error) {
          console.error("Error managing user profile:", error);
          // Fallback
          if (user.email === 'tranbaosadec@gmail.com' || user.email === 'admin@ai-hustle-phi.vercel.app' || user.email === 'chucly2879@gmail.com') {
            setUserRole('admin');
          } else {
            setUserRole('free');
          }
        }
      } else {
        setUserRole('free');
      }
    });
    return () => unsubscribe();
  }, []);

  const libraryContent = (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-2">Thư viện của tôi</h2>
        <p className="text-gray-500">Nơi lưu trữ các Prompt và bài viết bạn đã yêu thích.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
            Prompt đã lưu ({favorites.filter(id => allPrompts.some(p => p.id === id)).length})
          </h3>
          <div className="space-y-4">
            {allPrompts.filter(p => favorites.includes(p.id)).map((prompt) => (
              <div key={prompt.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-orange-200 transition-all flex items-center justify-between group">
                <div>
                  <h4 className="font-bold mb-1">{prompt.title}</h4>
                  <p className="text-xs text-gray-400">{prompt.category}</p>
                </div>
                <button 
                  onClick={() => openPromptEditor(prompt)}
                  className="p-3 bg-gray-50 text-gray-400 hover:bg-orange-500 hover:text-white rounded-xl transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
            {favorites.filter(id => allPrompts.some(p => p.id === id)).length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400">
                Chưa có Prompt nào được lưu.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Bài viết đã lưu ({favorites.filter(id => allBlogPosts.some(p => (p.id || p.title) === id)).length})
          </h3>
          <div className="space-y-4">
            {allBlogPosts.filter(p => favorites.includes(p.id || p.title)).map((post, idx) => (
              <div key={idx} onClick={() => setSelectedPost(post)} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer flex items-center gap-4 group">
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  <img src={`https://picsum.photos/seed/${post.title}/200/200`} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-1 group-hover:text-blue-500 transition-colors">{post.title}</h4>
                  <p className="text-xs text-gray-400">{post.date}</p>
                </div>
              </div>
            ))}
            {favorites.filter(id => allBlogPosts.some(p => (p.id || p.title) === id)).length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400">
                Chưa có bài viết nào được lưu.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const mainContent = (
    <>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-orange-200">
              Cộng đồng AI Hustle Việt Nam
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
              Biến AI thành <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Cỗ Máy Kiếm Tiền</span>
            </h1>
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Khám phá lộ trình cá nhân hóa, thư viện Prompt thực chiến và cộng đồng Freelancer AI hàng đầu Việt Nam.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => {
                  const el = document.getElementById('generator');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-2 group"
              >
                Bắt đầu ngay <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('prompts');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-10 py-5 bg-white border border-gray-200 text-gray-900 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                Khám phá Prompt
              </button>
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-bold">10k+</div>
                <div className="text-[10px] uppercase font-bold tracking-widest">Thành viên</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-[10px] uppercase font-bold tracking-widest">Prompt VIP</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-bold">1.2k</div>
                <div className="text-[10px] uppercase font-bold tracking-widest">Case Study</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-bold">98%</div>
                <div className="text-[10px] uppercase font-bold tracking-widest">Hài lòng</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Roadmap Promo Banner */}
      <section className="pb-24 px-4">
        <div 
          onClick={() => {
            if (userRole === 'pro') setActiveTab('roadmap');
            else setShowUpgradeModal(true);
          }}
          className="max-w-7xl mx-auto bg-gradient-to-r from-gray-900 to-black rounded-[40px] p-8 md:p-12 relative overflow-hidden group cursor-pointer border border-white/5"
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-500/10 skew-x-12 translate-x-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-lg mb-6 shadow-lg shadow-orange-500/20">
                Chiến lược miễn phí
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                Lộ trình chi tiết <br /> 
                <span className="text-orange-500 underline decoration-2 underline-offset-8">Đạt 1.000 User Đầu Tiên</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                Công thức 4 giai đoạn chuẩn hóa từ TikTok/Reels về Website giúp bạn xây dựng cộng đồng bền vững.
              </p>
              <div className="flex items-center gap-4 text-white font-bold">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800" />)}
                </div>
                <span className="text-sm opacity-80">+1.2k người đã xem chiến lược này</span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
                <button className="relative px-12 py-6 bg-white text-black rounded-3xl font-black text-xl hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
                  Xem lộ trình ngay <TrendingUp className="w-6 h-6 text-orange-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hook Lab Promo Banner */}
      <section className="pb-24 px-4 overflow-hidden">
        <div 
          onClick={() => {
            if (userRole === 'pro') setActiveTab('hooks');
            else setShowUpgradeModal(true);
          }}
          className="max-w-7xl mx-auto bg-white rounded-[40px] p-8 md:p-12 relative overflow-hidden group cursor-pointer border border-gray-100 shadow-xl shadow-orange-500/5"
        >
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] group-hover:bg-orange-500/10 transition-colors duration-700" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg shadow-sm border border-red-200">
                  Phòng thí nghiệm Hook
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                  <Clock className="w-3 h-3" /> Chỉ 3 giây để thắng cuộc
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Làm Video AI? <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Đừng để họ lướt qua!</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8 max-w-md leading-relaxed">
                Khám phá 5 công thức tâm lý học giúp video của bạn bùng nổ view ngay từ giây đầu tiên.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600">
                  <Target className="w-4 h-4 text-orange-500" /> Tỉ lệ giữ chân +45%
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600">
                  <Play className="w-4 h-4 text-red-500" /> Viral dễ dàng hơn
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[400px]">
                <div className="absolute inset-0 bg-red-500/20 rounded-[32px] blur-3xl group-hover:bg-red-500/30 transition-all" />
                <div className="relative bg-black rounded-[32px] p-6 shadow-2xl transform group-hover:rotate-1 group-hover:scale-105 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-gray-400">Hot Formula</div>
                      <div className="text-white font-bold text-sm">Gây sốc bằng con số</div>
                    </div>
                  </div>
                  <div className="text-gray-300 italic text-sm mb-6 leading-relaxed">
                    "Cái video này mình làm trong đúng 47 giây — bằng AI, không cần edit."
                  </div>
                  <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
                    Lấy công thức ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Side Hustle Quiz Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="bg-gray-50 rounded-[48px] p-8 md:p-16 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -z-10" />
            
            {!showQuizResult ? (
              <div className="text-center">
                <AnimatePresence mode="wait">
                  {quizStep === 0 && (
                    <motion.div 
                      key="step0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <span className="inline-block px-4 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                        Interactive Quiz
                      </span>
                      <h2 className="text-3xl md:text-4xl font-bold mb-6">Tìm kiếm "Nghề tay trái" AI phù hợp nhất với bạn?</h2>
                      <p className="text-gray-500 mb-10">Chỉ mất 30 giây để AI phân tích kỹ năng và thời gian của bạn.</p>
                      <button 
                        onClick={() => setQuizStep(1)}
                        className="px-10 py-5 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-black/10"
                      >
                        Bắt đầu ngay
                      </button>
                    </motion.div>
                  )}

                  {quizStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-bold mb-8">Kỹ năng thế mạnh của bạn là gì?</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['Viết lách', 'Thiết kế', 'Công nghệ', 'Bán hàng'].map((opt) => (
                          <button 
                            key={opt}
                            onClick={() => { setQuizAnswers({...quizAnswers, skill: opt}); setQuizStep(2); }}
                            className="p-6 bg-white border border-gray-200 rounded-2xl font-bold hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex items-center justify-between group"
                          >
                            {opt}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {quizStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-bold mb-8">Bạn có bao nhiêu thời gian rảnh mỗi ngày?</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['Dưới 1 giờ', '1 - 3 giờ', 'Trên 3 giờ'].map((opt) => (
                          <button 
                            key={opt}
                            onClick={() => { setQuizAnswers({...quizAnswers, time: opt}); setQuizStep(3); }}
                            className="p-6 bg-white border border-gray-200 rounded-2xl font-bold hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex items-center justify-between group"
                          >
                            {opt}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {quizStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-bold mb-8">Mục tiêu thu nhập hàng tháng của bạn?</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['Dưới 5 triệu', '5 - 20 triệu', 'Trên 20 triệu'].map((opt) => (
                          <button 
                            key={opt}
                            onClick={() => { setQuizAnswers({...quizAnswers, income: opt}); setShowQuizResult(true); }}
                            className="p-6 bg-white border border-gray-200 rounded-2xl font-bold hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex items-center justify-between group"
                          >
                            {opt}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Kết quả của bạn!</h3>
                <p className="text-gray-500 mb-8">Dựa trên phân tích, công việc phù hợp nhất với bạn là:</p>
                <div className="bg-white p-8 rounded-3xl border border-orange-200 shadow-xl shadow-orange-500/5 mb-10">
                  <h4 className="text-2xl font-bold text-orange-500 mb-2">
                    {quizAnswers.skill === 'Viết lách' ? 'Content Creator AI' : 
                     quizAnswers.skill === 'Thiết kế' ? 'AI Artist / Designer' :
                     quizAnswers.skill === 'Công nghệ' ? 'AI Automation Specialist' : 'AI Sales Closer'}
                  </h4>
                  <p className="text-sm text-gray-600">Tiềm năng thu nhập: {quizAnswers.income}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => {
                      const el = document.getElementById('prompts');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
                  >
                    Xem Prompt hỗ trợ
                  </button>
                  <button 
                    onClick={resetQuiz}
                    className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Làm lại Quiz
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Quick AI Tools Bento Grid */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Công cụ AI hỗ trợ nhanh</h2>
            <p className="text-gray-500">Tiết kiệm hàng giờ làm việc mỗi ngày với các công cụ tối ưu sẵn.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 md:row-span-2 bg-black text-white p-10 rounded-[40px] relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/40 transition-colors" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-orange-500/20">
                  <PenTool className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Viết bài Blog chuẩn SEO</h3>
                <p className="text-gray-400 mb-8 flex-1">Tạo dàn ý và nội dung bài viết chuyên sâu chỉ với một từ khóa chính. Tối ưu hóa cho Google Search.</p>
                <button className="w-fit px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2">
                  Thử ngay <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 hover:border-orange-200 transition-all group cursor-pointer">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <Languages className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dịch thuật chuyên sâu</h3>
              <p className="text-sm text-gray-500">Dịch thuật tài liệu chuyên ngành với văn phong tự nhiên như người bản xứ.</p>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 hover:border-orange-200 transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Tạo Prompt Ảnh</h3>
              <p className="text-xs text-gray-500">Mô tả ý tưởng, AI sẽ tạo Prompt cho Midjourney/DALL-E.</p>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 hover:border-orange-200 transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-6">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Hỗ trợ Code</h3>
              <p className="text-xs text-gray-500">Giải thích và tối ưu hóa các đoạn mã lập trình phức tạp.</p>
            </div>
          </div>
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

      {/* Video Tutorials Section */}
      <section id="videos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="text-left">
              <h2 className="text-3xl font-bold mb-2">Video hướng dẫn thực chiến</h2>
              <p className="text-gray-500">Học cách áp dụng AI vào công việc qua các video chi tiết.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-medium">Sắp xếp theo:</span>
              <select className="bg-gray-50 border-none text-sm font-bold focus:ring-0 rounded-lg">
                <option>Mới nhất</option>
                <option>Xem nhiều nhất</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VIDEOS.map((video) => (
              <motion.div 
                key={video.id}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-orange-500/10 transition-all">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-orange-500 shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      <Youtube className="w-6 h-6 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur text-[10px] font-bold text-white rounded">
                    {video.duration}
                  </div>
                  <div className="absolute top-3 left-3 px-2 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase rounded shadow-lg">
                    {video.level}
                  </div>
                </div>
                <h4 className="font-bold text-sm leading-tight group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                  {video.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>{video.category}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views} lượt xem</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Quick Tools Section */}
      <section id="ai-tools" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Công cụ AI hỗ trợ nhanh</h2>
            <p className="text-gray-500">Tiết kiệm hàng giờ làm việc mỗi ngày với các công cụ tối ưu sẵn.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Tool: SEO Blog */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="lg:col-span-7 relative group overflow-hidden rounded-[40px] bg-black p-8 md:p-12 min-h-[400px] flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-orange-500/20 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-orange-500/20">
                  <PenTool className="w-8 h-8" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Viết bài Blog chuẩn SEO</h3>
                <p className="text-gray-400 text-lg max-w-md mb-8">
                  Tạo dàn ý và nội dung bài viết chuyên sâu chỉ với một từ khóa chính. Tối ưu hóa cho Google Search.
                </p>
              </div>
              <div className="relative z-10">
                <button 
                  onClick={() => {
                    setActiveQuickTool('seo-blog');
                    setQuickToolInput('');
                    setQuickToolOutput('');
                  }}
                  className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 group/btn"
                >
                  Thử ngay <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Side Tools */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Translation Tool */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => {
                  setActiveQuickTool('translate');
                  setQuickToolInput('');
                  setQuickToolOutput('');
                }}
                className="bg-white border border-gray-100 p-8 rounded-[40px] hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-full"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Languages className="w-7 h-7" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-3">Dịch thuật chuyên sâu</h4>
                  <p className="text-gray-500 text-sm">Dịch thuật tài liệu chuyên ngành với văn phong tự nhiên như người bản xứ.</p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Prompt Tool */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    setActiveQuickTool('image-prompt');
                    setQuickToolInput('');
                    setQuickToolOutput('');
                  }}
                  className="bg-white border border-gray-100 p-8 rounded-[40px] hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Palette className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-2">Tạo Prompt Ảnh</h4>
                  <p className="text-gray-500 text-xs">Mô tả ý tưởng, AI sẽ tạo Prompt cho Midjourney/DALL-E.</p>
                </motion.div>

                {/* Code Assist Tool */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    setActiveQuickTool('code-assist');
                    setQuickToolInput('');
                    setQuickToolOutput('');
                  }}
                  className="bg-white border border-gray-100 p-8 rounded-[40px] hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-2">Hỗ trợ Code</h4>
                  <p className="text-gray-500 text-xs">Giải thích và tối ưu hóa các đoạn mã lập trình phức tạp.</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Tool Modal */}
      <AnimatePresence>
        {activeQuickTool && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveQuickTool(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white",
                      activeQuickTool === 'seo-blog' && "bg-orange-500",
                      activeQuickTool === 'translate' && "bg-blue-600",
                      activeQuickTool === 'image-prompt' && "bg-purple-600",
                      activeQuickTool === 'code-assist' && "bg-green-600"
                    )}>
                      {activeQuickTool === 'seo-blog' && <PenTool className="w-6 h-6" />}
                      {activeQuickTool === 'translate' && <Languages className="w-6 h-6" />}
                      {activeQuickTool === 'image-prompt' && <Palette className="w-6 h-6" />}
                      {activeQuickTool === 'code-assist' && <Code2 className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {activeQuickTool === 'seo-blog' && "Viết bài Blog chuẩn SEO"}
                        {activeQuickTool === 'translate' && "Dịch thuật chuyên sâu"}
                        {activeQuickTool === 'image-prompt' && "Tạo Prompt Ảnh"}
                        {activeQuickTool === 'code-assist' && "Hỗ trợ Code"}
                      </h3>
                      <p className="text-gray-500 text-sm">Sử dụng sức mạnh của AI để tối ưu công việc.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveQuickTool(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleQuickTool} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {activeQuickTool === 'seo-blog' && "Nhập từ khóa chính:"}
                      {activeQuickTool === 'translate' && "Nhập văn bản cần dịch:"}
                      {activeQuickTool === 'image-prompt' && "Mô tả ý tưởng hình ảnh:"}
                      {activeQuickTool === 'code-assist' && "Nhập đoạn mã hoặc câu hỏi:"}
                    </label>
                    <textarea 
                      value={quickToolInput}
                      onChange={(e) => setQuickToolInput(e.target.value)}
                      placeholder={
                        activeQuickTool === 'seo-blog' ? "Ví dụ: Cách kiếm tiền với AI 2024..." :
                        activeQuickTool === 'translate' ? "Nhập văn bản tiếng Anh hoặc ngôn ngữ khác..." :
                        activeQuickTool === 'image-prompt' ? "Ví dụ: Một phi hành gia đang cưỡi ngựa trên sao hỏa, phong cách cyberpunk..." :
                        "Dán code của bạn vào đây hoặc đặt câu hỏi..."
                      }
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[150px] resize-none"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isQuickToolLoading}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isQuickToolLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-orange-500" /> Chạy AI ngay
                      </>
                    )}
                  </button>
                </form>

                {quickToolOutput && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-8 border-t border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">Kết quả từ AI:</h4>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(quickToolOutput);
                          setToastMessage('Đã sao chép kết quả!');
                          setShowSuccessToast(true);
                          setTimeout(() => setShowSuccessToast(false), 2000);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        <Copy className="w-3 h-3" /> Sao chép
                      </button>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl prose prose-sm prose-orange max-w-none max-h-[300px] overflow-y-auto">
                      <ReactMarkdown>{quickToolOutput}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[32px] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 bg-black aspect-video flex items-center justify-center relative group">
                  <img 
                    src={selectedVideo.thumbnail} 
                    className="w-full h-full object-cover opacity-60" 
                    alt="Video Preview"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
                    <Youtube className="w-20 h-20 text-red-600 mb-6" />
                    <h2 className="text-2xl font-bold mb-4">{selectedVideo.title}</h2>
                    <p className="text-gray-300 mb-8 max-w-md">Video này hiện có sẵn cho thành viên Pro. Vui lòng đăng nhập hoặc nâng cấp để xem toàn bộ nội dung.</p>
                    <button className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-xl shadow-orange-500/20">
                      Xem trên YouTube
                    </button>
                  </div>
                </div>
                <div className="p-8 lg:p-10 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-bold uppercase">
                      {selectedVideo.category}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                      {selectedVideo.level}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{selectedVideo.title}</h3>
                  <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">CL</div>
                      <span>Giảng viên: Chuc Ly</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Cập nhật: 15/04/2024</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>{selectedVideo.views} lượt xem</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-sm mb-4">Tài liệu đính kèm:</h4>
                    <div className="space-y-2">
                      <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-medium">Slide bài giảng.pdf</span>
                        </div>
                        <Download className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <Terminal className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-medium">Danh sách Prompt.txt</span>
                        </div>
                        <Download className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {isLoadingPrompts ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              paginatedPrompts.map((prompt, idx) => (
              <motion.div 
                layout
                key={prompt.id} 
                onClick={() => setExpandedPromptId(expandedPromptId === prompt.id ? null : prompt.id)}
                className={cn(
                  "bg-white p-6 rounded-2xl border transition-all group cursor-pointer",
                  expandedPromptId === prompt.id ? "border-orange-500 shadow-xl ring-1 ring-orange-500/20" : "border-gray-100 hover:shadow-md"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    expandedPromptId === prompt.id ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"
                  )}>
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
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(prompt.id); }}
                          className={cn(
                            "p-1.5 rounded-full transition-all",
                            favorites.includes(prompt.id) ? "bg-orange-500 text-white" : "text-gray-300 hover:text-orange-500"
                          )}
                        >
                          <Star className={cn("w-3 h-3", favorites.includes(prompt.id) && "fill-current")} />
                        </button>
                        <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 rounded text-gray-500">{prompt.category}</span>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm text-gray-500",
                      expandedPromptId === prompt.id ? "mb-4" : "line-clamp-2 mb-0"
                    )}>
                      {prompt.description}
                    </p>

                    <AnimatePresence>
                      {expandedPromptId === prompt.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 relative">
                            {prompt.isVip && userRole === 'free' && (
                              <div className="absolute inset-x-0 bottom-0 top-4 bg-white/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center">
                                  <Lock className="w-6 h-6" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-gray-900">Tính năng này đã bị khóa</h5>
                                  <p className="text-xs text-gray-500">Nâng cấp Pro để xem Prompt thực chiến này</p>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setShowUpgradeModal(true); }}
                                  className="px-6 py-2 bg-black text-white text-xs font-bold rounded-xl shadow-lg ring-1 ring-white/20 hover:scale-105 transition-transform"
                                >
                                  Nâng cấp ngay
                                </button>
                              </div>
                            )}
                            <div className="space-y-2">
                              <h5 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Nội dung câu lệnh:</h5>
                              <div className="p-4 bg-gray-50 rounded-xl text-xs font-mono text-gray-600 leading-relaxed whitespace-pre-wrap border border-gray-100">
                                {prompt.content}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openPromptEditor(prompt); }}
                                className="text-xs font-bold bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                              >
                                <PenTool className="w-3 h-3" /> Tùy chỉnh & Chạy
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleCopy(prompt.content, idx); }}
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
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-10 h-10 rounded-xl font-bold text-sm transition-all",
                      currentPage === i + 1 
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : "hover:bg-gray-100 text-gray-500"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all rotate-180"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}
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
                            placeholder={
                              varName.includes('Tên gốc') ? 'Ví dụ: Áo thun, Tai nghe, Son môi...' :
                              varName.includes('Đặc tính') ? 'Ví dụ: Màu đen, Cotton, Chính hãng...' :
                              varName.includes('Công dụng') ? 'Ví dụ: Tập gym, Chống nước, Trị mụn...' :
                              varName.includes('Từ khóa') ? 'Ví dụ: 2024, Giá rẻ, Freeship...' :
                              varName.includes('Đối tượng') ? 'Ví dụ: Freelancer, Mẹ bỉm sữa, Sinh viên...' :
                              `Nhập ${varName.toLowerCase()}...`
                            }
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
                <div className="flex items-center justify-between mb-6 text-orange-500">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Lộ trình đề xuất cho bạn</h3>
                  </div>
                  <button 
                    onClick={() => handleCopy(aiResult || '', -2)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white flex items-center gap-2 text-xs font-bold"
                  >
                    {copiedIndex === -2 ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedIndex === -2 ? 'Đã sao chép' : 'Sao chép lộ trình'}
                  </button>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Bài viết mới nhất</h2>
            <p className="text-gray-500 text-sm">Cập nhật kiến thức và xu hướng AI mới nhất</p>
          </div>
          <a href="#" className="text-sm font-bold text-orange-500 hover:underline">Xem tất cả</a>
        </div>

        {/* Blog Categories */}
        <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveBlogCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                activeBlogCategory === cat
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-white border border-gray-100 text-gray-600 hover:border-orange-200 hover:text-orange-500"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoadingBlog ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-100 rounded-2xl mb-4" />
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            ))
          ) : (
            filteredBlogPosts.map((post, idx) => (
            <div 
              key={post.id || idx} 
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
          )))}
        </div>
      </section>

      {/* AI Masterclass Section */}
      <section id="masterclass" className="py-24 bg-orange-950 text-white overflow-hidden relative">
        {userRole === 'free' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-orange-950/80 backdrop-blur-sm pt-20">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="w-20 h-20 bg-orange-500 text-white rounded-[24px] flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/20 mb-4 scale-110">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-bold">Khu vực dành riêng cho PRO</h2>
              <p className="text-orange-200 leading-relaxed">
                Khám phá lộ trình từ con số 0 đến 10,000 khách hàng đầu tiên cùng chuyên gia AI. Toàn bộ kho video Masterclass, tài liệu thực chiến và cộng đồng kín đang chờ bạn.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2"
                >
                  Mở khóa Masterclass ngay <Star className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", userRole === 'free' && "blur-md pointer-events-none opacity-40")}>
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-2 block">Khu vực dành riêng cho Pro</span>
              <h2 className="text-4xl font-bold mb-4">AI Masterclass Dashboard</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 w-48 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[65%] bg-orange-500" />
                    </div>
                    <span className="text-xs font-bold text-orange-200">Tiến độ: 65%</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <a 
                    href="https://zalo.me/g/yourgroup" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <MessageCircle className="w-5 h-5" /> Tham gia Zalo VIP
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lesson List */}
                <div className="lg:col-span-1 space-y-3">
                  {[
                    { 
                      id: 1,
                      title: "Bài 1: Tư duy triệu đô với Prompt Engineering", 
                      desc: "Học cách giao tiếp với AI như một lập trình viên ngôn ngữ tự nhiên.",
                      duration: "45:20", 
                      status: "Đã hoàn thành",
                      videoUrl: "https://www.youtube.com/embed/jC4v5AS4RIM",
                      files: [
                        { name: "Slide bài giảng.pdf", size: "2.4 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
                        { name: "Checklist thực chiến.xlsx", size: "1.1 MB", url: "https://go.microsoft.com/fwlink/?LinkID=521962" }
                      ]
                    },
                    { 
                      id: 2,
                      title: "Bài 2: Xây dựng hệ thống Content tự động 100%", 
                      desc: "Quy trình sử dụng Make.com và ChatGPT để tự động hóa bài viết.",
                      duration: "1:12:05", 
                      status: "Đang học",
                      videoUrl: "https://www.youtube.com/embed/L_Guz73e6ew",
                      files: [
                        { name: "Quy trình Make.com.pdf", size: "3.1 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
                        { name: "Mẫu Prompt Content.docx", size: "0.8 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
                      ]
                    },
                    { 
                      id: 3,
                      title: "Bài 3: Kỹ thuật chốt đơn khách hàng quốc tế", 
                      desc: "Cách tìm kiếm và đàm phán với khách hàng trên Upwork/Fiverr.",
                      duration: "58:10", 
                      status: "Chưa xem",
                      videoUrl: "https://www.youtube.com/embed/m6_7v7v7v7v",
                      files: [
                        { name: "Kịch bản đàm phán.pdf", size: "1.5 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
                      ]
                    },
                    { 
                      id: 4,
                      title: "Bài 4: Tự động hóa CSKH với AI Agent", 
                      desc: "Xây dựng trợ lý ảo trả lời khách hàng 24/7 trên đa kênh.",
                      duration: "42:15", 
                      status: "Chưa xem",
                      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                      files: [
                        { name: "Sơ đồ hệ thống CSKH.pdf", size: "2.2 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
                      ]
                    }
                  ].map((lesson) => (
                    <button 
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson.id)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all group relative overflow-hidden",
                        activeLesson === lesson.id 
                          ? "bg-orange-500 border-orange-400 shadow-xl shadow-orange-500/20" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", 
                          activeLesson === lesson.id ? "bg-white/20 text-white" : 
                          lesson.status === "Đã hoàn thành" ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-500")}>
                          {lesson.status}
                        </span>
                        <span className="text-[10px] opacity-60">{lesson.duration}</span>
                      </div>
                      <h4 className="font-bold mb-1 text-sm">{lesson.title}</h4>
                      <p className={cn("text-[10px] line-clamp-1", activeLesson === lesson.id ? "text-orange-100/80" : "text-gray-400")}>
                        {lesson.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Video Player Area */}
                <div className="lg:col-span-2">
                  <div className="aspect-video bg-black rounded-[32px] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                    {activeLesson ? (
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={[
                          "https://www.youtube.com/embed/jC4v5AS4RIM",
                          "https://www.youtube.com/embed/L_Guz73e6ew",
                          "https://www.youtube.com/embed/dQw4w9WgXcQ",
                          "https://www.youtube.com/embed/dQw4w9WgXcQ"
                        ][activeLesson - 1]} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      ></iframe>
                    ) : (
                      <div className="text-center p-12">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Zap className="w-10 h-10 text-orange-500 opacity-20" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Chọn một bài học</h3>
                        <p className="text-gray-400">Hãy chọn bài học từ danh sách bên trái để bắt đầu học ngay.</p>
                      </div>
                    )}
                  </div>
                  
                  {activeLesson && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="p-6 bg-white/5 border border-white/10 rounded-[24px]">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-orange-500" /> Tài liệu đính kèm
                        </h3>
                        <div className="space-y-3">
                          {[
                            { 
                              id: 1,
                              files: [
                                { name: "Slide bài giảng.pdf", size: "2.4 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
                                { name: "Checklist thực chiến.xlsx", size: "1.1 MB", url: "https://go.microsoft.com/fwlink/?LinkID=521962" }
                              ]
                            },
                            { 
                              id: 2,
                              files: [
                                { name: "Quy trình Make.com.pdf", size: "3.1 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
                                { name: "Mẫu Prompt Content.docx", size: "0.8 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
                              ]
                            },
                            { 
                              id: 3,
                              files: [
                                { name: "Kịch bản đàm phán.pdf", size: "1.5 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
                              ]
                            },
                            { 
                              id: 4,
                              files: [
                                { name: "Sơ đồ hệ thống CSKH.pdf", size: "2.2 MB", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" }
                              ]
                            }
                          ].find(l => l.id === activeLesson)?.files.map((file, fIdx) => (
                            <div key={fIdx} className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm group/file">
                              <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" /> {file.name}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-500">{file.size}</span>
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-orange-500 transition-colors"
                                    title="Xem file"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                  <a 
                                    href={file.url} 
                                    download={file.name}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    title="Tải xuống"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-white/5 border border-white/10 rounded-[24px]">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-orange-500" /> Ghi chú bài học
                        </h3>
                        <div className="text-sm text-gray-400 space-y-2">
                          <p>• Tập trung vào phần tối ưu hóa Hook trong 3 giây đầu.</p>
                          <p>• Sử dụng công thức AIDA để viết kịch bản.</p>
                          <p>• Đừng quên tham gia cộng đồng Zalo để hỏi đáp.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-14 h-14 bg-white text-black border border-gray-100 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all group"
              title="Lên đầu trang"
            >
              <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        {currentUser && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(activeTab === 'library' ? 'home' : 'library')}
            className={cn(
              "w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all group",
              activeTab === 'library' ? "bg-orange-500 text-white" : "bg-white text-gray-400 hover:text-orange-500"
            )}
            title="Thư viện của tôi"
          >
            <Star className={cn("w-6 h-6", activeTab === 'library' && "fill-current")} />
          </motion.button>
        )}

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowContact(!showContact)}
          className={cn(
            "w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all group relative",
            showContact ? "bg-orange-500 text-white" : "bg-black text-white hover:bg-gray-800"
          )}
          title="Liên hệ hỗ trợ"
        >
          {showContact ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
          {!showContact && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-bounce" />}
        </motion.button>
      </div>

      {/* Admin Toggle (Visible only to owner) */}
      {currentUser?.email === 'chucly2879@gmail.com' && (
        <div className="fixed bottom-8 left-8 z-[100]">
          <button 
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="p-4 bg-black text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-bold">Quản lý Lead ({subscribers.length})</span>
          </button>
        </div>
      )}
      <AnimatePresence>
        {showContact && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white max-w-lg w-full rounded-[40px] p-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowContact(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Liên hệ với chúng tôi</h3>
                <p className="text-gray-500">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.</p>
              </div>

              <div className="space-y-4">
                <a 
                  href="https://zalo.me/yourid" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-4 p-6 bg-blue-50 rounded-3xl hover:bg-blue-100 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-blue-900">Hỗ trợ qua Zalo</div>
                    <div className="text-sm text-blue-700/70">Phản hồi nhanh trong 15 phút</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-300 group-hover:translate-x-1 transition-transform" />
                </a>

                <a 
                  href="mailto:contact@aihustle.vn" 
                  className="flex items-center gap-4 p-6 bg-orange-50 rounded-3xl hover:bg-orange-100 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-orange-900">Gửi Email cho chúng tôi</div>
                    <div className="text-sm text-orange-700/70">contact@aihustle.vn</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-300 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              <div className="mt-10 pt-10 border-t border-gray-100 flex justify-center gap-6">
                <a href="#" className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons removed duplicate */}

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[40px] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Danh sách đăng ký Ebook</h3>
                  <p className="text-sm text-gray-500">Tổng cộng: {subscribers.length} người</p>
                </div>
                <button onClick={() => setShowAdminPanel(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-4 px-4">Ngày đăng ký</th>
                      <th className="pb-4 px-4">Họ và tên</th>
                      <th className="pb-4 px-4">Email</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {sub.createdAt?.toDate().toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-4 px-4 font-bold">{sub.fullName}</td>
                        <td className="py-4 px-4 text-orange-500 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {sub.email}
                        </td>
                      </tr>
                    ))}
                    {subscribers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-20 text-center text-gray-400">Chưa có ai đăng ký.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => {
                    const csv = [
                      ['Ngày', 'Họ tên', 'Email'],
                      ...subscribers.map(s => [s.createdAt?.toDate().toLocaleDateString(), s.fullName, s.email])
                    ].map(e => e.join(",")).join("\n");
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.setAttribute('hidden', '');
                    a.setAttribute('href', url);
                    a.setAttribute('download', 'subscribers.csv');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Xuất file CSV
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 relative">
                <Star className="w-10 h-10 fill-current" />
                {aiUsageCount >= AI_DAILY_LIMIT && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                    Limit Reach!
                  </div>
                )}
              </div>
              <h3 className="text-3xl font-bold mb-4">
                {userRole === 'free' && aiUsageCount >= AI_DAILY_LIMIT ? "Hết lượt chạy AI!" : "Mở khóa Quyền lợi PRO"}
              </h3>
              <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                {userRole === 'free' && aiUsageCount >= AI_DAILY_LIMIT 
                  ? "Bạn đã dùng hết 5 lượt chạy miễn phí hôm nay. Đừng để gián đoạn dòng tiền của bạn!" 
                  : "Nâng cấp gói Pro để truy cập ngay 500+ Prompt VIP, khóa học Masterclass và cộng đồng Zalo kín."
                }
              </p>

              <div className="bg-gray-50 rounded-2xl p-4 mb-8 space-y-3">
                {[
                  "Chạy AI không giới hạn lượt",
                  "Mở khóa 500+ Prompt độc quyền",
                  "Truy cập Dashboard Masterclass",
                  "Hỗ trợ Zalo 1-1"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" /> {benefit}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setUserRole('pro'); setShowUpgradeModal(false); }}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  Nâng cấp Pro ngay <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Để sau
                </button>
              </div>
              <p className="mt-6 text-[10px] text-gray-400">Gợi ý: Gói năm tiết kiệm hơn 20%</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lựa chọn lộ trình của bạn</h2>
            <p className="text-gray-500 mb-8">Từ người mới bắt đầu đến chuyên gia kiếm tiền bằng AI.</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={cn("text-sm font-medium", billingCycle === 'monthly' ? "text-black" : "text-gray-400")}>Hàng tháng</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-14 h-7 bg-gray-200 rounded-full relative p-1 transition-colors"
              >
                <motion.div 
                  animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                  className="w-5 h-5 bg-white rounded-full shadow-sm"
                />
              </button>
              <span className={cn("text-sm font-medium", billingCycle === 'yearly' ? "text-black" : "text-gray-400")}>Hàng năm</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Tiết kiệm 20%</span>
            </div>
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
              <button 
                onClick={() => {
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 3000);
                }}
                className="w-full py-4 border border-black rounded-xl font-bold hover:bg-black hover:text-white transition-all"
              >
                Bắt đầu ngay
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl border-2 border-orange-500 bg-orange-50/30 relative flex flex-col md:scale-105 shadow-xl shadow-orange-500/10 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase rounded-full">Khuyên dùng</div>
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Chuyên nghiệp (Pro)</h3>
                <div className="text-3xl font-black mb-2">
                  {billingCycle === 'monthly' ? '199k' : '159k'}
                  <span className="text-sm font-normal text-gray-400">/tháng</span>
                </div>
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
              <button 
                onClick={() => {
                  setUserRole('pro');
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 3000);
                }}
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
              >
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
              <button 
                onClick={() => {
                  alert('Yêu cầu của bạn đã được gửi! Đội ngũ chuyên gia sẽ liên hệ với bạn trong vòng 24h.');
                }}
                className="w-full py-4 border border-black rounded-xl font-bold hover:bg-black hover:text-white transition-all"
              >
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
                <form className="space-y-4" onSubmit={handleEbookSubmit}>
                  <input 
                    type="text" 
                    placeholder="Họ và tên của bạn" 
                    required
                    value={ebookFormData.fullName}
                    onChange={(e) => setEbookFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <input 
                    type="email" 
                    placeholder="Địa chỉ Email" 
                    required
                    value={ebookFormData.email}
                    onChange={(e) => setEbookFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <button 
                    disabled={isSubmittingEbook || emailSubscribed}
                    className="w-full py-5 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingEbook ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
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

      {/* Testimonials Section (Social Proof) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Học viên nói gì về chúng tôi?</h2>
            <p className="text-gray-500">Hơn 1,200+ người đã thay đổi cách làm việc nhờ AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Nguyễn Văn A",
                role: "Freelance Content Writer",
                content: "Từ khi dùng bộ Prompt VIP, mình viết bài nhanh gấp 5 lần mà chất lượng vẫn cực tốt. Khách hàng khen suốt!",
                avatar: "https://picsum.photos/seed/user1/100/100"
              },
              {
                name: "Trần Thị B",
                role: "Chủ shop Shopee",
                content: "Gói Pro thực sự đáng tiền. Mình đã tối ưu lại toàn bộ gian hàng và doanh thu tăng 30% chỉ sau 2 tuần.",
                avatar: "https://picsum.photos/seed/user2/100/100"
              },
              {
                name: "Lê Văn C",
                role: "Digital Marketer",
                content: "Các bài học trong Masterclass rất thực chiến, không lý thuyết suông. Rất đáng để đầu tư lâu dài.",
                avatar: "https://picsum.photos/seed/user3/100/100"
              }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                <div className="flex items-center gap-1 text-orange-500 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-600 mb-8 italic leading-relaxed">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section (Handling Objections) */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Câu hỏi thường gặp</h2>
            <p className="text-gray-500">Giải đáp những thắc mắc của bạn về dịch vụ của chúng tôi.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Tôi không biết lập trình có dùng được AI không?",
                a: "Hoàn toàn được! Website của chúng tôi thiết kế dành riêng cho những người không chuyên. Các Prompt đã được tối ưu sẵn, bạn chỉ cần copy và điền thông tin là xong."
              },
              {
                q: "Gói Pro có được cập nhật Prompt mới không?",
                a: "Có, chúng tôi cập nhật các Prompt mới hàng tuần dựa trên những xu hướng AI mới nhất trên thế giới để đảm bảo bạn luôn dẫn đầu."
              },
              {
                q: "Tôi có thể hủy gói Pro bất cứ lúc nào không?",
                a: "Tất nhiên! Bạn có thể hủy gia hạn bất cứ lúc nào trong phần cài đặt tài khoản mà không gặp bất kỳ trở ngại nào."
              },
              {
                q: "Hỗ trợ 1-1 qua Zalo hoạt động như thế nào?",
                a: "Sau khi nâng cấp Pro, bạn sẽ nhận được mã QR để tham gia nhóm kín và kết nối trực tiếp với đội ngũ chuyên gia của chúng tôi để giải đáp mọi thắc mắc."
              }
            ].map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-700">{faq.q}</span>
                  <ChevronLeft className={cn("w-5 h-5 text-gray-400 transition-transform", openFaqIndex === i ? "rotate-90" : "-rotate-90")} />
                </button>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-gray-500 text-sm leading-relaxed border-t border-gray-50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
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
      <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">AI Hustle</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Cộng đồng chia sẻ kiến thức, công cụ và lộ trình kiếm tiền bằng AI hàng đầu Việt Nam.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Khám phá</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li>
                  <button 
                    onClick={() => {
                      if (userRole === 'pro') setActiveTab('ideas');
                      else setShowUpgradeModal(true);
                    }}
                    className="hover:text-orange-500 transition-colors flex items-center gap-1"
                  >
                    Ý tưởng AI {userRole !== 'pro' && <Lock className="w-3 h-3 text-gray-300" />}
                  </button>
                </li>
                <li><button onClick={() => { setActiveTab('home'); setTimeout(() => document.getElementById('ai-tools')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-orange-500 transition-colors">Công cụ AI</button></li>
                <li><button onClick={() => { setActiveTab('home'); setTimeout(() => document.getElementById('prompts')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-orange-500 transition-colors">Thư viện Prompt</button></li>
                <li><button onClick={() => { if(userRole === 'pro') setActiveTab('roadmap'); else setShowUpgradeModal(true); }} className="hover:text-orange-500 transition-colors flex items-center gap-1">Lộ trình 1k User {userRole !== 'pro' && <Lock className="w-3 h-3 text-gray-300" />}</button></li>
                <li><a href="#blog" className="hover:text-orange-500 transition-colors">Blog kiến thức</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Hỗ trợ</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><button onClick={() => setShowContact(true)} className="hover:text-orange-500 transition-colors text-left">Liên hệ</button></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Điều khoản sử dụng</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Đăng ký bản tin</h4>
              <p className="text-sm text-gray-500 mb-4">Nhận cập nhật mới nhất về AI và kiếm tiền online.</p>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã đăng ký!'); }}>
                <input 
                  type="email" 
                  placeholder="Email..." 
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <button className="px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all">
                  Gửi
                </button>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p>© 2024 AI Hustle Explorer. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Made with ❤️ for Freelancers</span>
              <button 
                onClick={() => {
                  if (userRole === 'admin') {
                    navigate('/admin/dashboard');
                  } else {
                    navigate('/dang-nhap-admin');
                  }
                }}
                className="hover:text-gray-600 flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" />
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Toggle (Visible only to owner) removed duplicate */}
    </>
  );

  const roadmapContent = (
    <div className="py-24 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Chiến lược đạt 1.000 User</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Lộ trình chi tiết giúp bạn xây dựng cộng đồng và phát triển thương hiệu cá nhân bằng sức mạnh của AI.
          </p>
        </div>
        <RoadmapDashboard />
      </div>
    </div>
  );

  const hooksContent = (
    <div className="py-24 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 text-center mb-16">
        <span className="inline-block px-4 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
          3-Second Hook Secret
        </span>
        <h1 className="text-4xl md:text-6xl font-black mb-6">TikTok Hook Lab</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          90% người xem sẽ lướt qua nếu 3 giây đầu không hấp dẫn. Sử dụng các công thức triệu view này để giữ chân họ.
        </p>
      </div>
      <TikTokHookLab onToast={(msg) => {
        setToastMessage(msg);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }} />
    </div>
  );

  const ideasContent = (
    <div className="py-24 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
            Pro Career Path
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Thư viện Ý tưởng AI</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Những hướng đi tốt nhất để tạo thu nhập với AI, được cập nhật liên tục cho thành viên Pro.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SIDE_HUSTLES.map((hustle, idx) => (
            <motion.div
              key={hustle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white p-8 rounded-3xl border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-orange-500 group-hover:text-white transition-colors mb-6">
                {hustle.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{hustle.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
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
                  <span className="text-gray-400 uppercase tracking-wider">Thu nhập tiềm năng</span>
                  <span className="text-green-600 font-bold">{(hustle as any).potential_income}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-gray-400 uppercase tracking-wider">Tiềm năng</span>
                  <span className="text-blue-600 font-bold">{hustle.potential}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const content = selectedPost ? (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-gray-100">
        <motion.div 
          className="h-full bg-orange-500"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

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
                  <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-all group">
                    <Star className="w-4 h-4 group-hover:fill-orange-500" />
                  </button>
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

            <div className="prose prose-lg prose-orange max-w-none blog-content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{selectedPost.content}</ReactMarkdown>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            <div className="sticky top-28">
              <div className="bg-black text-white rounded-3xl p-8 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/40 transition-colors" />
                <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Prompt của ngày
                </h3>
                <div className="bg-white/10 rounded-2xl p-4 mb-6 relative z-10 border border-white/10">
                  <p className="text-xs italic text-gray-300 mb-2">"Viết kịch bản video TikTok viral cho sản phẩm [Tên sản phẩm]..."</p>
                  <div className="flex items-center gap-2 text-[10px] text-orange-400 font-bold">
                    <Zap className="w-3 h-3" /> 1,2k lượt dùng hôm nay
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedPost(null);
                    setTimeout(() => {
                      const el = document.getElementById('prompts');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors relative z-10"
                >
                  Thử ngay
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Bài viết liên quan
                </h3>
                <div className="space-y-6">
                  {allBlogPosts.filter(p => p.title !== selectedPost.title).map((post, idx) => (
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
  ) : (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-black text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            {toastMessage || 'Thao tác thành công!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <style id="custom-global-css">{globalCustomCss}</style>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => {
              setSelectedPost(null);
              setActiveTab('home');
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
            <button onClick={() => setActiveTab('home')} className={cn("hover:text-orange-500 transition-colors", activeTab === 'home' && "text-orange-500 font-bold")}>Trang chủ</button>
            <a href="#prompts" className="hover:text-orange-500 transition-colors">Prompt</a>
            <a href="#ai-tools" className="hover:text-orange-500 transition-colors">Công cụ AI</a>
            
            {/* Video Dropdown */}
            <div className="relative group py-4" onMouseEnter={() => setShowVideoDropdown(true)} onMouseLeave={() => setShowVideoDropdown(false)}>
              <button 
                className={cn(
                  "flex items-center gap-1 hover:text-orange-500 transition-colors",
                  (activeTab === 'roadmap' || activeTab === 'hooks' || activeTab === 'ideas') && "text-orange-500 font-bold"
                )}
              >
                Video <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showVideoDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-64 bg-white border border-gray-100 shadow-xl rounded-2xl py-3 z-50 overflow-hidden"
                  >
                    <a 
                      href="#videos" 
                      onClick={() => { setActiveTab('home'); setShowVideoDropdown(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Youtube className="w-4 h-4 text-red-500" />
                      <span>Video hướng dẫn</span>
                    </a>
                    
                    <button 
                      onClick={() => {
                        if (userRole === 'pro') {
                          setActiveTab('roadmap');
                        } else {
                          setShowUpgradeModal(true);
                        }
                        setShowVideoDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span>Lộ trình 1k User</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {userRole !== 'pro' && <Lock className="w-3 h-3 text-gray-300" />}
                        <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded font-black">PRO</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        if (userRole === 'pro') {
                          setActiveTab('hooks');
                        } else {
                          setShowUpgradeModal(true);
                        }
                        setShowVideoDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>Hook Lab</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {userRole !== 'pro' && <Lock className="w-3 h-3 text-gray-300" />}
                        <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded font-black">PRO</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        if (userRole === 'pro') {
                          setActiveTab('ideas');
                        } else {
                          setShowUpgradeModal(true);
                        }
                        setShowVideoDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        <span>Ý tưởng AI</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {userRole !== 'pro' && <Lock className="w-3 h-3 text-gray-300" />}
                        <span className="text-[8px] bg-orange-100 text-orange-600 px-1 rounded font-black">PRO</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="#blog" className="hover:text-orange-500 transition-colors">Blog</a>
            {currentUser && (
              <button 
                onClick={() => setActiveTab('library')} 
                className={cn("hover:text-orange-500 transition-colors flex items-center gap-1", activeTab === 'library' && "text-orange-500 font-bold")}
              >
                <Star className="w-4 h-4" /> Thư viện của tôi
              </button>
            )}
            <button onClick={() => setShowContact(true)} className="hover:text-orange-500 transition-colors">Liên hệ</button>
            <a 
              href="#masterclass" 
              className={cn(
                "flex items-center gap-1 font-bold transition-all",
                userRole === 'pro' ? "text-orange-600" : "text-gray-400 opacity-80"
              )}
            >
              {userRole !== 'pro' && <Lock className="w-3 h-3" />}
              Masterclass
            </a>
            
            <div className="h-6 w-px bg-gray-100" />

            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center border border-orange-200">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    {userRole === 'pro' && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center">
                        <Star className="w-1.5 h-1.5 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-900 leading-none">{currentUser.displayName || 'Người dùng'}</span>
                      {userRole === 'pro' && (
                        <span className="text-[8px] bg-orange-500 text-white px-1 rounded font-black uppercase">PRO</span>
                      )}
                    </div>
                    {userRole === 'free' ? (
                      <button 
                        onClick={() => setShowUpgradeModal(true)}
                        className="text-[9px] text-orange-600 font-bold hover:underline"
                      >
                        Nâng cấp ngay
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 capitalize">{userRole} Plan</span>
                    )}
                  </div>
                </div>
                {userRole === 'free' && (
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
                  >
                    Nâng cấp PRO ⭐
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/dang-nhap')}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all font-bold"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </nav>

      {activeTab === 'home' ? mainContent : 
       (activeTab === 'roadmap' || activeTab === 'hooks' || activeTab === 'ideas') && userRole !== 'pro' ? (
         <div className="py-32 flex flex-col items-center justify-center text-center px-4 bg-gray-50/50 min-h-screen">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl shadow-orange-500/10 border border-gray-100"
           >
             <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-8 mx-auto">
               <Lock className="w-10 h-10" />
             </div>
             <h2 className="text-3xl font-black mb-4">Tính năng PRO</h2>
             <p className="text-gray-500 mb-8 leading-relaxed">
               Nâng cấp lên tài khoản Pro để truy cập lộ trình 1.000 user, Hook Lab triệu view và thư viện ý tưởng độc quyền.
             </p>
             <button 
               onClick={() => setShowUpgradeModal(true)}
               className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-black shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
             >
               Nâng cấp ngay ⭐
             </button>
           </motion.div>
         </div>
       ) : activeTab === 'roadmap' ? roadmapContent : 
       activeTab === 'hooks' ? hooksContent : 
       activeTab === 'ideas' ? ideasContent :
       libraryContent}
    </div>
  );

  return (
    <Routes>
      <Route path="/dang-nhap" element={<AuthPage />} />
      <Route path="/dang-nhap-admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminPanel />} />
      <Route path="/*" element={content} />
    </Routes>
  );
}
