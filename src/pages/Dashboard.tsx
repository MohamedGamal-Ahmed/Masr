import React, { useState, useEffect, useMemo, memo } from 'react';
import { Activity, GitCommit, GitMerge, Clock, ChevronLeft, AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Note, Project, VersionLog } from '@/types';
import { api } from '@/services/api';

const StatCard = memo(({ icon: Icon, value, label, colorClass }: { icon: any, value: string | number, label: string, colorClass: string }) => (
  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
    <Icon className={`${colorClass} mb-2`} size={20} />
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-xs text-slate-400">{label}</span>
  </div>
));

const ActivityItem = memo(({ log }: { log: VersionLog }) => (
  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-2 h-2 rounded-full mb-1 ${log.type === 'bugfix' ? 'bg-red-500' : log.type === 'feature' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
      <div className="w-0.5 h-full bg-slate-800"></div>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <span className="text-xs font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{log.version}</span>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          {log.date} <Clock size={10} />
        </span>
      </div>
      <h4 className="font-semibold text-sm mt-1 text-slate-200">{log.title}</h4>
      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{log.description}</p>
    </div>
  </div>
));

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<{ activeProjects: number, streak: number, syncStatus: number, lastSyncTime: string } | null>(null);
  const [recentLogs, setRecentLogs] = useState<VersionLog[]>([]);
  const [activeReminders, setActiveReminders] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [dashboardStats, allLogs, allNotes, allProjects] = await Promise.all([
          api.stats.getDashboard(),
          api.logs.getAll(),
          api.notes.getAll(),
          api.projects.getAll()
        ]);

        setStats({
          activeProjects: dashboardStats.activeProjects,
          streak: dashboardStats.streak,
          syncStatus: dashboardStats.syncStatus,
          lastSyncTime: dashboardStats.lastSyncTime
            ? new Date(dashboardStats.lastSyncTime).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })
            : 'لا يوجد'
        });
        setRecentLogs(allLogs.slice(0, 3));
        // Any note that is 'pending' or 'in_progress' is considered a task
        setActiveReminders(allNotes.filter(n => n.status === 'pending' || n.status === 'in_progress'));
        setProjects(allProjects);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('تعذر تحميل بيانات لوحة القيادة. يرجى التأكد من تشغيل السيرفر.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-400 animate-pulse">جاري جلب بياناتك من السيرفر...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
        <AlertCircle size={40} className="text-red-500" />
        <h3 className="text-red-200 font-bold">خطأ في الاتصال</h3>
        <p className="text-red-400/80 text-sm max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">مرحباً، أيها المطور 👋</h2>
        <p className="text-slate-400 text-sm">لديك {activeReminders.length} مهام تتطلب انتباهك اليوم.</p>
      </div>

      {/* Notifications / Pending Actions Area */}
      {activeReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-amber-500" />
            <h3 className="font-bold text-sm text-slate-200">تنبيهات ومتابعات</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {activeReminders.map(note => {
              const project = projects.find(p => p.id === note.projectId);
              return (
                <Link to={`/project/${note.projectId || 'general'}`} key={note.id} className="block">
                  <div className="bg-slate-900/50 border border-amber-500/20 hover:border-amber-500/40 p-3 rounded-xl transition-all group">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-slate-500 font-medium mb-1 block">
                        {project?.name || 'عام'}
                      </span>
                      {note.status === 'in_progress' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 mb-1 group-hover:text-blue-400 transition-colors">
                      {note.title}
                    </h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {note.status === 'in_progress' ? 'جاري العمل' : 'معلق'}
                      </span>
                      <ArrowUpRight size={14} className="text-slate-600 group-hover:text-slate-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* GitHub Sync Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group mt-2">
        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-600/10 rounded-full -translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <h3 className="text-slate-200 font-semibold">حالة المزامنة</h3>
            </div>
            <p className="text-3xl font-bold text-white font-mono">{stats?.syncStatus}%</p>
            <p className="text-xs text-slate-400 mt-1">آخر رفع للكود منذ {stats?.lastSyncTime}</p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-700">
            <GitMerge className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Activity}
          value={stats?.activeProjects || 0}
          label="مشاريع نشطة"
          colorClass="text-purple-500"
        />
        <StatCard
          icon={GitCommit}
          value={stats?.streak || 0}
          label="سلسلة البرمجة (يوم)"
          colorClass="text-emerald-500"
        />
      </div>

      {/* Recent Activity / Timeline Preview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">آخر التحديثات</h3>
          <Link to="/projects" className="text-xs text-blue-500 hover:text-blue-400 flex items-center">
            عرض الكل <ChevronLeft size={14} />
          </Link>
        </div>

        <div className="space-y-4">
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))
          ) : (
            <div className="text-center py-8 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
              <Clock className="mx-auto text-slate-700 mb-2" size={32} />
              <p className="text-slate-500 text-sm">لا توجد تحديثات مؤخراً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;