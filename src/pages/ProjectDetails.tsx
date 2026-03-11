import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Folder, History, ClipboardList, AlertCircle, CheckCircle2, Clock, Send, Plus, Loader2, Edit2, Save, X, Trash2, Link2, RefreshCw, Download } from 'lucide-react';
import { Note, Project, VersionLog } from '@/types';
import { api, tokenManager } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Virtuoso } from 'react-virtuoso';
import { PriorityBadge } from './QuickCapture';

const filterNotesForProject = (notes: Note[], projectId: string): Note[] => {
  if (projectId === 'general') {
    return notes.filter(n => !n.projectId || n.projectId === 'general');
  }
  return notes.filter(n => n.projectId === projectId);
};

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
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editLocalPath, setEditLocalPath] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [issueActionNoteId, setIssueActionNoteId] = useState<string | null>(null);
  const [isSyncingIssues, setIsSyncingIssues] = useState(false);
  const syncAbortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (syncAbortControllerRef.current) {
        syncAbortControllerRef.current.abort();
      }
    };
  }, []);

  const [isExportingHandoff, setIsExportingHandoff] = useState(false);

  // New Log/History state
  const [showAddVersionLog, setShowAddVersionLog] = useState(false);
  const [newVersionLog, setNewVersionLog] = useState({
    title: '',
    version: '',
    description: '',
    type: 'feature' as 'feature' | 'bugfix' | 'improvement'
  });

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteAssignee, setEditNoteAssignee] = useState('');
  const [editNoteMentionsInput, setEditNoteMentionsInput] = useState('');
  const [editNoteProjectId, setEditNoteProjectId] = useState<string | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Progress log editing state
  const [editingLogId, setEditingLogId] = useState<{ noteId: string, logId: string } | null>(null);
  const [editLogContent, setEditLogContent] = useState('');

  const progress = React.useMemo(() => {
    if (!projectNotes.length) return 0;
    const completed = projectNotes.filter(n => n.status === 'completed').length;
    return Math.round((completed / projectNotes.length) * 100);
  }, [projectNotes]);

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
            name: 'General Notes',
            description: 'Notes and ideas not linked to a specific project',
            language: 'General',
            status: 'active',
            version: 'N/A'
          } as Project);
          setProjectNotes(filterNotesForProject(allNotes, 'general'));
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
          // Only take notes that belong to this project. Extra check to ensure it's a note (has a status field).
          setProjectNotes(filterNotesForProject(allNotes, id));
          setLogs(allLogs.filter(l => l.projectId === id));
          localStorage.setItem('masar_last_project_id', foundProject.id);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Failed to fetch project details:', err);
        setError('Failed to load project data. Please make sure the server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch all projects for the project dropdown
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const projects = await api.projects.getAll();
        setAllProjects(projects);
      } catch (err) {
        console.error('Failed to fetch projects list:', err);
      }
    };
    fetchAllProjects();
  }, []);


  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-400">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
        <AlertCircle size={40} className="text-red-500" />
        <h3 className="text-red-200 font-bold">Project not found or an error occurred</h3>
        <p className="text-red-400/80 text-sm">{error || 'Could not find the requested project.'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          Back to Projects
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
      toast.error('Failed to update task status');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setEditNoteAssignee(note.assignee || '');
    setEditNoteMentionsInput((note.mentions || []).join(', '));
    setEditNoteProjectId(note.projectId || null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteTitle('');
    setEditNoteContent('');
    setEditNoteAssignee('');
    setEditNoteMentionsInput('');
    setEditNoteProjectId(null);
  };

  const handleSaveNoteEdits = async () => {
    if (!editingNoteId) return;
    setIsSaving(true);
    try {
      await api.notes.update(editingNoteId, {
        title: editNoteTitle,
        content: editNoteContent,
        assignee: editNoteAssignee.trim() || undefined,
        mentions: editNoteMentionsInput.split(',').map(item => item.trim().replace(/^@/, '')).filter(Boolean),
        projectId: editNoteProjectId || undefined
      });

      // If the note's project changed, remove it from the current view
      const currentProjectId = id === 'general' ? null : id;
      if (editNoteProjectId !== currentProjectId) {
        setProjectNotes(prev => prev.filter(n => n.id !== editingNoteId));
      } else {
        setProjectNotes(prev => prev.map(n =>
          n.id === editingNoteId
            ? {
              ...n,
              title: editNoteTitle,
              content: editNoteContent,
              assignee: editNoteAssignee.trim() || undefined,
              mentions: editNoteMentionsInput.split(',').map(item => item.trim().replace(/^@/, '')).filter(Boolean),
              projectId: editNoteProjectId || undefined
            }
            : n
        ));
      }
      handleCancelEdit();
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };


  const handleAddLog = async (noteId: string) => {
    if (!newLogContent.trim()) return;
    const note = projectNotes.find(n => n.id === noteId);
    if (!note) return;

    const newLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('ar-EG'),
      content: newLogContent,
      status: 'new' as 'new' | 'pending' | 'done'
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
      toast.error('Failed to add progress log');
    }
  };

  // Cycle through log status: new -> pending -> done -> new
  const handleLogStatusChange = async (noteId: string, logId: string) => {
    const note = projectNotes.find(n => n.id === noteId);
    if (!note || !note.progressLogs) return;

    const statusOrder: ('new' | 'pending' | 'done')[] = ['new', 'pending', 'done'];
    const updatedLogs = note.progressLogs.map(log => {
      if (log.id === logId) {
        const currentIdx = statusOrder.indexOf(log.status || 'new');
        const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];
        return { ...log, status: nextStatus };
      }
      return log;
    });

    try {
      await api.notes.update(noteId, { progressLogs: updatedLogs });
      setProjectNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, progressLogs: updatedLogs } : n
      ));
    } catch (err) {
      console.error('Failed to update log status:', err);
      toast.error('Failed to update log status');
    }
  };

  const startEditingLog = (noteId: string, logId: string, content: string) => {
    setEditingLogId({ noteId, logId });
    setEditLogContent(content);
  };

  const handleSaveLogEdit = async () => {
    if (!editingLogId) return;
    const { noteId, logId } = editingLogId;
    const note = projectNotes.find(n => n.id === noteId);
    if (!note || !note.progressLogs) return;

    const updatedLogs = note.progressLogs.map(log =>
      log.id === logId ? { ...log, content: editLogContent } : log
    );

    try {
      await api.notes.update(noteId, { progressLogs: updatedLogs });
      setProjectNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, progressLogs: updatedLogs } : n
      ));
      setEditingLogId(null);
      setEditLogContent('');
    } catch (err) {
      console.error('Failed to edit log:', err);
      toast.error('Failed to edit log');
    }
  };

  // Start edit mode
  const startEditing = () => {
    setEditName(project?.name || '');
    setEditDescription(project?.description || '');
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
        name: editName,
        description: editDescription,
        repoUrl: editRepoUrl,
        localPath: editLocalPath,
        version: editVersion,
      });

      // Update local state
      setProject({
        ...project,
        name: editName,
        description: editDescription,
        repoUrl: editRepoUrl,
        localPath: editLocalPath,
        version: editVersion,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      toast.error('Failed to save project changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditName('');
    setEditDescription('');
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
        type: newVersionLog.type,
        changes: [],
      });

      setLogs(prev => [created, ...prev]);
      setShowAddVersionLog(false);
      setNewVersionLog({ title: '', version: '', description: '', type: 'feature' });
    } catch (err) {
      console.error('Failed to create version log:', err);
      toast.error('Failed to create update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id || id === 'general') return;
    if (!window.confirm('Are you sure you want to permanently delete this project? All related notes and tasks will be removed.')) return;

    setIsSaving(true);
    try {
      await api.projects.delete(id);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast.error('Failed to delete project');
    } finally {
      setIsSaving(false);
    }
  };

  const getGitHubToken = (): string | null => {
    return tokenManager.getToken();
  };

  const parseGitHubRepo = (repoUrl?: string): { owner: string; repo: string } | null => {
    if (!repoUrl) return null;
    try {
      const normalized = repoUrl.trim().replace(/\.git$/, '');
      // Try full URL first
      const match = normalized.match(/github\.com[:/]+([^/]+)\/([^/]+)/i);
      if (match) return { owner: match[1], repo: match[2] };
      // Try short 'owner/repo' format
      const shortMatch = normalized.match(/^([^/]+)\/([^/]+)$/);
      if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };
      return null;
    } catch {
      return null;
    }
  };

  const updateNoteLocally = (noteId: string, updater: (note: Note) => Note) => {
    setProjectNotes(prev => prev.map(note => (note.id === noteId ? updater(note) : note)));
  };

  const buildIssueBody = (note: Note, currentProject: Project): string => {
    return [
      `Source: Masar`,
      `Project: ${currentProject.name}`,
      `Note Type: ${note.type}`,
      '',
      `Description:`,
      note.content,
      '',
      `Created At: ${note.date}`,
    ].join('\n');
  };

  const handleCreateIssue = async (note: Note) => {
    if (!project || id === 'general') return;
    const token = getGitHubToken();
    if (!token) {
      toast.error('Please add a GitHub token from Settings first.');
      return;
    }

    const repoInfo = parseGitHubRepo(project.repoUrl);
    if (!repoInfo) {
      toast.error('The project GitHub URL is invalid.');
      return;
    }

    setIssueActionNoteId(note.id);
    try {
      const issue = await api.github.createIssue(token, repoInfo.owner, repoInfo.repo, {
        title: note.title || `Masar ${note.type}: ${project.name}`,
        body: buildIssueBody(note, project),
        labels: [note.type],
      });

      await api.notes.update(note.id, { githubIssue: issue });
      updateNoteLocally(note.id, current => ({ ...current, githubIssue: issue }));
    } catch (err) {
      console.error('Failed to create GitHub issue:', err);
      toast.error('Could not create GitHub Issue.');
    } finally {
      setIssueActionNoteId(null);
    }
  };

  const handleToggleIssueState = async (note: Note) => {
    if (!note.githubIssue) return;
    const token = getGitHubToken();
    if (!token) {
      toast.error('Please add a GitHub token from Settings first.');
      return;
    }

    setIssueActionNoteId(note.id);
    try {
      const nextState = note.githubIssue.state === 'open' ? 'closed' : 'open';
      const issue = await api.github.updateIssueState(
        token,
        note.githubIssue.owner,
        note.githubIssue.repo,
        note.githubIssue.number,
        nextState
      );
      await api.notes.update(note.id, { githubIssue: issue });
      updateNoteLocally(note.id, current => ({ ...current, githubIssue: issue }));
    } catch (err) {
      console.error('Failed to update GitHub issue state:', err);
      toast.error('Could not update GitHub Issue state.');
    } finally {
      setIssueActionNoteId(null);
    }
  };

  const handleSyncIssue = async (note: Note) => {
    if (!note.githubIssue) return;
    const token = getGitHubToken();
    if (!token) {
      toast.error('Please add a GitHub token from Settings first.');
      return;
    }

    setIssueActionNoteId(note.id);
    try {
      const issue = await api.github.getIssue(
        token,
        note.githubIssue.owner,
        note.githubIssue.repo,
        note.githubIssue.number
      );
      await api.notes.update(note.id, { githubIssue: issue });
      updateNoteLocally(note.id, current => ({ ...current, githubIssue: issue }));
    } catch (err) {
      console.error('Failed to sync GitHub issue:', err);
      toast.error('Could not sync GitHub Issue.');
    } finally {
      setIssueActionNoteId(null);
    }
  };

  const handleSyncAllLinkedIssues = async () => {
    const token = getGitHubToken();
    if (!token) {
      toast.error('Please add a GitHub token from Settings first.');
      return;
    }

    // Cancel any ongoing syncs before starting a new one
    if (syncAbortControllerRef.current) {
      syncAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    syncAbortControllerRef.current = abortController;

    if (id !== 'general') {
      if (!project?.repoUrl) {
        toast.error('لا يوجد رابط مستودع GitHub لهذا المشروع.');
        return;
      }
      const repoInfo = parseGitHubRepo(project.repoUrl);
      if (!repoInfo) {
        toast.error('رابط مستودع GitHub غير صالح أو مفقود. (Invalid repository format)');
        return;
      }
    }

    setIsSyncingIssues(true);
    try {
      if (id !== 'general' && project?.repoUrl) {
        const repoInfo = parseGitHubRepo(project.repoUrl);
        if (repoInfo) {
          if (!id) {
            toast.error('معرف المشروع غير موجود');
            return;
          }
          await api.github.syncRepoIssues(token, repoInfo.owner, repoInfo.repo, id, abortController.signal);
        } else {
          await api.github.syncLinkedIssues(token, abortController.signal);
        }
      } else {
        await api.github.syncLinkedIssues(token, abortController.signal);
      }

      // Refresh the notes list
      const allNotes = await api.notes.getAll();
      setProjectNotes(filterNotesForProject(allNotes, id ?? 'general'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to sync linked issues:', message);
        toast.error('Could not sync linked issues.');
      } else if (!(err instanceof Error)) {
        console.error('Failed to sync linked issues:', message);
        toast.error('Could not sync linked issues.');
      }
    } finally {
      setIsSyncingIssues(false);
      if (syncAbortControllerRef.current === abortController) {
        syncAbortControllerRef.current = null;
      }
    }
  };

  const handleExportHandoff = async () => {
    if (!id) return;
    setIsExportingHandoff(true);
    try {
      const report = await api.reports.generateProjectHandoff(id);
      const blob = new Blob([report.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export handoff summary:', err);
      toast.error('Could not export handoff summary.');
    } finally {
      setIsExportingHandoff(false);
    }
  };


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
                <Trash2 size={10} /> Delete Project
              </button>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full border ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
          {project.status === 'active' ? 'Active' : 'Archived'}
        </span>
      </div>

      {/* Progress Bar with smooth transition */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
          <span>Project Progress</span>
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
          Project Details
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Notes & Tasks
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
                  <span className="text-xs text-slate-500 block mb-1">Current Version</span>
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
                  <span className="text-xs text-slate-500 block mb-1">Language</span>
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
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProject}
                          disabled={isSaving}
                          className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save Settings
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={startEditing}
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                        Edit Links
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
                        <span className="text-[10px] text-slate-500">Repository URL (GitHub)</span>
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
                            Not linked - click edit to add
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
                        <span className="text-[10px] text-slate-500">Local Path</span>
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
                            {project.localPath || 'Not set - click edit to add'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Project Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-200 focus:outline-none focus:border-blue-500 text-right"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 h-24 resize-none focus:outline-none focus:border-blue-500 text-right font-sans"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-200 font-bold mb-1">{project.name}</p>
                  {project.description && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-500 block mb-1">Description</span>
                      <p className="text-sm text-slate-300 leading-relaxed font-sans">{project.description}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Version History (Timeline) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowAddVersionLog(!showAddVersionLog)}
                  className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} /> Add Official Update
                </button>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Changelog & Activity</h3>
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
                        <label className="text-[10px] text-slate-500 mr-1">Version</label>
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
                        <label className="text-[10px] text-slate-500 mr-1">Update Title</label>
                        <input
                          type="text"
                          value={newVersionLog.title}
                          onChange={e => setNewVersionLog({ ...newVersionLog, title: e.target.value })}
                          placeholder="Example: Add dark mode"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 mr-1">Details</label>
                      <textarea
                        value={newVersionLog.description}
                        onChange={e => setNewVersionLog({ ...newVersionLog, description: e.target.value })}
                        placeholder="What changed in this update?"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 h-20 resize-none focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddVersionLog(false)}
                          className="text-xs text-slate-500 hover:text-slate-400 px-2"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateVersionLog}
                          disabled={isSaving || !newVersionLog.title}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Save Update'}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {(['feature', 'bugfix', 'improvement'] as const).map((t: 'feature' | 'bugfix' | 'improvement') => (
                          <button
                            key={t}
                            onClick={() => setNewVersionLog({ ...newVersionLog, type: t })}
                            className={`px-2 py-1 rounded text-[10px] transition-colors ${newVersionLog.type === t ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
                          >
                            {t === 'feature' ? 'Feature' : t === 'bugfix' ? 'Bugfix' : 'Improvement'}
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
                      title: `Update: ${n.title}`,
                      description: p.content,
                      version: n.status === 'completed' ? 'Done' : 'Update',
                      type: n.type === 'bug' ? 'bugfix' : 'feature',
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
                    <div className="pr-6 text-slate-500 text-sm italic">No updates recorded yet for this project...</div>
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
              <h3 className="font-bold text-lg text-slate-200">Notes & Tasks</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncAllLinkedIssues}
                  disabled={isSyncingIssues}
                  className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 disabled:opacity-50"
                >
                  {isSyncingIssues ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Sync Issues
                </button>
                <button
                  onClick={handleExportHandoff}
                  disabled={isExportingHandoff}
                  className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 disabled:opacity-50"
                >
                  {isExportingHandoff ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Handoff
                </button>
                <button
                  onClick={() => navigate('/add-note')}
                  className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} /> إضافة ملاحظة
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {projectNotes.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                  <ClipboardList className="mx-auto text-slate-600 mb-3" size={32} />
                  <p className="text-slate-400 text-sm">No notes recorded for this project.</p>
                </div>
              ) : (
                <Virtuoso
                  style={{ height: '70vh' }}
                  data={projectNotes}
                  itemContent={(_, note) => {
                    const isExpanded = expandedNoteId === note.id;
                    return (
                      <div className="pb-4">
                        <div key={note.id} className={`bg-slate-900 rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-500/50 shadow-lg shadow-blue-900/10' : 'border-slate-800 hover:border-slate-700'}`}>
                          {/* Note Header (Clickable) */}
                          <div className="p-4 cursor-pointer" onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <PriorityBadge priority={note.priority} />
                                <div className={`px-2 py-0.5 text-[10px] rounded border ${note.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  note.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}>
                                  {note.status === 'in_progress' ? 'In Progress' : note.status === 'completed' ? 'Completed' : 'Pending'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}
                                  className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
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
                                    <h5 className="text-[10px] text-slate-500 mb-2 font-bold select-none uppercase tracking-wider">Note Content</h5>
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                                      {note.content}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="text-[10px] px-2 py-1 rounded border border-slate-700 bg-slate-900 text-slate-300">
                                        Assignee: {note.assignee ? `@${note.assignee}` : 'Unassigned'}
                                      </span>
                                      <span className="text-[10px] px-2 py-1 rounded border border-slate-700 bg-slate-900 text-slate-300">
                                        Mentions: {note.mentions && note.mentions.length > 0 ? note.mentions.map(m => `@${m}`).join(', ') : 'None'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs text-slate-400">GitHub Issue</span>
                                      {note.githubIssue ? (
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${note.githubIssue.state === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                          #{note.githubIssue.number} {note.githubIssue.state}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded border bg-slate-800 text-slate-500 border-slate-700">
                                          not linked
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                      {!note.githubIssue ? (
                                        <button
                                          onClick={() => handleCreateIssue(note)}
                                          disabled={issueActionNoteId === note.id || !project?.repoUrl}
                                          className="text-[10px] px-2.5 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                                        >
                                          {issueActionNoteId === note.id ? '...' : 'Create Issue'}
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => window.open(note.githubIssue?.url, '_blank', 'noopener,noreferrer')}
                                            className="text-[10px] px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                                          >
                                            <Link2 size={12} /> Open
                                          </button>
                                          <button
                                            onClick={() => handleSyncIssue(note)}
                                            disabled={issueActionNoteId === note.id}
                                            className="text-[10px] px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 disabled:opacity-50"
                                          >
                                            <RefreshCw size={12} /> Sync
                                          </button>
                                          <button
                                            onClick={() => handleToggleIssueState(note)}
                                            disabled={issueActionNoteId === note.id}
                                            className={`text-[10px] px-2.5 py-1.5 rounded border disabled:opacity-50 ${note.githubIssue.state === 'open' ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}
                                          >
                                            {note.githubIssue.state === 'open' ? 'Close Issue' : 'Reopen Issue'}
                                          </button>
                                        </>
                                      )}
                                    </div>
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
                                          {s === 'pending' ? 'Pending' : s === 'in_progress' ? 'In Progress' : 'Completed'}
                                        </button>
                                      ))}
                                    </div>
                                    <span className="text-xs text-slate-400 order-1">Work Status:</span>
                                  </div>

                                  <div className="space-y-2">
                                    <h5 className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end">
                                      Progress Log <History size={12} />
                                    </h5>

                                    {note.progressLogs && note.progressLogs.length > 0 ? (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {note.progressLogs.map((log, idx) => (
                                          <div key={log.id || idx} className="text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-right group relative">
                                            <div className="flex justify-between items-center mb-1.5">
                                              <div className="flex items-center gap-2">
                                                {editingLogId?.logId === log.id ? (
                                                  <div className="flex gap-1">
                                                    <button onClick={handleSaveLogEdit} className="p-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30">
                                                      <Save size={10} />
                                                    </button>
                                                    <button onClick={() => setEditingLogId(null)} className="p-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700">
                                                      <X size={10} />
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={() => startEditingLog(note.id, log.id, log.content)}
                                                    className="p-1 text-slate-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Edit2 size={10} />
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => handleLogStatusChange(note.id, log.id)}
                                                  className={`px-1.5 py-0.5 text-[9px] rounded-lg cursor-pointer hover:opacity-80 transition-opacity font-bold ${log.status === 'done' ? 'bg-emerald-500 text-white' : log.status === 'pending' ? 'bg-amber-500 text-slate-900' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}
                                                >
                                                  {log.status === 'done' ? 'Done' : log.status === 'pending' ? 'Pending' : 'New'}
                                                </button>
                                              </div>
                                              <div className="text-[9px] text-slate-500 font-mono tracking-tighter opacity-70">{log.date}</div>
                                            </div>

                                            {editingLogId?.logId === log.id ? (
                                              <textarea
                                                value={editLogContent}
                                                onChange={(e) => setEditLogContent(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 text-right focus:outline-none focus:border-blue-500 resize-none h-16 font-sans"
                                                autoFocus
                                              />
                                            ) : (
                                              <div className="text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{log.content}</div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-600 italic font-sans py-2 text-center">No progress logs yet.</div>
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
                                        placeholder="Log what you completed..."
                                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-200 text-right font-sans"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Note Modal */}
      <AnimatePresence>
        {editingNoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <button onClick={handleCancelEdit} className="text-slate-500 hover:text-slate-300">
                  <X size={20} />
                </button>
                <h3 className="text-lg font-bold text-slate-100">Edit Note</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editNoteTitle}
                    onChange={(e) => setEditNoteTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 text-right focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <textarea
                    value={editNoteContent}
                    onChange={(e) => setEditNoteContent(e.target.value)}
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 text-right focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 text-right">Assignee</label>
                    <input
                      type="text"
                      value={editNoteAssignee}
                      onChange={(e) => setEditNoteAssignee(e.target.value)}
                      placeholder="@frontend-dev"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 text-right focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 text-right">Mentions</label>
                    <input
                      type="text"
                      value={editNoteMentionsInput}
                      onChange={(e) => setEditNoteMentionsInput(e.target.value)}
                      placeholder="@ali, @sara"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 text-right focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 text-right">Linked Project</label>
                  <select
                    value={editNoteProjectId || 'general'}
                    onChange={(e) => setEditNoteProjectId(e.target.value === 'general' ? null : e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 text-right focus:outline-none focus:border-blue-500"
                  >
                    <option value="general">General notes (no project)</option>
                    {allProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNoteEdits}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default ProjectDetails;
