import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Rocket, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Note, Project } from '@/types';
import { api } from '@/services/api';
import { NOTE_TEMPLATES } from '@/data/noteTemplates';
import { classifyNoteType, computeNotePriority } from '@/utils/noteIntelligence';

const DRAFT_KEY = 'masar_quick_capture_draft';

const QuickCapture: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<'idea' | 'bug' | 'todo' | 'feature'>('idea');
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [mentionsInput, setMentionsInput] = useState('');
  const [content, setContent] = useState('');
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
      };
      setProjectId(draft.projectId || '');
      setType(draft.type || 'idea');
      setTitle(draft.title || '');
      setAssignee(draft.assignee || '');
      setMentionsInput(draft.mentionsInput || '');
      setContent(draft.content || '');
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
      })
    );
  }, [projectId, type, title, assignee, mentionsInput, content]);

  const canSave = useMemo(() => content.trim().length >= 3 && !isSaving, [content, isSaving]);

  const applyTemplate = (templateId: string) => {
    const template = NOTE_TEMPLATES.find(item => item.id === templateId);
    if (!template) return;
    setActiveTemplateId(template.id);
    setType(template.type);
    setIsTypeManual(true);
    if (!title.trim()) setTitle(template.title);
    if (!content.trim()) {
      setContent(template.content);
      return;
    }
    setContent(`${content.trim()}\n\n${template.content}`);
  };

  const save = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const trimmedContent = content.trim();
      const firstLine = trimmedContent.split('\n').find(line => line.trim().length > 0) || 'Quick note';
      await api.notes.create({
        projectId: projectId || null,
        title: title.trim() || firstLine.slice(0, 70),
        content: trimmedContent,
        type,
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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType('idea');
              setIsTypeManual(true);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${type === 'idea' ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 text-slate-400'}`}
          >
            Idea (Alt+1)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('bug');
              setIsTypeManual(true);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${type === 'bug' ? 'border-red-500 bg-red-500/10 text-red-300' : 'border-slate-800 text-slate-400'}`}
          >
            Bug (Alt+2)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('todo');
              setIsTypeManual(true);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${type === 'todo' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 text-slate-400'}`}
          >
            Task (Alt+3)
          </button>
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






