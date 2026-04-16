import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Rocket, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  MessageSquare, 
  MousePointer2,
  Video,
  Layout,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const ROADMAP_STEPS = [
  {
    id: 1,
    title: 'Giai đoạn 1: Nền tảng nội dung',
    subtitle: 'Ngày 1 - 15',
    description: 'Xây dựng sự uy tín và tò mò trên TikTok & Reels.',
    icon: <Video className="w-5 h-5 text-blue-500" />,
    actions: [
      'Đăng 1-2 video ngắn mỗi ngày (hướng dẫn AI, tip nhanh)',
      'Sử dụng Hook: "Cách ứng dụng AI để làm X trong Y phút"',
      'Xây dựng Link-in-Bio trỏ về Website'
    ],
    metric: '10.000+ Views',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Giai đoạn 2: Phễu thu hút (Lead Magnet)',
    subtitle: 'Ngày 16 - 30',
    description: 'Tặng quà giá trị để đổi lấy lượt đăng ký Free.',
    icon: <Mail className="w-5 h-5 text-orange-500" />,
    actions: [
      'Tặng Ebook: "10 Cách Kiếm 1000$ Đầu Tiên Với AI"',
      'Tặng 50+ Prompt mẫu cơ bản (Free Library)',
      'Tích hợp Form đăng ký tự động trên Landing Page'
    ],
    metric: '200+ Users',
    color: 'bg-orange-500'
  },
  {
    id: 3,
    title: 'Giai đoạn 3: Vòng lặp tương tác',
    subtitle: 'Ngày 31 - 60',
    description: 'Nuôi dưỡng người dùng bằng giá trị mới hàng tuần.',
    icon: <Zap className="w-5 h-5 text-purple-500" />,
    actions: [
      'Email Marketing hàng tuần về xu hướng AI mới nhất',
      'Cập nhật 5-10 Prompt mới vào Thư viện mỗi tuần',
      'Tổ chức mini-game nhận quà trên mạng xã hội'
    ],
    metric: '500+ Users',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    title: 'Giai đoạn 4: Bứt phá 1.000 User',
    subtitle: 'Ngày 61 - 90',
    description: 'Tối ưu hóa chuyển đổi và lan tỏa tự nhiên.',
    icon: <Rocket className="w-5 h-5 text-green-500" />,
    actions: [
      'Chạy quảng cáo Retargeting người dùng cũ',
      'Chương trình giới thiệu (Referral): Tặng 1 tuần Pro khi mời bạn',
      'Hợp tác với các Micro-Influencer trong ngách AI'
    ],
    metric: '1.000+ Users',
    color: 'bg-green-500'
  }
];

export const RoadmapDashboard = () => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-4 bg-gray-50/50 p-8 border-r border-gray-100">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-xl leading-none">Roadmap</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">1,000 Users Strategy</p>
            </div>
          </div>

          <div className="space-y-4">
            {ROADMAP_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group",
                  activeStep === step.id 
                    ? "bg-white shadow-md border border-gray-100" 
                    : "hover:bg-gray-100/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0",
                  activeStep === step.id ? step.color : "bg-gray-200"
                )}>
                  {step.id}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{step.title}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{step.subtitle}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 p-6 bg-orange-500 rounded-3xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
            <div className="relative z-10">
              <p className="text-xs font-bold opacity-80 mb-1">Mục tiêu cuối cùng</p>
              <h3 className="text-3xl font-black">1.000+</h3>
              <p className="text-xs font-bold uppercase tracking-widest">Đăng ký Free</p>
            </div>
            <Users className="absolute bottom-4 right-4 w-12 h-12 opacity-20" />
          </div>
        </div>

        {/* Right Content - Details */}
        <div className="lg:col-span-8 p-8 md:p-12 bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className={cn("inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase text-white mb-4", ROADMAP_STEPS[activeStep - 1].color)}>
                    {ROADMAP_STEPS[activeStep - 1].subtitle}
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">
                    {ROADMAP_STEPS[activeStep-1].title}
                  </h2>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  {ROADMAP_STEPS[activeStep - 1].icon}
                </div>
              </div>

              <p className="text-gray-500 mb-10 text-lg leading-relaxed">
                {ROADMAP_STEPS[activeStep-1].description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                  <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Hành động chính
                  </h4>
                  <ul className="space-y-3">
                    {ROADMAP_STEPS[activeStep - 1].actions.map((action, i) => (
                      <li key={i} className="text-xs text-gray-600 leading-snug flex gap-2">
                        <span className="text-orange-500 mt-0.5 animate-pulse">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-gray-900 text-white rounded-[32px] shadow-xl">
                  <h4 className="font-bold text-sm mb-4 opacity-70 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" /> Kpi dự kiến
                  </h4>
                  <div className="text-4xl font-black text-orange-400 mb-2">
                    {ROADMAP_STEPS[activeStep - 1].metric}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lượt tiếp cận / Người dùng</p>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/50/50`} referrerPolicy="no-referrer" alt="User" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">+1.2k Đang áp dụng</span>
                </div>
                
                {activeStep < 4 ? (
                  <button 
                    onClick={() => setActiveStep(prev => prev + 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all group"
                  >
                    Giai đoạn tiếp theo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    Bắt đầu thực hiện ngay <Rocket className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
