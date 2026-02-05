import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FolderGit2, PlusSquare, BarChart2, Settings, User, Bell, Code, Info, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { VersionLog } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

interface Notification {
  text: string;
  time: string;
}

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col md:flex-row items-center md:justify-start md:px-4 md:gap-3 w-full h-full md:h-12 transition-all duration-200 rounded-lg ${isActive
        ? 'text-blue-500 md:bg-blue-500/10'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`
    }
  >
    <Icon size={22} strokeWidth={1.5} />
    <span className="text-[10px] md:text-sm font-medium">{label}</span>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileName, setProfileName] = useState('المطور محمد');
  const [showWelcome, setShowWelcome] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    // Attempt to load updated name from storage
    const savedProfile = localStorage.getItem('masar_profile');
    if (savedProfile) {
      try {
        const { name } = JSON.parse(savedProfile);
        if (name) setProfileName(name);
      } catch (e) {
        // ignore error
      }
    }
  }, [showProfileMenu]);

  // Welcome Letter Logic
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('masar_welcome_seen');
    if (!hasSeenWelcome) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch notifications from API (recent activities)
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const [logs, notes] = await Promise.all([
          api.logs.getAll(),
          api.notes.getAll()
        ]);

        // Combine and format activities
        const allActivities = [
          ...logs.map(log => ({
            text: `تحديث: ${log.title}`,
            date: log.date
          })),
          ...notes.flatMap(note => (note.progressLogs || []).slice(-2).map(p => ({
            text: `تقدم: ${note.title} - ${p.content.substring(0, 30)}...`,
            date: p.date
          })))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const notifs: Notification[] = allActivities.slice(0, 8).map(act => ({
          text: act.text,
          time: formatRelativeTime(act.date),
        }));

        setNotifications(notifs.length > 0 ? notifs : [
          { text: 'لا توجد نشاطات حديثة', time: 'الآن' }
        ]);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setNotifications([{ text: 'فشل في جلب التحديثات', time: '' }]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    fetchNotifications();
  }, []);

  // Helper to format relative time
  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    return `منذ ${diffDays} يوم`;
  };

  const handleCloseWelcome = () => {
    localStorage.setItem('masar_welcome_seen', 'true');
    setShowWelcome(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden" onClick={() => { setShowNotifications(false); setShowProfileMenu(false); }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-l border-slate-800 z-50">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg">
            <img src="/logo.png" alt="Masar Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">مسار | Masar</h1>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/" icon={Home} label="الرئيسية" />
          <NavItem to="/projects" icon={FolderGit2} label="المشاريع" />
          <NavItem to="/snippets" icon={Code} label="مخزن الأكواد" />
          <NavItem to="/stats" icon={BarChart2} label="الإحصائيات" />
          <NavItem to="/about" icon={Info} label="عن المطور" />

          <div className="pt-4 mt-4 border-t border-slate-800">
            <span className="text-xs text-slate-500 px-4 mb-2 block font-medium">إجراءات سريعة</span>
            <NavItem to="/add-note" icon={PlusSquare} label="ملاحظة سريعة" />
            <NavItem to="/add-project" icon={FolderGit2} label="إضافة مشروع" />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <NavItem to="/settings" icon={Settings} label="الإعدادات" />
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full relative">

        {/* Mobile Header / Desktop Topbar */}
        <header className="flex-none p-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex justify-between items-center z-10 md:bg-slate-950">
          <div className="flex items-center space-x-3 space-x-reverse md:hidden">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg">
              <img src="/logo.png" alt="Masar Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">مسار</h1>
          </div>

          {/* Notifications & Profile (Left side in RTL) */}
          <div className="flex items-center gap-4 mr-auto md:mr-0 md:ml-auto relative">

            {/* Notifications Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
              >
                <Bell size={20} className="text-slate-400" />
                <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                  <div className="p-3 border-b border-slate-800 bg-slate-950/50">
                    <h4 className="text-sm font-bold text-slate-200">الإشعارات</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div key={idx} className="p-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <p className="text-xs text-slate-300 leading-relaxed">{notif.text}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{notif.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 text-center border-t border-slate-800">
                    <button className="text-[10px] text-blue-500 hover:text-blue-400">تحديد الكل كمقروء</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 hover:border-blue-500 transition-colors overflow-hidden"
              >
                <User size={16} className="text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      {profileName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-sm font-bold text-white block truncate">{profileName}</span>
                      <span className="text-[10px] text-slate-500 block">Pro Member</span>
                    </div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full text-right p-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <User size={14} /> الملف الشخصي
                    </button>
                    <button
                      onClick={() => navigate('/stats')}
                      className="w-full text-right p-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <BarChart2 size={14} /> الإحصائيات
                    </button>
                    <button onClick={() => navigate('/settings')} className="w-full text-right p-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2">
                      <Settings size={14} /> الإعدادات
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-8 relative scroll-smooth no-scrollbar">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-around items-center px-2 z-50 md:hidden pb-safe">
          <NavItem to="/" icon={Home} label="الرئيسية" />
          <NavItem to="/projects" icon={FolderGit2} label="المشاريع" />
          <div className="relative -top-5">
            <NavLink to="/add-note" className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-600/30 text-white border-4 border-slate-950 hover:bg-blue-500 transition-transform active:scale-95">
              <PlusSquare size={26} />
            </NavLink>
          </div>
          <NavItem to="/snippets" icon={Code} label="الأكواد" />
          <NavItem to="/about" icon={Info} label="المطور" />
        </nav>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" style={{ direction: 'ltr' }}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative transform transition-all scale-100">
            {/* Header Gradient */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="absolute -bottom-8 left-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border-4 border-slate-900 flex items-center justify-center text-3xl shadow-lg">
                  👋
                </div>
              </div>
            </div>

            <div className="p-8 pt-12">
              <h2 className="text-2xl font-bold text-white mb-4">Welcome, Friend!</h2>

              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  I'm <span className="text-blue-400 font-bold">Mohamed Gamal</span>, a fellow developer.
                </p>
                <p>
                  I built <strong className="text-white">Masar</strong> to solve the chaos of our side projects. No servers, no tracking—just your code and your ideas.
                </p>
                <p>
                  I hope it helps you as much as it helped me.
                </p>
              </div>

              <button
                onClick={handleCloseWelcome}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Let's Start Coding 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;