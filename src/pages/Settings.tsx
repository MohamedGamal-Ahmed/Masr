import React, { useState } from 'react';
import { Github, Mail, LifeBuoy, ArrowUpRight, RotateCcw } from 'lucide-react';
import BackupModal from '../components/BackupModal';
import { api } from '@/services/api';
import { IntegrationHook } from '@/types';

const Settings: React.FC = () => {
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [hooks, setHooks] = useState<IntegrationHook[]>([]);
  const [newHookName, setNewHookName] = useState('');
  const [newHookProvider, setNewHookProvider] = useState<'slack' | 'discord' | 'custom'>('slack');
  const [newHookEndpoint, setNewHookEndpoint] = useState('');
  const [isSavingHook, setIsSavingHook] = useState(false);

  React.useEffect(() => {
    const loadHooks = async () => {
      const all = await api.integrations.getHooks();
      setHooks(all);
    };
    void loadHooks();
  }, []);

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

  const handleCreateHook = async () => {
    if (!newHookName.trim() || !newHookEndpoint.trim()) return;
    setIsSavingHook(true);
    try {
      const created = await api.integrations.createHook({
        name: newHookName.trim(),
        provider: newHookProvider,
        endpoint: newHookEndpoint.trim(),
        enabled: true,
        events: ['note_created', 'note_updated', 'note_completed', 'issue_linked'],
      });
      setHooks(prev => [created, ...prev]);
      setNewHookName('');
      setNewHookEndpoint('');
      setNewHookProvider('slack');
    } catch (err) {
      console.error('Failed to create hook', err);
      alert('Failed to create integration hook.');
    } finally {
      setIsSavingHook(false);
    }
  };

  const handleToggleHook = async (hook: IntegrationHook) => {
    const updated = await api.integrations.updateHook(hook.id, { enabled: !hook.enabled });
    setHooks(prev => prev.map(item => (item.id === hook.id ? updated : item)));
  };

  const handleDeleteHook = async (hookId: string) => {
    await api.integrations.deleteHook(hookId);
    setHooks(prev => prev.filter(item => item.id !== hookId));
  };

  const handleTestHook = async (hookId: string) => {
    try {
      await api.integrations.testHook(hookId);
      const refreshed = await api.integrations.getHooks();
      setHooks(refreshed);
      alert('Hook test sent.');
    } catch (err) {
      console.error('Failed to test hook', err);
      alert('Failed to test hook.');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">الإعدادات والربط</h2>

      {/* Support & Feedback Section */}
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
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-200 block font-sans">مزامنة البيانات سحابياً</span>
              <span className="text-[10px] text-slate-500">حفظ نسخة من قاعدة البيانات على حسابك في GitHub</span>
            </div>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 px-4 py-2 rounded-lg border border-blue-500/20 text-xs font-bold transition-colors"
            >
              إعداد النسخ الاحتياطي
            </button>
          </div>
        </div>
      </div>

      <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />

      {/* Debug / Reset Zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <RotateCcw size={18} className="text-slate-400" />
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-200">Integration Hooks (Slack / Discord ready)</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-2">
            <input
              value={newHookName}
              onChange={(e) => setNewHookName(e.target.value)}
              placeholder="Hook Name"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
            />
            <select
              value={newHookProvider}
              onChange={(e) => setNewHookProvider(e.target.value as 'slack' | 'discord' | 'custom')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value="slack">Slack</option>
              <option value="discord">Discord</option>
              <option value="custom">Custom</option>
            </select>
            <input
              value={newHookEndpoint}
              onChange={(e) => setNewHookEndpoint(e.target.value)}
              placeholder="https://..."
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
            />
          </div>

          <button
            onClick={handleCreateHook}
            disabled={isSavingHook}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
          >
            {isSavingHook ? 'Saving...' : 'Add Hook'}
          </button>

          <div className="space-y-2">
            {hooks.length === 0 ? (
              <p className="text-xs text-slate-500">No hooks configured yet.</p>
            ) : (
              hooks.map(hook => (
                <div key={hook.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-semibold truncate">{hook.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{hook.provider} - {hook.endpoint}</p>
                    <p className="text-[10px] text-slate-600">Last: {hook.lastTriggeredAt || 'never'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestHook(hook.id)}
                      className="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleToggleHook(hook)}
                      className={`text-[10px] px-2 py-1 rounded border ${hook.enabled ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-slate-700 text-slate-400'}`}
                    >
                      {hook.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleDeleteHook(hook.id)}
                      className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-300 bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
