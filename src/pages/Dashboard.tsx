import React, { useState, useEffect, useMemo, memo } from 'react';
import { Activity, GitCommit, GitMerge, Clock, ChevronLeft, AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Note, Project, VersionLog } from '@/types';
import { api } from '@/services/api';
import { computeNotePriority } from '@/utils/noteIntelligence';

const parseDateValue = (dStr: string): number => {
  const d = new Date(dStr);
  if (!isNaN(d.getTime())) return d.getTime();
  const parts = dStr.match(/\d+/g);
  if (parts && parts.length >= 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
  }
  return 0;
};

const StatCard = memo(({ icon: Icon, value, label, colorClass }: { icon: any, value: string | number, label: string, colorClass: string }) => (
  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
    <Icon className={`${colorClass} mb-2`} size={20} />
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-xs text-slate-400">{label}</span>
  </div>
));

const ActivityItem = memo(({ log }: { log: VersionLog | any }) => (
  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-2 h-2 rounded-full mb-1 ${log.type === 'bugfix' ? 'bg-red-500' : log.type === 'feature' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
      <div className="w-0.5 h-full bg-slate-800"></div>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
          {log.version || (log.timelineType === 'note' ? 'Update' : 'v1.0.0')}
        </span>
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
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [activeReminders, setActiveReminders] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
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
        const combinedActivity = [
          ...allLogs.map(l => ({ ...l, timelineType: 'version' as const })),
          ...allNotes.flatMap(n => (n.progressLogs || []).map(p => ({
            id: p.id,
            date: p.date,
            title: `تحديث: ${n.title}`,
            description: p.content,
            type: (n.type === 'bug' ? 'bugfix' : 'feature') as any,
            timelineType: 'note' as const
          })))
        ].sort((a, b) => {
          const parseDate = (dStr: string) => {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) return d.getTime();
            const parts = dStr.match(/\d+/g);
            if (parts && parts.length >= 3) {
              return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
            }
            return 0;
          };
          return parseDate(b.date) - parseDate(a.date);
        });

        setRecentLogs(combinedActivity.slice(0, 5));
        // Any note that is 'pending' or 'in_progress' is considered a task
        setActiveReminders(allNotes.filter(n => n.status === 'pending' || n.status === 'in_progress'));
        setProjects(allProjects);
        setLastProjectId(localStorage.getItem('masar_last_project_id'));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('تعذر تحميل بيانات لوحة القيادة. يرجى التأكد من تشغيل السيرفر.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const focusTasks = useMemo(
    () =>
      [...activeReminders]
        .sort((a, b) => {
          const aPriority = computeNotePriority(a).score;
          const bPriority = computeNotePriority(b).score;
          if (aPriority !== bPriority) return bPriority - aPriority;
          return parseDateValue(a.date) - parseDateValue(b.date);
        })
        .slice(0, 3),
    [activeReminders]
  );

  const stuckTasks = useMemo(() => {
    const now = Date.now();
    const fiveDays = 5 * 24 * 60 * 60 * 1000;
    return activeReminders.filter(note => {
      const age = now - parseDateValue(note.date);
      return age >= fiveDays;
    });
  }, [activeReminders]);

  const lastProject = useMemo(
    () => projects.find(project => project.id === lastProjectId) || null,
    [projects, lastProjectId]
  );

  const weeklySummary = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    const notesThisWeek = activeReminders.filter(note => parseDateValue(note.date) >= sevenDaysAgo).length;
    const highPriorityCount = activeReminders.filter(note => computeNotePriority(note).level === 'high').length;
    const inProgressCount = activeReminders.filter(note => note.status === 'in_progress').length;

    const projectCounter = new Map<string, number>();
    activeReminders.forEach(note => {
      if (!note.projectId) return;
      if (parseDateValue(note.date) < sevenDaysAgo) return;
      projectCounter.set(note.projectId, (projectCounter.get(note.projectId) || 0) + 1);
    });

    let topProjectName = 'General';
    let topProjectCount = 0;
    projectCounter.forEach((count, id) => {
      if (count <= topProjectCount) return;
      const project = projects.find(p => p.id === id);
      topProjectName = project?.name || 'General';
      topProjectCount = count;
    });

    return { notesThisWeek, highPriorityCount, inProgressCount, topProjectName, topProjectCount };
  }, [activeReminders, projects]);

  const quickUpdateTaskStatus = async (noteId: string, status: Note['status']) => {
    try {
      await api.notes.update(noteId, { status });
      setActiveReminders(prev => prev.filter(note => (status === 'completed' ? note.id !== noteId : true)).map(note => (note.id === noteId ? { ...note, status } : note)));
    } catch (err) {
      console.error('Failed to update task status from dashboard:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-400">جاري جلب بياناتك من السيرفر...</p>
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

      <div className="flex flex-wrap gap-2 -mt-3">
        <Link to="/quick-capture" className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
          Quick Capture
        </Link>
        <Link to="/add-note" className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors">
          Add Detailed Note
        </Link>
      </div>

      {lastProject && (
        <Link to={`/project/${lastProject.id}`} className="block">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500/40 transition-colors">
            <p className="text-[11px] text-slate-500 mb-1">استكمل من حيث توقفت</p>
            <h3 className="text-base font-bold text-slate-100">{lastProject.name}</h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{lastProject.description || 'بدون وصف'}</p>
          </div>
        </Link>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200">تركيز اليوم (3 مهام)</h3>
          <span className="text-[10px] text-slate-500">قلل التشتت</span>
        </div>

        {focusTasks.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد مهام معلقة اليوم.</p>
        ) : (
          <div className="space-y-2">
            {focusTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">{task.title}</p>
                  <span className={`inline-flex text-[10px] mt-1 px-1.5 py-0.5 rounded border ${computeNotePriority(task).level === 'high'
                    ? 'border-red-500/40 text-red-300 bg-red-500/10'
                    : computeNotePriority(task).level === 'medium'
                      ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                      : 'border-slate-700 text-slate-400 bg-slate-900'
                    }`}>
                    {computeNotePriority(task).level}
                  </span>
                  <p className="text-[10px] text-slate-500">{task.status === 'in_progress' ? 'جاري العمل' : 'معلقة'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => quickUpdateTaskStatus(task.id, 'in_progress')}
                    className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  >
                    ابدأ
                  </button>
                  <button
                    onClick={() => quickUpdateTaskStatus(task.id, 'completed')}
                    className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  >
                    تم
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stuckTasks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-xs text-red-300">
            لديك {stuckTasks.length} مهام عالقة لأكثر من 5 أيام. راجعها لتجنب تراكم العمل.
          </p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200">Weekly Summary</h3>
          <span className="text-[10px] text-slate-500">Last 7 days</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <p className="text-[10px] text-slate-500">New Notes</p>
            <p className="text-lg font-bold text-white">{weeklySummary.notesThisWeek}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <p className="text-[10px] text-slate-500">High Priority</p>
            <p className="text-lg font-bold text-red-300">{weeklySummary.highPriorityCount}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <p className="text-[10px] text-slate-500">In Progress</p>
            <p className="text-lg font-bold text-amber-300">{weeklySummary.inProgressCount}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <p className="text-[10px] text-slate-500">Top Project</p>
            <p className="text-sm font-bold text-blue-300 truncate">{weeklySummary.topProjectName}</p>
            {weeklySummary.topProjectCount > 0 && (
              <p className="text-[10px] text-slate-500 mt-1">{weeklySummary.topProjectCount} notes</p>
            )}
          </div>
        </div>
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
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
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
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden mt-2">
        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-600/10 rounded-full -translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
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
