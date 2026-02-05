import React, { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { api } from '@/services/api';
import { Flame, TrendingUp, Share2, Loader2, AlertCircle } from 'lucide-react';

interface DashboardStats {
  activeProjects: number;
  streak: number;
  activity: { name: string; value: number }[];
  languages: { name: string; value: number }[];
}

const Stats: React.FC = () => {
  const streakRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await api.stats.getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('فشل في تحميل الإحصائيات');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleShare = async () => {
    if (!streakRef.current || isSharing) return;

    if (!(window as any).html2canvas) {
      alert('مكتبة التصوير غير جاهزة بعد، يرجى تحديث الصفحة.');
      return;
    }

    setIsSharing(true);

    try {
      const canvas = await (window as any).html2canvas(streakRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      const watermarkHeight = 80;

      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + watermarkHeight;

      if (ctx) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        ctx.drawImage(canvas, 0, 0);
        ctx.font = 'bold 24px Tajawal, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("Masar App 🚀 - Developed by Mohamed Gamal", finalCanvas.width / 2, canvas.height + (watermarkHeight / 2));
      }

      finalCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'masar_streak.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Masar Coding Streak 🔥',
            text: 'Check out my coding streak on Masar! #MasarApp #Coding',
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'masar_streak.png';
          a.click();
          URL.revokeObjectURL(url);
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (error) {
      console.error("Sharing failed:", error);
      alert("حدث خطأ أثناء المشاركة.");
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-400 font-sans">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
        <AlertCircle size={40} className="text-red-500" />
        <h3 className="text-red-200 font-bold">حدث خطأ</h3>
        <p className="text-red-400/80 text-sm">{error}</p>
      </div>
    );
  }

  const chartColors = ['#3b82f6', '#eab308', '#f43f5e', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 font-sans text-right">إحصائيات الإنجاز</h2>

      {/* Streak Card */}
      <div className="relative group">
        <div
          ref={streakRef}
          className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-2xl p-6 flex items-center justify-between"
        >
          <div className="text-right">
            <span className="text-orange-400 font-bold block mb-1 font-sans">سلسلة البرمجة</span>
            <span className="text-4xl font-black text-white">{stats.streak} <span className="text-lg font-normal text-slate-400 font-sans">يوم</span></span>
          </div>
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center animate-pulse">
            <Flame size={32} className="text-orange-500" />
          </div>
        </div>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="absolute top-4 left-4 p-2 bg-slate-900/50 hover:bg-slate-900 backdrop-blur-sm rounded-full border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
          title="مشاركة الإنجاز"
        >
          {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
        </button>
      </div>

      {/* Monthly Activity Chart */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-200 font-sans text-right order-2">الإصدارات الشهرية</h3>
          <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded order-1">
            <TrendingUp size={12} />
            {stats.activity.length > 0 ? '+12% هذا الشهر' : 'ابدأ مشروعك الأول'}
          </span>
        </div>
        <div className="h-48 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.activity}>
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stats.activity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === stats.activity.length - 1 ? '#3b82f6' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Language Distribution (Donut) */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <h3 className="font-bold text-slate-200 mb-4 font-sans text-right">اللغات المستخدمة</h3>
        <div className="flex items-center flex-row-reverse">
          <div className="h-32 w-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.languages}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.languages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 pl-4 text-right">
            {stats.languages.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }}></span>
                  <span className="text-xs text-slate-300 font-sans">{item.name}</span>
                </div>
                <span className="text-xs font-mono text-slate-500">{item.value}%</span>
              </div>
            ))}
            {stats.languages.length === 0 && (
              <p className="text-xs text-slate-500 italic font-sans">لا توجد مشاريع نشطة بعد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;