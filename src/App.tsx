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
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { generateSideHustleIdea, runCustomPrompt } from './services/gemini';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocFromServer, doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPanel from './pages/AdminPanel';

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
    id: 'fb-content',
    title: 'Sáng tạo nội dung Facebook Fanpage', 
    category: 'Content', 
    description: 'Lên kế hoạch nội dung 7 ngày thu hút tương tác.',
    content: 'Bạn là Social Media Manager chuyên nghiệp. Hãy xây dựng kế hoạch nội dung 7 ngày cho Fanpage về [Chủ đề/Ngành hàng]. Quy trình:\n- Ngày 1: Bài viết chia sẻ giá trị/kiến thức.\n- Ngày 2: Bài viết giải trí/meme liên quan.\n- Ngày 3: Bài viết đặt câu hỏi/thảo luận.\n- Ngày 4: Bài viết giới thiệu sản phẩm khéo léo.\n- Ngày 5: Bài viết Feedback khách hàng.\n- Ngày 6: Bài viết đằng sau hậu trường.\n- Ngày 7: Bài viết mini-game/quà tặng.\nYêu cầu: Mỗi bài viết bao gồm Tiêu đề, Nội dung chính và 5 Hashtag.'
  },
  { 
    id: 'linkedin-branding',
    title: '[VIP] Xây dựng nhân hiệu trên LinkedIn', 
    category: 'Content', 
    description: 'Quy trình 30 ngày phủ sóng thương hiệu cá nhân.',
    content: 'Lập kế hoạch nội dung 7 ngày trên LinkedIn cho chuyên gia trong lĩnh vực [Lĩnh vực]. Quy trình thực hiện:\n1. Xác định 3 trụ cột nội dung (Content Pillars) chính.\n2. Viết 1 bài Storytelling về thất bại và bài học kinh nghiệm.\n3. Viết 1 bài phân tích xu hướng thị trường hiện tại.\n4. Viết 1 bài hướng dẫn (How-to) giải quyết vấn đề [Vấn đề].\n5. Gợi ý cách tương tác với 10 người có tầm ảnh hưởng trong ngành.',
    isVip: true
  },

  // --- E-COMMERCE CATEGORY ---
  { 
    id: 'hypnotic-desc',
    title: 'Mô tả sản phẩm thôi miên', 
    category: 'E-commerce', 
    description: 'Viết mô tả sản phẩm thu hút theo công thức AIDA.',
    content: 'Bạn là một bậc thầy về Copywriting bán hàng. Hãy viết mô tả sản phẩm cho: [Tên sản phẩm]. Quy trình:\n- Attention: Tiêu đề gây sốc hoặc câu hỏi đánh đúng tâm lý.\n- Interest: Liệt kê 3 lợi ích cốt lõi (không phải tính năng).\n- Desire: Vẽ ra viễn cảnh khách hàng sau khi dùng sản phẩm.\n- Action: Lời kêu gọi hành động kèm ưu đãi khan hiếm.\nYêu cầu: Ngôn ngữ thôi miên, sử dụng các từ ngữ kích thích cảm xúc.'
  },
  { 
    id: 'customer-feedback',
    title: 'Phản hồi đánh giá khách hàng Pro', 
    category: 'E-commerce', 
    description: 'Quy trình xử lý đánh giá 1 sao và 5 sao chuyên nghiệp.',
    content: 'Bạn là Quản lý chăm sóc khách hàng. Hãy viết mẫu phản hồi cho 2 trường hợp:\n1. Đánh giá 5 sao: Cảm ơn chân thành, nhắc lại lợi ích sản phẩm và tặng voucher cho lần sau.\n2. Đánh giá 1 sao về lỗi [Lỗi cụ thể]: Xin lỗi chân thành, nhận trách nhiệm, đưa ra giải pháp đền bù (đổi trả/hoàn tiền) và yêu cầu khách hàng inbox để xử lý riêng.\nYêu cầu: Giọng văn lịch sự, cầu thị.'
  },
  { 
    id: 'shopee-seo',
    title: '[VIP] Tối ưu hóa gian hàng Shopee Pro', 
    category: 'E-commerce', 
    description: 'Chiến lược đứng top tìm kiếm và tối ưu tỷ lệ click.',
    content: 'Bạn là chuyên gia vận hành sàn TMĐT. Hãy thực hiện quy trình tối ưu sản phẩm [Tên sản phẩm]:\n1. Viết tiêu đề chuẩn SEO theo công thức: [Tên gốc sản phẩm] + [Thương hiệu/Đặc tính] + [Công dụng/Lợi ích] + [Từ khóa xu hướng].\n2. Viết 5 điểm nổi bật (Bullet points) tối ưu cho hiển thị mobile.\n3. Thiết kế kịch bản cho 5 ảnh sản phẩm (Ảnh bìa, Ảnh tính năng, Ảnh feedback, Ảnh quà tặng, Ảnh bảng size).\n4. Bộ 18 hashtag chuẩn SEO Shopee phân loại theo: Hashtag ngành, Hashtag sản phẩm, Hashtag thương hiệu.',
    isVip: true
  },

  // --- VIDEO CATEGORY ---
  { 
    id: 'tiktok-viral',
    title: 'Kịch bản TikTok Viral', 
    category: 'Video', 
    description: 'Lên kịch bản video ngắn thu hút trong 3 giây đầu.',
    content: 'Hãy viết một kịch bản video TikTok dài 45 giây về [Chủ đề video]. Quy trình:\n- 0-3s (Hook): Sử dụng kỹ thuật "Sự thật gây sốc" hoặc "Câu hỏi ngược đời".\n- 3-15s (Vấn đề): Đào sâu nỗi đau của [Đối tượng].\n- 15-35s (Giải pháp): Chia sẻ 3 bước thực hiện đơn giản.\n- 35-45s (CTA): Kêu gọi follow để xem phần tiếp theo hoặc nhận quà.'
  },
  { 
    id: 'youtube-ideas',
    title: 'Ý tưởng Video YouTube triệu view', 
    category: 'Video', 
    description: 'Tìm kiếm 10 chủ đề video có khả năng lên xu hướng.',
    content: 'Bạn là chuyên gia sáng tạo nội dung YouTube. Hãy tìm 10 ý tưởng video cho kênh về [Chủ đề kênh]. Quy trình:\n1. Phân tích 3 xu hướng đang hot trong ngách này.\n2. Đề xuất 10 tiêu đề gây tò mò (Clickbait sạch).\n3. Gợi ý mẫu Thumbnail cho 3 ý tưởng tốt nhất.\n4. Viết đoạn mô tả (Description) chuẩn SEO cho video đầu tiên.'
  },
  { 
    id: 'viral-script-vip',
    title: '[VIP] Kịch bản Video Triệu View', 
    category: 'Video', 
    description: 'Cấu trúc kịch bản giữ chân người xem đến giây cuối cùng.',
    content: 'Viết kịch bản video ngắn 60s cho [Chủ đề]. Quy trình thực hiện:\n1. Hook (0-5s): Đánh thẳng vào kết quả cuối cùng khách hàng mong muốn.\n2. Body (5-50s): Chia sẻ quy trình 3 bước "bí mật" mà ít người biết.\n3. Retention: Thêm một câu "Lưu ý quan trọng ở cuối video" để giữ chân người xem.\n4. CTA (50-60s): Hướng dẫn khách hàng nhấn vào link bio để nhận tài liệu.',
    isVip: true
  },

  // --- MARKETING CATEGORY ---
  { 
    id: 'email-marketing',
    title: 'Email Marketing Bán Hàng', 
    category: 'Marketing', 
    description: 'Viết chuỗi email bán hàng tự động thuyết phục.',
    content: 'Viết một chuỗi 3 email bán hàng cho sản phẩm [Tên sản phẩm]. Quy trình:\n- Email 1: Làm quen và trao giá trị (Tặng quà/Chia sẻ mẹo).\n- Email 2: Khơi gợi nỗi đau và giới thiệu giải pháp (Sản phẩm của bạn).\n- Email 3: Tạo sự khan hiếm (Giảm giá có hạn) và chốt đơn.\nYêu cầu: Tiêu đề email phải cực kỳ thu hút để tăng tỷ lệ mở.'
  },
  { 
    id: 'customer-persona',
    title: 'Xây dựng chân dung khách hàng (Persona)', 
    category: 'Marketing', 
    description: 'Phân tích chi tiết đối tượng mục tiêu của bạn.',
    content: 'Bạn là chuyên gia Marketing Research. Hãy xây dựng chân dung khách hàng mục tiêu cho [Sản phẩm]. Quy trình:\n1. Nhân khẩu học (Tuổi, giới tính, địa lý, thu nhập).\n2. Tâm lý học (Sở thích, nỗi sợ, khao khát).\n3. Hành vi (Thói quen online, kênh mua sắm).\n4. Nỗi đau (Pain points) lớn nhất mà sản phẩm có thể giải quyết.'
  },
  { 
    id: 'fb-ads-vip',
    title: '[VIP] Chiến dịch FB Ads triệu đô', 
    category: 'Marketing', 
    description: 'Cấu trúc bài viết quảng cáo Facebook tỷ lệ chuyển đổi cực cao.',
    content: 'Bạn là chuyên gia chạy quảng cáo Facebook Ads. Hãy thực hiện quy trình viết nội dung quảng cáo cho [Sản phẩm]:\n1. Viết 3 tiêu đề (Headline) khác nhau: 1 đánh vào tò mò, 1 đánh vào lợi ích, 1 đánh vào cảnh báo.\n2. Viết thân bài theo công thức PAS (Problem - Agitate - Solution).\n3. Đề xuất 3 loại hình ảnh/video tương ứng cho từng mẫu nội dung.\n4. Viết câu kêu gọi hành động (CTA) tối ưu cho nút "Gửi tin nhắn".',
    isVip: true
  },
  { 
    id: 'sales-funnel-vip',
    title: '[VIP] Phễu bán hàng tự động (Funnel)', 
    category: 'Marketing', 
    description: 'Thiết kế hành trình khách hàng từ nhận biết đến mua hàng.',
    content: 'Hãy thiết kế một phễu bán hàng 4 giai đoạn cho [Sản phẩm/Dịch vụ]. Quy trình:\n1. Giai đoạn Thu hút: Đề xuất 3 mẫu Lead Magnet (Quà tặng miễn phí).\n2. Giai đoạn Nuôi dưỡng: Lập dàn ý chuỗi 5 email tự động.\n3. Giai đoạn Chuyển đổi: Thiết kế cấu trúc Landing Page bán hàng chuẩn tâm lý.\n4. Giai đoạn Chăm sóc: Đề xuất chiến lược Upsell/Cross-sell để tăng giá trị đơn hàng.',
    isVip: true
  },
  { 
    id: 'competitor-analysis-vip',
    title: '[VIP] Phân tích đối thủ cạnh tranh AI', 
    category: 'Marketing', 
    description: 'Tìm ra điểm yếu của đối thủ để chiếm lĩnh thị trường.',
    content: 'Hãy phân tích đối thủ [Tên đối thủ] trong mảng [Ngành hàng]. Quy trình:\n1. Liệt kê 3 điểm mạnh nhất trong chiến lược Marketing của họ.\n2. Tìm ra 3 lỗ hổng/điểm yếu mà khách hàng thường phàn nàn về họ.\n3. Phân tích cấu trúc giá và các chương trình khuyến mãi thường xuyên.\n4. Đề xuất chiến lược "Đánh vào ngách" để [Thương hiệu của bạn] vượt mặt đối thủ.',
    isVip: true
  },

  // --- SALES CATEGORY ---
  { 
    id: 'price-objection',
    title: 'Xử lý từ chối về giá', 
    category: 'Sales', 
    description: 'Cách thuyết phục khách hàng khi họ chê đắt.',
    content: 'Bạn là sát thủ bán hàng. Hãy viết 3 kịch bản xử lý khi khách hàng nói "Giá bên em cao quá". Quy trình:\n- Cách 1: Chia nhỏ chi phí theo ngày/tháng.\n- Cách 2: So sánh giá trị nhận được so với chi phí bỏ ra.\n- Cách 3: Kể câu chuyện về một khách hàng khác đã từng chê đắt và kết quả họ nhận được sau khi dùng.'
  },
  { 
    id: 'follow-up-email',
    title: 'Email Follow-up sau cuộc gọi', 
    category: 'Sales', 
    description: 'Giữ kết nối và thúc đẩy khách hàng ra quyết định.',
    content: 'Viết một email follow-up gửi cho khách hàng [Tên] sau khi vừa kết thúc cuộc gọi tư vấn về [Sản phẩm]. Quy trình:\n1. Cảm ơn và tóm tắt 3 điểm mấu chốt đã trao đổi.\n2. Giải quyết 1 thắc mắc còn tồn đọng của khách hàng.\n3. Đưa ra bước tiếp theo (Lịch hẹn/Gửi báo giá) kèm thời hạn (Deadline).'
  },
  { 
    id: 'telesale-script-vip',
    title: '[VIP] Kịch bản chốt đơn Telesale', 
    category: 'Sales', 
    description: 'Quy trình xử lý từ chối và chốt đơn qua điện thoại.',
    content: 'Xây dựng kịch bản Telesale cho sản phẩm [Tên sản phẩm]. Quy trình 5 bước:\n1. Chào hỏi & Phá băng (30s đầu): Gây ấn tượng bằng một lợi ích ngay lập tức.\n2. Khai thác nỗi đau: Đặt 3 câu hỏi để khách hàng tự nhận ra vấn đề.\n3. Trình bày giải pháp: Tập trung vào tính năng giải quyết nỗi đau đó.\n4. Xử lý từ chối: Chuẩn bị sẵn câu trả lời cho 3 lời từ chối phổ biến nhất.\n5. Chốt đơn: Sử dụng kỹ thuật "Chốt đơn giả định" hoặc "Sự lựa chọn kép".',
    isVip: true
  },
  { 
    id: 'cold-outreach-vip',
    title: '[VIP] Chiến lược Email Cold Outreach', 
    category: 'Sales', 
    description: 'Cách tiếp cận khách hàng lạ mà không bị đánh dấu spam.',
    content: 'Viết 3 mẫu email tiếp cận khách hàng [Đối tượng] để giới thiệu dịch vụ [Dịch vụ]. Quy trình:\n1. Cá nhân hóa dòng tiêu đề và câu mở đầu.\n2. Đưa ra một bằng chứng xã hội (Social Proof) ấn tượng.\n3. Đề xuất một cuộc gọi ngắn 5-10 phút (Low friction CTA).\n4. Quy trình Follow-up 3 bước nếu khách hàng không phản hồi.',
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
    id: 'meta-tags-seo',
    title: 'Tối ưu Meta Tags chuẩn SEO', 
    category: 'SEO', 
    description: 'Viết Title và Description thu hút cho website.',
    content: 'Hãy viết Title Tag (dưới 60 ký tự) và Meta Description (dưới 160 ký tự) cho trang web về [Chủ đề]. Quy trình:\n1. Chứa từ khóa chính [Từ khóa] ở ngay đầu câu.\n2. Thêm một lợi ích hoặc con số để tăng tỷ lệ click.\n3. Bao gồm lời kêu gọi hành động (CTA) mạnh mẽ.'
  },
  { 
    id: 'internal-linking',
    title: 'Chiến lược Internal Linking', 
    category: 'SEO', 
    description: 'Xây dựng cấu trúc liên kết nội bộ tối ưu.',
    content: 'Bạn là chuyên gia Technical SEO. Hãy xây dựng sơ đồ liên kết nội bộ cho cụm bài viết (Topic Cluster) về [Chủ đề chính]. Quy trình:\n1. Xác định bài viết trụ cột (Pillar Page).\n2. Liệt kê 5 bài viết bổ trợ (Cluster Content).\n3. Chỉ rõ Anchor Text cần dùng để liên kết từ bài bổ trợ về bài trụ cột và ngược lại.'
  },
  { 
    id: 'business-plan-mega',
    title: '[MEGA] Kế hoạch kinh doanh 0 đồng', 
    category: 'Marketing', 
    description: 'Quy trình khởi nghiệp từ ý tưởng đến doanh thu đầu tiên.',
    content: 'Bạn là cố vấn khởi nghiệp cấp cao. Hãy lập kế hoạch kinh doanh cho ý tưởng: [Ý tưởng]. Quy trình 7 bước:\n1. Phân tích thị trường & Đối thủ: Tìm ra "đại dương xanh".\n2. Xác định USP (Điểm bán hàng độc nhất): Tại sao khách hàng phải chọn bạn?\n3. Thiết kế sản phẩm mồi (Lead Magnet): Thu hút 100 khách hàng tiềm năng đầu tiên.\n4. Chiến lược nội dung đa kênh (TikTok, Facebook, Group): Cách phủ sóng thương hiệu với chi phí 0 đồng.\n5. Quy trình bán hàng & Chốt đơn: Kịch bản tư vấn tối ưu tỷ lệ chuyển đổi.\n6. Hệ thống vận hành tinh gọn: Các công cụ AI cần dùng để tiết kiệm nhân sự.\n7. Kế hoạch tài chính: Dự toán doanh thu và điểm hòa vốn.'
  },
  { 
    id: 'content-production-mega',
    title: '[MEGA] Quy trình sản xuất nội dung 30 ngày', 
    category: 'Content', 
    description: 'Tạo 30 bài viết chất lượng chỉ trong 2 giờ làm việc.',
    content: 'Bạn là Content Director. Hãy xây dựng quy trình sản xuất nội dung cho [Chủ đề] trong 30 ngày. Quy trình:\n1. Brainstorming: Tìm 30 tiêu đề đánh vào 30 nỗi đau khác nhau của khách hàng.\n2. Phân loại định dạng: 10 bài chia sẻ kiến thức, 10 bài kể chuyện, 5 bài bán hàng, 5 bài tương tác.\n3. Sản xuất hàng loạt (Batching): Viết dàn ý cho 30 bài cùng lúc.\n4. Tối ưu hóa AI: Cách dùng Prompt để viết nội dung chi tiết cho từng bài mà không bị trùng lặp.\n5. Lên lịch tự động: Gợi ý các công cụ đăng bài tự động và khung giờ vàng.'
  },
  { 
    id: 'customer-service-mega',
    title: '[MEGA] Hệ thống CSKH tự động 5 sao', 
    category: 'E-commerce', 
    description: 'Tự động hóa 90% khâu tư vấn và chăm sóc sau bán.',
    content: 'Bạn là chuyên gia tối ưu trải nghiệm khách hàng. Hãy thiết kế hệ thống CSKH cho shop [Tên shop]. Quy trình:\n1. Xây dựng bộ câu hỏi thường gặp (FAQ) thông minh.\n2. Kịch bản Chatbot tư vấn: Từ lúc khách chào đến lúc chốt đơn.\n3. Quy trình xử lý khiếu nại: 4 bước làm hài lòng khách hàng khó tính nhất.\n4. Hệ thống chăm sóc sau bán: Email/Tin nhắn cảm ơn và xin đánh giá 5 sao.\n5. Chiến lược quay vòng khách hàng: Cách tặng quà để khách mua lại lần 2, lần 3.'
  },
  { 
    id: 'affiliate-empire-mega',
    title: '[MEGA] Đế chế Affiliate Marketing tự động', 
    category: 'Marketing', 
    description: 'Quy trình từ A-Z để xây dựng nguồn thu nhập thụ động bền vững.',
    content: 'Bạn là triệu phú Affiliate Marketing. Hãy xây dựng lộ trình thành công cho tôi trong ngách [Ngách sản phẩm]. Quy trình 6 giai đoạn:\n1. Giai đoạn Nghiên cứu (Niche Research): Tìm 5 sản phẩm có hoa hồng cao (>30%) và tỷ lệ chuyển đổi tốt trên Shopee/Lazada/Amazon.\n2. Giai đoạn Xây dựng nền tảng (Platform Setup): Hướng dẫn lập kênh TikTok/Reels/Shorts tối ưu cho Affiliate.\n3. Giai đoạn Sản xuất nội dung hàng loạt (Content Machine): Quy trình dùng AI để tạo 3 video/ngày mà không cần lộ mặt.\n4. Giai đoạn Tối ưu hóa chuyển đổi (Conversion Hack): Cách viết Bio, gắn link và dùng "Call to action" để khách bấm mua ngay.\n5. Giai đoạn Thu hút traffic miễn phí (Traffic Secrets): Bí quyết dùng Hashtag và khung giờ đăng bài để video dễ lên xu hướng.\n6. Giai đoạn Tự động hóa & Mở rộng (Scaling): Cách thuê nhân sự hoặc dùng công cụ để vận hành 10 kênh cùng lúc.',
    isVip: true
  },
  { 
    id: 'tiktok-growth-vip',
    title: '[VIP] Quy trình xây dựng kênh TikTok 100k Follower', 
    category: 'Video', 
    description: 'Chiến lược nội dung để phủ sóng thương hiệu thần tốc.',
    content: 'Bạn là chuyên gia tăng trưởng TikTok. Hãy lập kế hoạch 30 ngày để đạt 100k Follower cho kênh [Tên kênh]. Quy trình:\n- Tuần 1: Định vị thương hiệu và tạo 7 video "Hook" cực mạnh.\n- Tuần 2: Tương tác với cộng đồng và bắt trend thông minh.\n- Tuần 3: Chuỗi video Storytelling để gắn kết cảm xúc với người xem.\n- Tuần 4: Tối ưu hóa thuật toán và livestream bán hàng/tăng tương tác.\nYêu cầu: Mỗi tuần đề xuất 3 ý tưởng video cụ thể.',
    isVip: true
  },
  { 
    id: 'chatbot-sales-vip',
    title: '[VIP] Hệ thống bán hàng tự động qua Chatbot AI', 
    category: 'Sales', 
    description: 'Tự động hóa khâu tư vấn và chốt đơn 24/7.',
    content: 'Thiết kế kịch bản Chatbot AI cho Fanpage [Tên Fanpage]. Quy trình:\n1. Lời chào cá nhân hóa theo tên khách hàng.\n2. Bộ câu hỏi trắc nghiệm để phân loại nhu cầu khách hàng.\n3. Kịch bản tư vấn sản phẩm dựa trên câu trả lời của khách.\n4. Quy trình xử lý khiếu nại/thắc mắc thường gặp tự động.\n5. Kỹ thuật "Upsell" tự động ngay trong hội thoại.\n6. Chuyển đổi sang nhân viên tư vấn thực nếu khách có yêu cầu đặc biệt.',
    isVip: true
  },
  { 
    id: 'content-agency-mega',
    title: '[MEGA] Xây dựng Agency Content AI chuyên nghiệp', 
    category: 'Content', 
    description: 'Quy trình vận hành Agency nội dung quy mô lớn with nhân sự tối thiểu.',
    content: 'Bạn là chủ một Agency Content hàng đầu. Hãy thiết kế quy trình vận hành cho Agency của tôi. Quy trình 5 bước chuyên sâu:\n1. Giai đoạn Tìm kiếm khách hàng (Lead Gen): Cách dùng LinkedIn và Cold Email để tìm 10 khách hàng đầu tiên cần dịch vụ nội dung.\n2. Giai đoạn Thiết kế gói dịch vụ (Service Design): Xây dựng các gói bài viết SEO, kịch bản Video, nội dung Fanpage với mức giá cạnh tranh nhờ tối ưu AI.\n3. Giai đoạn Quy trình sản xuất (Production Workflow): Cách dùng ChatGPT, Midjourney và Canva để sản xuất 100 bài viết/tháng chỉ với 1 nhân sự quản lý.\n4. Giai đoạn Kiểm soát chất lượng (QC Process): Checklist 10 điểm để đảm bảo nội dung AI viết ra không bị phát hiện và đạt chất lượng cao nhất.\n5. Giai đoạn Báo cáo & Giữ chân khách hàng (Reporting & Retention): Mẫu báo cáo hiệu quả (KPIs) hàng tháng để khách hàng tiếp tục gia hạn hợp đồng.',
    isVip: true
  },
  { 
    id: 'youtube-automation-mega',
    title: '[MEGA] Xây dựng kênh YouTube Automation', 
    category: 'Video', 
    description: 'Quy trình tạo kênh YouTube kiếm tiền thụ động mà không cần lộ mặt.',
    content: 'Bạn là chuyên gia YouTube Automation. Hãy lập kế hoạch xây dựng kênh cho ngách [Ngách nội dung]. Quy trình:\n1. Nghiên cứu chủ đề: Tìm 10 chủ đề có CPM cao và lượng tìm kiếm lớn.\n2. Quy trình sản xuất: Cách dùng AI để viết kịch bản, tạo giọng đọc (Text-to-speech) và tìm stock video/hình ảnh.\n3. Tối ưu hóa SEO: Cách viết tiêu đề, mô tả và tag để video ăn đề xuất.\n4. Chiến lược tăng trưởng: Cách dùng Shorts để kéo sub cho kênh chính.\n5. Các phương thức kiếm tiền: Ngoài AdSense, hãy đề xuất 3 cách kiếm tiền khác từ kênh này.',
    isVip: true
  },
  { 
    id: 'messenger-sales-vip',
    title: '[VIP] Kịch bản chốt đơn trên Messenger', 
    category: 'Sales', 
    description: 'Quy trình tư vấn khách hàng qua tin nhắn with tỷ lệ chốt đơn >30%.',
    content: 'Bạn là sát thủ chốt đơn qua tin nhắn. Hãy viết kịch bản tư vấn cho sản phẩm [Sản phẩm]. Quy trình:\n1. Phá băng: Câu hỏi mở đầu để khách hàng tương tác ngay.\n2. Khám phá: 3 câu hỏi để xác định nhu cầu và khả năng chi trả.\n3. Trình bày: Cách giới thiệu sản phẩm tập trung vào giải quyết nỗi đau của khách.\n4. Xử lý từ chối: Kịch bản khi khách nói "Để chị suy nghĩ thêm" hoặc "Hỏi ý kiến chồng".\n5. Chốt hạ: Kỹ thuật tạo sự khan hiếm để khách chuyển khoản ngay.',
    isVip: true
  },
  { 
    id: 'pr-article-vip',
    title: '[VIP] Viết bài PR báo chí chuyên nghiệp', 
    category: 'Content', 
    description: 'Tạo bài viết PR thu hút, khách quan và dễ được duyệt đăng báo.',
    content: 'Bạn là chuyên gia PR & Branding. Hãy viết một bài PR cho sự kiện/sản phẩm [Tên]. Quy trình:\n1. Tiêu đề: Theo phong cách báo chí, khách quan nhưng vẫn gây tò mò.\n2. Sa-pô: Tóm tắt nội dung hấp dẫn nhất trong 2-3 câu.\n3. Thân bài: Cấu trúc hình tháp ngược, đưa thông tin quan trọng nhất lên đầu.\n4. Trích dẫn: Viết 2 đoạn trích dẫn từ chuyên gia hoặc khách hàng để tăng độ tin cậy.\n5. Boilerplate: Giới thiệu ngắn gọn về doanh nghiệp ở cuối bài.',
    isVip: true
  },
  { 
    id: 'upwork-fiverr-vip',
    title: '[VIP] Tối ưu hóa hồ sơ Upwork/Fiverr', 
    category: 'Sales', 
    description: 'Cách viết Profile thu hút khách hàng quốc tế và nhận dự án đầu tiên.',
    content: 'Bạn là Freelancer thành công trên sàn quốc tế. Hãy tối ưu hồ sơ cho tôi trong mảng [Kỹ năng]. Quy trình:\n1. Tiêu đề hồ sơ: Chứa từ khóa ngách và giá trị cốt lõi.\n2. Phần giới thiệu (Overview): Viết theo phong cách giải quyết vấn đề cho khách hàng, không phải kể lể về bản thân.\n3. Danh mục dịch vụ: Đề xuất 3 gói dịch vụ từ cơ bản đến cao cấp.\n4. Mẫu thư chào hàng (Cover Letter): Viết một mẫu thư ngắn gọn, tập trung vào kết quả cho dự án cụ thể.',
    isVip: true
  },
  { 
    id: 'pinterest-affiliate-mega',
    title: '[MEGA] Affiliate Marketing trên Pinterest', 
    category: 'Marketing', 
    description: 'Quy trình kéo traffic miễn phí từ Pinterest về link Affiliate.',
    content: 'Bạn là chuyên gia Pinterest Marketing. Hãy lập kế hoạch cho ngách [Ngách]. Quy trình:\n1. Thiết lập tài khoản Business: Cách tối ưu tên, bio và các bảng (Boards) chuẩn SEO.\n2. Chiến lược hình ảnh: Cách dùng Canva/AI để tạo 10 mẫu Pin thu hút click mỗi ngày.\n3. Tối ưu hóa từ khóa: Cách tìm từ khóa xu hướng trên Pinterest để gắn vào mô tả Pin.\n4. Quy trình đăng bài: Tần suất đăng và cách dùng công cụ tự động hóa.\n5. Chuyển đổi: Cách dẫn dắt khách hàng từ Pin về Landing Page hoặc link mua hàng trực tiếp.',
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
    id: 'livestream-script-vip',
    title: '[VIP] Viết kịch bản Livestream bán hàng', 
    category: 'Sales', 
    description: 'Cấu trúc kịch bản giữ chân người xem và chốt đơn liên tục trên Live.',
    content: 'Bạn là bậc thầy Livestream. Hãy viết kịch bản Live cho buổi bán [Sản phẩm]. Quy trình:\n1. Mở đầu (10 phút đầu): Cách kéo người xem vào và tạo không khí sôi động.\n2. Giới thiệu sản phẩm: Cách trình bày tính năng và lợi ích một cách trực quan.\n3. Tạo game/quà tặng: Cách lồng ghép mini-game để tăng tương tác và giữ chân người xem.\n4. Kịch bản chốt đơn: Cách hô hào và tạo sự khan hiếm (Flash sale) để khách comment mua ngay.\n5. Xử lý thắc mắc: Chuẩn bị câu trả lời cho 5 câu hỏi phổ biến nhất trên Live.',
    isVip: true
  },
  { 
    id: 'email-newsletter-mega',
    title: '[MEGA] Xây dựng hệ thống Email Newsletter', 
    category: 'Marketing', 
    description: 'Quy trình xây dựng danh sách email và kiếm tiền từ bản tin định kỳ.',
    content: 'Bạn là chuyên gia Email Marketing. Hãy lập kế hoạch xây dựng Newsletter cho chủ đề [Chủ đề]. Quy trình:\n1. Chọn ngách & Định vị: Tại sao người ta nên đăng ký nhận email của bạn?\n2. Thu thập Lead: Thiết kế Landing Page và quà tặng (Lead Magnet) để thu hút sub.\n3. Cấu trúc nội dung: Dàn ý cho một bản tin hàng tuần (Tin tức, Kiến thức, Tài nguyên, Quảng cáo).\n4. Chiến lược kiếm tiền: Đề xuất 3 cách (Sponsorship, Affiliate, Bán sản phẩm riêng).\n5. Công cụ vận hành: Gợi ý các nền tảng gửi email hiệu quả và chi phí thấp.',
    isVip: true
  },
  { 
    id: 'google-maps-seo-vip',
    title: '[VIP] Tối ưu hóa Google Maps (GMB)', 
    category: 'SEO', 
    description: 'Cách đưa địa điểm kinh doanh của bạn lên top tìm kiếm địa phương.',
    content: 'Bạn là chuyên gia Local SEO. Hãy tối ưu Google Business Profile cho [Tên doanh nghiệp]. Quy trình:\n1. Tối ưu thông tin cơ bản: Tên, Danh mục, Mô tả chứa từ khóa địa phương.\n2. Chiến lược hình ảnh: Các loại ảnh cần đăng để tăng uy tín và thu hút khách.\n3. Quản lý đánh giá: Cách xin review 5 sao và phản hồi để tăng thứ hạng.\n4. Đăng bài (Posts): Lịch trình đăng tin tức/ưu đãi trên Maps để giữ tương tác.\n5. Trích dẫn (Citations): Danh sách các trang vàng/thư mục cần đăng ký để đồng bộ thông tin.',
    isVip: true
  },
  { 
    id: 'podcast-script-vip',
    title: '[VIP] Viết kịch bản Podcast chuyên sâu', 
    category: 'Video', 
    description: 'Cấu trúc nội dung Podcast thu hút và có chiều sâu.',
    content: 'Bạn là nhà sản xuất Podcast chuyên nghiệp. Hãy viết kịch bản cho tập Podcast về [Chủ đề]. Quy trình:\n1. Giới thiệu: Cách mở đầu gây tò mò và giới thiệu khách mời (nếu có).\n2. Dẫn dắt câu chuyện: Chia nội dung thành 3-4 phần chính với các câu hỏi gợi mở.\n3. Điểm nhấn: Thêm các đoạn "Key takeaways" sau mỗi phần.\n4. Kết luận: Tóm tắt thông điệp chính và kêu gọi hành động (Subscribe/Review).\n5. Ghi chú (Show notes): Viết đoạn mô tả chuẩn SEO cho tập Podcast này.',
    isVip: true
  },
  { 
    id: 'etsy-digital-mega',
    title: '[MEGA] Quy trình bán hàng trên Etsy với AI', 
    category: 'E-commerce', 
    description: 'Cách tạo và bán sản phẩm kỹ thuật số (Digital Products) trên Etsy.',
    content: 'Bạn là chuyên gia bán hàng trên Etsy. Hãy lập kế hoạch cho cửa hàng bán [Loại sản phẩm kỹ thuật số]. Quy trình:\n1. Nghiên cứu ngách: Tìm các sản phẩm đang bán chạy nhưng ít cạnh tranh.\n2. Sản xuất sản phẩm: Cách dùng AI (Midjourney, ChatGPT, Canva) để tạo file chất lượng cao.\n3. Tối ưu hóa SEO Etsy: Cách viết tiêu đề và 13 thẻ (Tags) để khách hàng dễ tìm thấy.\n4. Chiến lược hình ảnh: Cách tạo Mockup chuyên nghiệp cho sản phẩm kỹ thuật số.\n5. Chăm sóc khách hàng: Các mẫu tin nhắn tự động để tăng tỷ lệ đánh giá 5 sao.',
    isVip: true
  },
  { 
    id: 'review-analysis-vip',
    title: '[VIP] Phân tích tâm lý khách hàng qua đánh giá', 
    category: 'Marketing', 
    description: 'Dùng AI để đọc vị khách hàng và cải thiện sản phẩm/dịch vụ.',
    content: 'Bạn là chuyên gia phân tích dữ liệu khách hàng. Hãy phân tích 50 đánh giá sau của đối thủ/sản phẩm [Tên]. Quy trình:\n1. Phân loại cảm xúc: Tỷ lệ hài lòng vs không hài lòng.\n2. Xác định nỗi đau: 3 vấn đề lớn nhất mà khách hàng phàn nàn.\n3. Xác định kỳ vọng: Những tính năng/dịch vụ mà khách hàng mong muốn thêm.\n4. Đề xuất cải tiến: Dựa trên phân tích, hãy đưa ra 5 hành động cụ thể để sản phẩm của tôi vượt trội hơn.',
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
  const [userRole, setUserRole] = useState<'free' | 'pro' | 'admin'>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
    }, (error) => {
      handleFirestoreError(error, 'list', 'prompts');
    });

    const fetchBlogPosts = onSnapshot(collection(db, 'blog_posts'), (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestoreBlogPosts(blogData);
    }, (error) => {
      handleFirestoreError(error, 'list', 'blog_posts');
    });

    return () => {
      fetchPrompts();
      fetchBlogPosts();
    };
  }, []);
  const [isLoadingBlog, setIsLoadingBlog] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [activeBlogCategory, setActiveBlogCategory] = useState('Tất cả');
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'admin'>('home');
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
  const categories = ['Tất cả', 'Yêu thích', 'Content', 'Social Media', 'Ads', 'Email', 'SEO', 'Automation'];
  
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
    setIsPromptRunning(true);
    try {
      const finalPrompt = getFinalPrompt();
      const result = await runCustomPrompt(finalPrompt);
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
    if (!interests) return;
    setIsLoading(true);
    try {
      const result = await generateSideHustleIdea(interests);
      setAiResult(result);
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
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
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
          </motion.section>
        )}
      </AnimatePresence>

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
                <li><a href="#ideas" className="hover:text-orange-500 transition-colors">Ý tưởng AI</a></li>
                <li><a href="#ai-tools" className="hover:text-orange-500 transition-colors">Công cụ AI</a></li>
                <li><a href="#prompts" className="hover:text-orange-500 transition-colors">Thư viện Prompt</a></li>
                <li><a href="#generator" className="hover:text-orange-500 transition-colors">Trình tạo lộ trình</a></li>
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

            <div className="prose prose-lg prose-orange max-w-none">
              <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
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
            <a href="#ideas" className="hover:text-orange-500 transition-colors">Ý tưởng</a>
            <a href="#ai-tools" className="hover:text-orange-500 transition-colors">Công cụ AI</a>
            <a href="#prompts" className="hover:text-orange-500 transition-colors">Prompt</a>
            <a href="#videos" className="hover:text-orange-500 transition-colors">Video</a>
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
            {userRole === 'pro' && <a href="#masterclass" className="text-orange-600 font-bold">Masterclass</a>}
            
            <div className="h-6 w-px bg-gray-100" />

            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900 leading-none">{currentUser.displayName || 'Người dùng'}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{userRole} Plan</span>
                  </div>
                </div>
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

      {activeTab === 'home' ? mainContent : libraryContent}
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
