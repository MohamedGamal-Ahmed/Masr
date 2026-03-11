import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Eye, EyeOff, Rocket, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Note, Project } from '@/types';
import { api } from '@/services/api';
import { NOTE_TEMPLATES } from '@/data/noteTemplates';
import { classifyNoteType, computeNotePriority } from '@/utils/noteIntelligence';

const DRAFT_KEY = 'masar_quick_capture_draft';

// ── PriorityBadge ─────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }: { priority?: string }) => {
  const config = {
    critical: {
      label: 'حرج',
      cls: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    medium: {
      label: 'متوسط',
      cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    },
    normal: {
      label: 'عادي',
      cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    },
  };
  const p = priority ?? 'normal';
  const c = config[p as keyof typeof config] ?? config.normal;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
  );
};

export { PriorityBadge };

const QuickCapture: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<'idea' | 'bug' | 'todo' | 'feature'>('idea');
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [mentionsInput, setMentionsInput] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'critical' | 'medium' | 'normal'>('normal');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isTypeManual, setIsTypeManual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      const allProjects = await api.projects.getAll();
      setProjects(allProjects);
    };
    void run();
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as {
        projectId: string;
        type: 'idea' | 'bug' | 'todo' | 'feature';
        title: string;
        assignee?: string;
        mentionsInput?: string;
        content: string;
        priority?: 'critical' | 'medium' | 'normal';
      };
      setProjectId(draft.projectId || '');
      setType(draft.type || 'idea');
      setTitle(draft.title || '');
      setAssignee(draft.assignee || '');
      setMentionsInput(draft.mentionsInput || '');
      setContent(draft.content || '');
      setPriority(draft.priority || 'normal');
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        projectId,
        type,
        title,
        assignee,
        mentionsInput,
        content,
        priority,
      })
    );
  }, [projectId, type, title, assignee, mentionsInput, content, priority]);

  const canSave = useMemo(() => content.trim().length >= 3 && !isSaving, [content, isSaving]);

  // Bug 1 fix: always overwrite ALL fields when switching templates
  const applyTemplate = (templateId: string) => {
    const template = NOTE_TEMPLATES.find(item => item.id === templateId);
    if (!template) return;
    setActiveTemplateId(template.id);
    setType(template.type);
    setIsTypeManual(true);
    setTitle(template.title);
    setContent(template.content);
  };

  const save = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const trimmedContent = content.trim();
      const firstLine = trimmedContent.split('\n').find(line => line.trim().length > 0) || 'Quick note';
      await api.notes.create({
        // Bug 2 fix: always pass '' for global notes, not null
        projectId: projectId || '',
        title: title.trim() || firstLine.slice(0, 70),
        content: trimmedContent,
        type,
        priority,
        assignee: assignee.trim() || undefined,
        mentions: mentionsInput.split(',').map(item => item.trim().replace(/^@/, '')).filter(Boolean),
        status: 'pending',
        reminder: true,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      navigate(projectId ? `/project/${projectId}` : '/');
    } catch (error) {
      console.error('Failed to save quick capture note', error);
      alert('Unable to save right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isTypeManual) return;
    if (!title.trim() && !content.trim()) return;
    const predicted = classifyNoteType({ title, content });
    setType(predicted);
  }, [title, content, isTypeManual]);

  const priorityPreview = useMemo(() => {
    const draft: Note = {
      id: 'draft',
      projectId,
      title: title || 'Draft',
      content,
      type,
      date: new Date().toISOString(),
      status: 'pending',
      progressLogs: [],
      reminder: true,
    };
    return computeNotePriority(draft);
  }, [projectId, title, content, type]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void save();
      }
      if (event.altKey && event.key === '1') setType('idea');
      if (event.altKey && event.key === '2') setType('bug');
      if (event.altKey && event.key === '3') setType('todo');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canSave, projectId, title, assignee, mentionsInput, content, type]);

  const priorityOptions: { value: 'critical' | 'medium' | 'normal'; label: string; icon: string; selected: string; base: string }[] = [
    {
      value: 'critical',
      label: 'Critical',
      icon: '🔴',
      selected: 'border-red-500 bg-red-500/20 text-red-300',
      base: 'border-slate-800 text-slate-400',
    },
    {
      value: 'medium',
      label: 'Medium',
      icon: '🟡',
      selected: 'border-yellow-500 bg-yellow-500/20 text-yellow-300',
      base: 'border-slate-800 text-slate-400',
    },
    {
      value: 'normal',
      label: 'Normal',
      icon: '⚪',
      selected: 'border-slate-500 bg-slate-500/20 text-slate-300',
      base: 'border-slate-800 text-slate-400',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in pb-24">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Quick Capture</h2>
            <p className="text-sm text-slate-400 mt-1">Capture the thought in seconds, continue your day.</p>
          </div>
          <div className="text-[10px] text-slate-500 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            Ctrl/Cmd + Enter
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {NOTE_TEMPLATES.map(template => (
          <button
            key={template.id}
            type="button"
            onClick={() => applyTemplate(template.id)}
            className={`text-right rounded-xl border p-2.5 transition-colors ${activeTemplateId === template.id
              ? 'border-blue-500 bg-blue-500/10'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
          >
            <p className="text-xs font-bold text-slate-200">{template.name}</p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{template.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">General (No project)</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان سريع (اختياري)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="@assignee"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
          />
          <input
            value={mentionsInput}
            onChange={(e) => setMentionsInput(e.target.value)}
            placeholder="@ali, @sara"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setType('idea'); setIsTypeManual(true); }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${type === 'idea' ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 text-slate-400'}`}
          >
            Idea (Alt+1)
          </button>
          <button
            type="button"
            onClick={() => { setType('bug'); setIsTypeManual(true); }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${type === 'bug' ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-slate-800 text-slate-400'}`}
          >
            Bug (Alt+2)
          </button>
          <button
            type="button"
            onClick={() => { setType('todo'); setIsTypeManual(true); }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${type === 'todo' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 text-slate-400'}`}
          >
            Task (Alt+3)
          </button>
        </div>

        {/* Priority selector (Part 2C) */}
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-500 shrink-0">Priority:</span>
          <div className="flex gap-2">
            {priorityOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${priority === opt.value ? opt.selected : opt.base}`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="اكتب الفكرة بسرعة... ما يلزم يكون كامل."
          className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 focus:border-blue-500 focus:outline-none font-mono text-sm resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Clock3 size={12} />
            <span>
              {isTypeManual ? 'Type locked manually' : `Auto type: ${type}`} | Priority: {priorityPreview.level}
            </span>
          </div>

          <button
            onClick={() => void save()}
            disabled={!canSave}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${canSave ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSaving ? <Rocket size={16} className="animate-pulse" /> : <Save size={16} />}
            Save Capture
          </button>
        </div>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
        <CheckCircle2 size={14} />
        <span>Tip: open this screen quickly with Ctrl/Cmd + Shift + N from anywhere.</span>
      </div>
    </div>
  );
};

export default QuickCapture;
