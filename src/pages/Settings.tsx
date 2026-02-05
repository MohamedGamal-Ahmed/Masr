import React, { useState } from 'react';
import { Webhook, Bell, Lock, Github, Radio, Check, Mail, LifeBuoy, ArrowUpRight, RotateCcw } from 'lucide-react';
import BackupModal from '../components/BackupModal';

const Settings: React.FC = () => {
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const handleContactSupport = () => {
    const email = "mgamal.ahmed@outlook.com";
    const subject = encodeURIComponent("ملاحظات تطبيق مسار | Masar App Feedback");

    // Gather technical details
    const userAgent = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language;
    const platform = navigator.platform;
    const appVersion = "v1.0.0 (Web/PWA)";

    // Construct email body
    const body = encodeURIComponent(`
مرحباً محمد،
(اكتب ملاحظتك، اقتراحك، أو المشكلة التي واجهتها هنا...)


------------------------------------------------
Technical Details (For Developer Diagnostics):
------------------------------------------------
Device/Agent: ${userAgent}
Platform: ${platform}
Screen Resolution: ${screenRes}
Language: ${language}
App Version: ${appVersion}
------------------------------------------------
`);

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleResetWelcome = () => {
    if (confirm('هل تود إعادة إظهار رسالة الترحيب عند فتح التطبيق مرة أخرى؟')) {
      localStorage.removeItem('masar_welcome_seen');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">الإعدادات والربط</h2>

      {/* Support & Feedback Section (New) */}
      <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/30 rounded-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-xl"></div>

        <div className="p-4 border-b border-slate-800/50 flex justify-between items-center relative z-10">
          <h3 className="font-bold text-blue-100 flex items-center gap-2">
            <LifeBuoy size={18} className="text-blue-500" />
            الدعم والمساعدة
          </h3>
        </div>
        <div className="p-4 relative z-10">
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            هل واجهت مشكلة تقنية؟ أو لديك فكرة رائعة لتطوير "مسار"؟
            يسعدنا سماع صوتك دائماً.
          </p>

          <button
            onClick={handleContactSupport}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Mail size={18} />
            تواصل مع المطور
            <ArrowUpRight size={14} className="opacity-70" />
          </button>

          <p className="text-[10px] text-slate-500 text-center mt-3">
            * سيتم إرفاق بعض البيانات التقنية (نوع الجهاز، النظام) تلقائياً للمساعدة في حل المشكلة.
          </p>
        </div>
      </div>

      {/* API / GitHub Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Github size={18} />
            إدارة النسخ والاحتفاظ بالبيانات
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-200 block">مزامنة البيانات سحابياً</span>
              <span className="text-[10px] text-slate-500">حفظ نسخة من قاعدة البيانات على حسابك في GitHub</span>
            </div>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 px-4 py-2 rounded-lg border border-blue-500/20 text-xs font-bold transition-colors"
            >
              إعداد النسخ الاحتياطي
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-200 block">مزامنة CHANGELOG.md</span>
                <span className="text-[10px] text-slate-500">دفع التغييرات تلقائياً إلى GitHub</span>
              </div>
              <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer opacity-50">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-200 block">إنشاء Tags تلقائياً</span>
                <span className="text-[10px] text-slate-500">عند اكتمال Milestone جديد</span>
              </div>
              <div className="w-11 h-6 bg-slate-700 rounded-full relative cursor-pointer opacity-50">
                <div className="w-5 h-5 bg-slate-400 rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />

      {/* Webhooks Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Webhook size={18} className="text-purple-500" />
            إشعارات الـ Webhooks
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#5865F2] flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <div>
                <span className="text-sm font-bold block">Discord</span>
                <span className="text-[10px] text-green-500">متصل نشط</span>
              </div>
            </div>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700">تعديل</button>
          </div>

          <div className="relative">
            <label className="text-[10px] text-slate-500 mb-1 block">رابط الـ Webhook</label>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-2 items-center">
              <span className="text-xs text-slate-600 select-none">https://discord.com/api/webhooks/...</span>
              <Lock size={12} className="mr-auto text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Bell size={18} className="text-yellow-500" />
            تنبيهات ركود المشاريع
          </h3>
        </div>
        <div className="p-4 flex gap-4 overflow-x-auto no-scrollbar">
          {[
            { label: 'حذرة', days: '14 يوم', color: 'bg-yellow-500/10 border-yellow-500/30' },
            { label: 'حرجة', days: '30 يوم', color: 'bg-red-500/10 border-red-500/30' }
          ].map((alert, idx) => (
            <div key={idx} className={`min-w-[120px] p-3 rounded-lg border ${alert.color} flex flex-col items-center justify-center`}>
              <span className="text-xs text-slate-300 mb-1">{alert.label}</span>
              <span className="text-xl font-bold text-white">{alert.days}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Debug / Reset Zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <RotateCcw size={18} className="text-slate-500" />
            إجراءات تصحيحية
          </h3>
        </div>
        <div className="p-4">
          <button
            onClick={handleResetWelcome}
            className="w-full text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={14} /> إعادة عرض رسالة الترحيب
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-2">
            استخدم هذا الزر إذا أردت رؤية شاشة البداية مرة أخرى.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Settings;