import React, { useState } from 'react';
import { 
  Zap, 
  Target, 
  AlertCircle, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  BarChart3, 
  Sparkles,
  ArrowRight,
  Copy,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const FORMULAS = [
  {
    id: 'numbers',
    label: 'Gây sốc',
    title: 'Gây sốc bằng con số',
    description: 'Dùng số cụ thể + hành động cụ thể để gây kinh ngạc ngay giây đầu.',
    weak: 'Hôm nay mình sẽ hướng dẫn các bạn cách dùng AI để làm video...',
    strong: 'Cái video này mình làm trong 47 giây — bằng AI, không cần edit.',
    why: 'Con số cụ thể (47 giây) tạo tính xác thực. Não người tự hỏi "thật không?" → xem để kiểm chứng.',
    color: 'bg-blue-500'
  },
  {
    id: 'result',
    label: 'Kết quả',
    title: 'Kết quả trước, giải thích sau',
    description: 'Cho xem output đẹp ngay giây đầu, sau đó mới nói cách làm.',
    weak: 'Hôm nay mình sẽ dạy các bạn tạo thumbnail bằng AI từng bước một...',
    strong: '[Hiện sản phẩm lên màn hình] Cái này mình vừa tạo ra. Bạn cũng làm được — mình sẽ chỉ.',
    why: 'TikTok là nền tảng visual — người xem quyết định ở lại dựa trên hình ảnh. Kết quả đẹp = bằng chứng lập tức.',
    color: 'bg-green-500'
  },
  {
    id: 'mistake',
    label: 'Sai lầm',
    title: 'Chỉ ra sai lầm phổ biến',
    description: 'Kích hoạt nỗi sợ bỏ lỡ + tò mò "mình có đang sai không?"',
    weak: 'Nhiều người không biết dùng AI đúng cách, hôm nay mình chia sẻ...',
    strong: '95% người dùng AI đang lãng phí 2 tiếng mỗi ngày vì lỗi này.',
    why: 'Não người phản ứng mạnh với nguy cơ thua lỗ hơn cơ hội lợi nhuận. "Lỗi này" + "2 tiếng" tạo FOMO cực mạnh.',
    color: 'bg-orange-500'
  },
  {
    id: 'secret',
    label: 'Bí mật',
    title: 'Tiết lộ bí mật / ít ai biết',
    description: 'Đánh vào cảm giác được chia sẻ thông tin đặc quyền.',
    weak: 'Đây là một công cụ AI hay mà bạn có thể dùng để làm video...',
    strong: 'Tool AI này free, ít ai biết, đang dùng để kiếm 15 triệu/tháng.',
    why: '"Ít ai biết" + "free" + con số thu nhập = 3 yếu tố tò mò xếp chồng. Người xem cảm thấy sắp nhận tin đặc quyền.',
    color: 'bg-purple-500'
  },
  {
    id: 'challenge',
    label: 'Thử thách',
    title: 'Thử thách trực tiếp người xem',
    description: 'Tạo cuộc đối thoại tâm lý — người xem ở lại để "phản bác".',
    weak: 'Mình sẽ chỉ cho các bạn cách làm video AI nhanh hơn bình thường...',
    strong: 'Bạn không thể làm video này trong 1 phút. Mình cá vậy — xem thử đi.',
    why: 'Bị thách thức = tự ái nổi lên = muốn xem để chứng minh. Người xem ở lại vì muốn biết kết quả, không phải bị thụ động.',
    color: 'bg-red-500'
  }
];

export const TikTokHookLab = ({ onToast }: { onToast: (msg: string) => void }) => {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [toolResult, setToolResult] = useState('');
  const [timeResult, setTimeResult] = useState('');
  const [selectedFormula, setSelectedFormula] = useState(FORMULAS[0].id);
  const [generatedHook, setGeneratedHook] = useState('');

  const filters = ['Tất cả', ...FORMULAS.map(f => f.label)];

  const filteredFormulas = activeFilter === 'Tất cả' 
    ? FORMULAS 
    : FORMULAS.filter(f => f.label === activeFilter);

  const generateHook = () => {
    if (!toolResult) {
      onToast('Vui lòng nhập công cụ/kết quả!');
      return;
    }

    let hook = '';
    const toolTrimmed = toolResult.trim();
    const timeTrimmed = timeResult.trim() || '30 giây';

    switch (selectedFormula) {
      case 'numbers':
        hook = `Video này mình làm trong đúng ${timeTrimmed} — bằng AI, không cần đụng tay vào editor.`;
        break;
      case 'result':
        hook = `[Show ${toolTrimmed}] Cái này mình vừa tạo ra trong ${timeTrimmed}. Bạn cũng làm được — bí mật nằm ở đây.`;
        break;
      case 'mistake':
        hook = `90% mọi người đang mất cả tiếng để ${toolTrimmed}. Thực ra chỉ cần ${timeTrimmed} nếu bạn biết tool này.`;
        break;
      case 'secret':
        hook = `Tool AI này free 100%, ít ai biết, đang được các tay to dùng để ${toolTrimmed} kiếm bộn tiền.`;
        break;
      case 'challenge':
        hook = `Thách bạn ${toolTrimmed} trong vòng ${timeTrimmed}. Mình cá là bạn không làm được nếu thiếu bộ Prompt này.`;
        break;
      default:
        hook = `Cách để ${toolTrimmed} chỉ trong ${timeTrimmed} bằng AI cực kỳ đơn giản.`;
    }

    setGeneratedHook(hook);
    onToast('Đã tạo Hook thành công!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedHook);
    onToast('Đã sao chép Hook!');
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-sans pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <div className="text-4xl font-black text-orange-500 mb-2">3s</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cửa sổ quyết định</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <div className="text-4xl font-black text-red-500 mb-2">70%</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Drop nếu Hook yếu</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm text-center">
          <div className="text-4xl font-black text-blue-500 mb-2">5</div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Công thức chính</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-bold transition-all border shrink-0",
              activeFilter === filter 
                ? "bg-black text-white border-black" 
                : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Formula Cards */}
      <div className="space-y-10 mb-20">
        {filteredFormulas.map((formula, idx) => (
          <motion.div 
            key={formula.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-black text-gray-400">Công thức {idx + 1} —</span>
                    <h3 className="text-2xl font-black text-gray-900">{formula.title}</h3>
                  </div>
                  <p className="text-gray-500">{formula.description}</p>
                </div>
                <div className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase text-white self-start md:self-center", formula.color)}>
                  {formula.label}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                  <div className="flex items-center gap-2 mb-4 text-red-600 font-bold text-xs uppercase tracking-widest">
                    <XCircle className="w-4 h-4" /> Yếu
                  </div>
                  <p className="text-gray-700 italic">"{formula.weak}"</p>
                </div>
                <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                  <div className="flex items-center gap-2 mb-4 text-green-600 font-bold text-xs uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Mạnh
                  </div>
                  <p className="text-gray-900 font-bold">"{formula.strong}"</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-black text-gray-900 uppercase mr-2">Tại sao hiệu quả:</span>
                  {formula.why}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive Generator */}
      <div className="bg-gray-900 rounded-[48px] p-8 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Tạo hook cho video của bạn</h2>
            <p className="text-gray-400">Điền thông tin → nhận hook sẵn dùng ngay</p>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Công cụ / Kết quả AI bạn muốn quay</label>
                <input 
                  type="text" 
                  value={toolResult}
                  onChange={(e) => setToolResult(e.target.value)}
                  placeholder="VD: tạo thumbnail, lòng tiếng AI, viết caption..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Thời gian làm ra kết quả</label>
                <input 
                  type="text" 
                  value={timeResult}
                  onChange={(e) => setTimeResult(e.target.value)}
                  placeholder="VD: 45 giây, 2 phút, 1 phút 20 giây..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Chọn công thức hook</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {FORMULAS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFormula(f.id)}
                    className={cn(
                      "p-3 rounded-xl border text-[10px] font-black uppercase transition-all tracking-wider",
                      selectedFormula === f.id 
                        ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {f.title.split(' ')[0]} {f.title.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={generateHook}
              className="w-full py-6 bg-white text-black rounded-[32px] font-black text-xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-2xl"
            >
              Tạo hook ngay <Sparkles className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {generatedHook && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-12 p-8 bg-white text-black rounded-[32px] relative group"
                >
                  <div className="absolute top-4 right-4 text-[10px] font-black uppercase text-gray-300">Hook Ready</div>
                  <div className="text-xl md:text-2xl font-black leading-tight text-center px-4">
                    "{generatedHook}"
                  </div>
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-2xl text-sm font-bold hover:bg-orange-500 hover:text-white transition-all"
                    >
                      <Copy className="w-4 h-4" /> Sao chép Hook
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
