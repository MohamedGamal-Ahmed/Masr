import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Folder, History, ClipboardList, AlertCircle, CheckCircle2, Clock, Send, Plus, Loader2, Edit2, Save, X, Trash2 } from 'lucide-react';
import { Note, Project, VersionLog } from '@/types';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [newLogContent, setNewLogContent] = useState('');
  const [projectNotes, setProjectNotes] = useState<Note[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<VersionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editLocalPath, setEditLocalPath] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New Log/History state
  const [showAddVersionLog, setShowAddVersionLog] = useState(false);
  const [newVersionLog, setNewVersionLog] = useState({
    title: '',
    version: '',
    description: '',
    type: 'feature' as const
  });

  // Load project and notes
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);

        if (id === 'general') {
          const allNotes = await api.notes.getAll();
          setProject({
            id: 'general',
            name: 'ملاحظات عامة',
            description: 'ملاحظات وأفكار غير مرتبطة بمشروع معين',
            language: 'General',
            status: 'active',
            version: 'N/A'
          } as Project);
          setProjectNotes(allNotes.filter(n => !n.projectId || n.projectId === 'general'));
          setLogs([]);
          setIsLoading(false);
          return;
        }

        const [foundProject, allNotes, allLogs] = await Promise.all([
          api.projects.getById(id),
          api.notes.getAll(),
          api.logs.getAll()
        ]);

        if (foundProject) {
          setProject(foundProject);
          setProjectNotes(allNotes.filter(n => n.projectId === id));
          setLogs(allLogs.filter(l => l.projectId === id));
        } else {
          setError('المشروع غير موجود');
        }
      } catch (err) {
        console.error('Failed to fetch project details:', err);
        setError('تعذر تحميل بيانات المشروع. يرجى التأكد من تشغيل السيرفر.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-400">جاري تحميل تفاصيل المشروع...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
        <AlertCircle size={40} className="text-red-500" />
        <h3 className="text-red-200 font-bold">المشروع غير موجود أو هناك خطأ</h3>
        <p className="text-red-400/80 text-sm">{error || 'لم نتمكن من العثور على المشروع المطلوب.'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          العودة للمشاريع
        </button>
      </div>
    );
  }

  const handleStatusChange = async (noteId: string, newStatus: Note['status']) => {
    try {
      await api.notes.update(noteId, { status: newStatus });
      setProjectNotes(prev => prev.map(n => n.id === noteId ? { ...n, status: newStatus } : n));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('فشل في تحديث حالة المهمة');
    }
  };

  const handleAddLog = async (noteId: string) => {
    if (!newLogContent.trim()) return;
    const note = projectNotes.find(n => n.id === noteId);
    if (!note) return;

    const newLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('ar-EG'),
      content: newLogContent
    };

    try {
      const updatedLogs = [newLog, ...(note.progressLogs || [])];
      await api.notes.update(noteId, { progressLogs: updatedLogs });

      setProjectNotes(prev => prev.map(n => {
        if (n.id === noteId) {
          return { ...n, progressLogs: updatedLogs };
        }
        return n;
      }));
      setNewLogContent('');
    } catch (err) {
      console.error('Failed to add progress log:', err);
      alert('فشل في إضافة سجل التقدم');
    }
  };

  // Start edit mode
  const startEditing = () => {
    setEditRepoUrl(project?.repoUrl || '');
    setEditLocalPath(project?.localPath || '');
    setEditVersion(project?.version || 'v1.0.0');
    setIsEditing(true);
  };

  // Save project changes
  const handleSaveProject = async () => {
    if (!project || !id) return;

    setIsSaving(true);
    try {
      await api.projects.update(id, {
        repoUrl: editRepoUrl,
        localPath: editLocalPath,
        version: editVersion,
      });

      // Update local state
      setProject({
        ...project,
        repoUrl: editRepoUrl,
        localPath: editLocalPath,
        version: editVersion,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('فشل في حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditRepoUrl('');
    setEditLocalPath('');
    setEditVersion('');
  };

  const handleCreateVersionLog = async () => {
    if (!id || !newVersionLog.title || !newVersionLog.description) return;

    setIsSaving(true);
    try {
      const created = await api.logs.create({
        projectId: id,
        title: newVersionLog.title,
        version: newVersionLog.version || project?.version || 'v1.0.0',
        description: newVersionLog.description,
        type: newVersionLog.type as any,
      } as any);

      setLogs(prev => [created, ...prev]);
      setShowAddVersionLog(false);
      setNewVersionLog({ title: '', version: '', description: '', type: 'feature' });
    } catch (err) {
      console.error('Failed to create version log:', err);
      alert('فشل في إضافة التحديث');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id || id === 'general') return;
    if (!window.confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟ سيتم حذف جميع الملاحظات والمهام المرتبطة به.')) return;

    setIsSaving(true);
    try {
      await api.projects.delete(id);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('فشل في حذف المشروع');
    } finally {
      setIsSaving(false);
    }
  };

  const progress = projectNotes.length > 0
    ? Math.round((projectNotes.filter(n => n.status === 'completed').length / projectNotes.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800">
            <ArrowRight size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold truncate max-w-[150px] md:max-w-md">{project.name}</h2>
            {id !== 'general' && (
              <button
                onClick={handleDeleteProject}
                className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-0.5 mt-0.5 transition-colors"
                disabled={isSaving}
              >
                <Trash2 size={10} /> حذف المشروع
              </button>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full border ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
          {project.status === 'active' ? 'نشط' : 'مؤرشف'}
        </span>
      </div>

      {/* Progress Bar with smooth transition */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
          <span>تقدم المشروع</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
          ></motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'details' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          تفاصيل المشروع
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          الملاحظات والمهام
          {projectNotes.length > 0 && <span className="bg-blue-600 text-[10px] px-1.5 rounded-full text-white">{projectNotes.length}</span>}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'details' ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 text-right"
            dir="rtl"
          >
            {/* Technical Details Card */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block mb-1">الإصدار الحالي</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      placeholder="v1.0.0"
                      className="text-xl font-mono font-bold text-blue-500 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 w-28 focus:outline-none focus:border-blue-500"
                      dir="ltr"
                    />
                  ) : (
                    <span className="text-2xl font-mono font-bold text-blue-500">{project.version}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">اللغة</span>
                  <span className="text-sm font-bold text-slate-200">{project.language}</span>
                </div>
              </div>

              {/* Paths */}
              <div className="space-y-3 pt-2">
                {/* Edit/Save buttons */}
                {id !== 'general' && (
                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <X size={14} />
                          إلغاء
                        </button>
                        <button
                          onClick={handleSaveProject}
                          disabled={isSaving}
                          className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          حفظ
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={startEditing}
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                        تعديل الروابط
                      </button>
                    )}
                  </div>
                )}

                {/* Repo URL */}
                {id !== 'general' && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Github size={18} className="text-slate-500 min-w-[18px]" />
                      <div className="flex flex-col flex-1 overflow-hidden text-right">
                        <span className="text-[10px] text-slate-500">رابط المستودع (GitHub)</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editRepoUrl}
                            onChange={(e) => setEditRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repo"
                            className="mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                            dir="ltr"
                          />
                        ) : project.repoUrl ? (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono truncate dir-ltr text-left text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.repoUrl}
                          </a>
                        ) : (
                          <span className="text-xs font-mono text-slate-500">
                            غير مرتبط - اضغط تعديل لإضافة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Local Path */}
                {id !== 'general' && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Folder size={18} className="text-slate-500 min-w-[18px]" />
                      <div className="flex flex-col flex-1 overflow-hidden text-right">
                        <span className="text-[10px] text-slate-500">المسار المحلي</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editLocalPath}
                            onChange={(e) => setEditLocalPath(e.target.value)}
                            placeholder="D:\Projects\MyProject"
                            className="mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-500 focus:outline-none focus:border-blue-500"
                            dir="ltr"
                          />
                        ) : (
                          <span className={`text-xs font-mono truncate dir-ltr text-left ${project.localPath ? 'text-emerald-500' : 'text-slate-500'}`}>
                            {project.localPath || 'غير محدد - اضغط تعديل لإضافة'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {project.description && (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-500 block mb-1">الوصف</span>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">{project.description}</p>
                </div>
              )}
            </div>

            {/* Version History (Timeline) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowAddVersionLog(!showAddVersionLog)}
                  className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} /> إضافة تحديث رسمي
                </button>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">سجل التغييرات والنشاط</h3>
                  <History size={18} className="text-slate-400" />
                </div>
              </div>

              {/* Add Version Log Form */}
              <AnimatePresence>
                {showAddVersionLog && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-900 border border-blue-500/30 rounded-xl p-4 mb-6 space-y-3 overflow-hidden shadow-lg shadow-blue-900/10"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 mr-1">الإصدار</label>
                        <input
                          type="text"
                          value={newVersionLog.version}
                          onChange={e => setNewVersionLog({ ...newVersionLog, version: e.target.value })}
                          placeholder={project?.version || "v1.0.0"}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-blue-400 focus:outline-none"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 mr-1">عنوان التحديث</label>
                        <input
                          type="text"
                          value={newVersionLog.title}
                          onChange={e => setNewVersionLog({ ...newVersionLog, title: e.target.value })}
                          placeholder="مثال: إضافة الوضع الليلي"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 mr-1">التفاصيل</label>
                      <textarea
                        value={newVersionLog.description}
                        onChange={e => setNewVersionLog({ ...newVersionLog, description: e.target.value })}
                        placeholder="ماذا تم في هذا التحديث؟"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 h-20 resize-none focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddVersionLog(false)}
                          className="text-xs text-slate-500 hover:text-slate-400 px-2"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handleCreateVersionLog}
                          disabled={isSaving || !newVersionLog.title}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'حفظ التحديث'}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {(['feature', 'bugfix', 'improvement'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setNewVersionLog({ ...newVersionLog, type: t })}
                            className={`px-2 py-1 rounded text-[10px] transition-colors ${newVersionLog.type === t ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
                          >
                            {t === 'feature' ? 'ميزة' : t === 'bugfix' ? 'إصلاح' : 'تحسين'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative border-r border-slate-800 mr-3 space-y-8 pb-4">
                {(() => {
                  const combinedItems = [
                    ...logs.map(l => ({ ...l, timelineType: 'version' as const })),
                    ...projectNotes.flatMap(n => (n.progressLogs || []).map(p => ({
                      id: p.id,
                      date: p.date,
                      title: `تحديث: ${n.title}`,
                      description: p.content,
                      version: n.status === 'completed' ? 'Done' : 'Update',
                      type: (n.type === 'bug' ? 'bugfix' : 'feature') as any,
                      timelineType: 'note' as const
                    })))
                  ].sort((a, b) => {
                    // Simple hack for Arabic dates: check year/month/day if possible, 
                    // otherwise fall back to lexicographical for same-day items
                    const getTimestamp = (dStr: string) => {
                      try {
                        // Attempt to extract numeric parts for a rough comparison
                        const parts = dStr.match(/\d+/g);
                        if (parts && parts.length >= 3) {
                          // ar-EG usually: day/month/year or similar
                          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
                        }
                      } catch (e) { }
                      return 0;
                    };
                    return getTimestamp(b.date) - getTimestamp(a.date);
                  });

                  return combinedItems.length > 0 ? combinedItems.map((item, idx) => (
                    <div key={item.id || idx} className="relative pr-6 text-right">
                      {/* Timeline Dot */}
                      <div className={`absolute -right-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${item.timelineType === 'version'
                        ? (item.type === 'bugfix' ? 'bg-red-500' : item.type === 'feature' ? 'bg-blue-500' : 'bg-emerald-500')
                        : 'bg-slate-600'
                        }`}></div>

                      {/* Content */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-right">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${item.timelineType === 'version' ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                            {item.version}
                          </span>
                          <span className={`text-sm font-bold ${item.timelineType === 'version' ? 'text-slate-200' : 'text-slate-400'}`}>
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mb-1">{item.date}</span>
                        <p className={`text-sm leading-relaxed p-3 rounded-lg border font-sans ${item.timelineType === 'version'
                          ? 'text-slate-300 bg-slate-900 border-slate-800'
                          : 'text-slate-400 bg-slate-950/50 border-slate-900'
                          }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="pr-6 text-slate-500 text-sm italic">لا توجد تحديثات مسجلة بعد لهذا المشروع...</div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="notes"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4 text-right"
            dir="rtl"
          >
            {/* Notes List with Management Features */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-slate-200">المهام والملاحظات</h3>
              <button
                onClick={() => navigate('/add-note')}
                className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} /> إضافة ملاحظة
              </button>
            </div>

            <div className="space-y-4">
              {projectNotes.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                  <ClipboardList className="mx-auto text-slate-600 mb-3" size={32} />
                  <p className="text-slate-400 text-sm">لا توجد ملاحظات مسجلة لهذا المشروع.</p>
                </div>
              ) : (
                projectNotes.map(note => {
                  const isExpanded = expandedNoteId === note.id;
                  return (
                    <div key={note.id} className={`bg-slate-900 rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-500/50 shadow-lg shadow-blue-900/10' : 'border-slate-800 hover:border-slate-700'}`}>
                      {/* Note Header (Clickable) */}
                      <div className="p-4 cursor-pointer" onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}>
                        <div className="flex justify-between items-start mb-2">
                          <div className={`px-2 py-0.5 text-[10px] rounded border ${note.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            note.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                            {note.status === 'in_progress' ? 'جاري العمل' : note.status === 'completed' ? 'مكتمل' : 'معلق'}
                          </div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-200 text-sm">{note.title}</h4>
                            {note.type === 'bug' && <AlertCircle size={16} className="text-red-500" />}
                            {note.type === 'idea' && <Clock size={16} className="text-blue-500" />}
                            {note.type === 'todo' && <CheckCircle2 size={16} className="text-emerald-500" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details: Workflow & Logs */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-800 bg-slate-950/30 overflow-hidden"
                          >
                            <div className="p-4 space-y-4">
                              {/* Full Content with formatting support */}
                              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 mb-2">
                                <h5 className="text-[10px] text-slate-500 mb-2 font-bold select-none uppercase tracking-wider">محتوى الملاحظة</h5>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                                  {note.content}
                                </p>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                                <div className="flex gap-1 order-2">
                                  {(['pending', 'in_progress', 'completed'] as const).map(s => (
                                    <button
                                      key={s}
                                      onClick={(e) => { e.stopPropagation(); handleStatusChange(note.id, s); }}
                                      className={`px-3 py-1.5 text-[10px] rounded transition-colors ${note.status === s
                                        ? (s === 'in_progress' ? 'bg-amber-500 text-slate-900 font-bold' : s === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white')
                                        : 'bg-slate-950 text-slate-500 hover:bg-slate-800'
                                        }`}
                                    >
                                      {s === 'pending' ? 'معلق' : s === 'in_progress' ? 'جاري العمل' : 'مكتمل'}
                                    </button>
                                  ))}
                                </div>
                                <span className="text-xs text-slate-400 order-1">:حالة العمل</span>
                              </div>

                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end">
                                  سجل التقدم <History size={12} />
                                </h5>

                                {note.progressLogs && note.progressLogs.length > 0 ? (
                                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {note.progressLogs.map((log, idx) => (
                                      <div key={log.id || idx} className="text-xs bg-slate-900 border border-slate-800 p-2 rounded-lg text-right">
                                        <div className="text-[10px] text-slate-500 mb-1 font-mono">{log.date}</div>
                                        <div className="text-slate-300 leading-relaxed font-sans">{log.content}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-600 italic font-sans">لا يوجد سجل تقدم بعد.</div>
                                )}

                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleAddLog(note.id)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"
                                  >
                                    <Send size={14} className="rotate-180" />
                                  </button>
                                  <input
                                    type="text"
                                    value={newLogContent}
                                    onChange={(e) => setNewLogContent(e.target.value)}
                                    placeholder="سجل ماذا أنجزت..."
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-200 text-right font-sans"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetails;