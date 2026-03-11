import React, { useEffect, useState } from 'react';
import { AlertCircle, Hash, Info, Loader2, PenTool, Save, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/types';
import { api } from '@/services/api';
import { z } from 'zod';
import { NOTE_TEMPLATES } from '@/data/noteTemplates';
import { classifyNoteType } from '@/utils/noteIntelligence';

const noteSchema = z.object({
  projectId: z.string().nullable(),
  type: z.enum(['idea', 'bug', 'todo', 'feature']),
  content: z.string().min(3, 'Please write at least 3 characters.'),
  title: z.string().optional(),
});

const AddNote: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('');
  const [noteType, setNoteType] = useState<'idea' | 'bug' | 'todo' | 'feature'>('idea');
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [mentionsInput, setMentionsInput] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'critical' | 'medium' | 'normal'>('normal');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isTypeManual, setIsTypeManual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const projects = await api.projects.getAll();
        setAllProjects(projects);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    void fetchProjects();
  }, []);

  // Bug 1 fix: always overwrite ALL fields when switching templates
  const applyTemplate = (templateId: string) => {
    const template = NOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setActiveTemplateId(template.id);
    setNoteType(template.type);
    setIsTypeManual(true);
    setTitle(template.title);
    setContent(template.content);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isSaving) void handleSave();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSaving, selectedProject, noteType, content, title, assignee, mentionsInput]);

  useEffect(() => {
    if (isTypeManual) return;
    if (!title.trim() && !content.trim()) return;
    const predicted = classifyNoteType({ title, content });
    setNoteType(predicted);
  }, [title, content, isTypeManual]);

  const handleSave = async () => {
    const rawData = {
      projectId: selectedProject || null,
      type: noteType,
      content: content.trim(),
      title: title.trim() || undefined,
      assignee: assignee.trim() || undefined,
      mentions: mentionsInput
        .split(',')
        .map((item) => item.trim().replace(/^@/, ''))
        .filter(Boolean),
    };

    const result = noteSchema.safeParse(rawData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setFormErrors({});

    try {
      const words = content.split(' ');
      const autoTitle = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
      const finalTitle = rawData.title || autoTitle;

      await api.notes.create({
        projectId: rawData.projectId || '',   // Bug 2 fix: '' not null
        title: finalTitle,
        content: rawData.content,
        type: rawData.type,
        priority,
        assignee: rawData.assignee,
        mentions: rawData.mentions,
        status: 'pending',
        reminder: true,
      });

      navigate('/');
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('Failed to save the note. Make sure the server is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const priorityOptions: { value: 'critical' | 'medium' | 'normal'; label: string; icon: string; selected: string }[] = [
    { value: 'critical', label: 'Critical', icon: '🔴', selected: 'border-red-500 bg-red-500/20 text-red-300' },
    { value: 'medium', label: 'Medium', icon: '🟡', selected: 'border-yellow-500 bg-yellow-500/20 text-yellow-300' },
    { value: 'normal', label: 'Normal', icon: '⚪', selected: 'border-slate-500 bg-slate-500/20 text-slate-300' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold mb-2">Add Quick Note</h2>
      <p className="text-slate-400 text-sm -mt-4">Capture your thought, bug, or task before it slips away.</p>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Templates</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {NOTE_TEMPLATES.map((template) => (
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
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Example: Bug in auth flow"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Assignee (optional)</label>
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="@frontend-dev"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Mentions (comma separated)</label>
          <input
            value={mentionsInput}
            onChange={(e) => setMentionsInput(e.target.value)}
            placeholder="@ali, @sara"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Hash size={16} />
          Related Project
        </label>
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={isLoadingProjects}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none appearance-none disabled:opacity-50"
          >
            <option value="">General (No project)</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {isLoadingProjects && (
            <Loader2 size={16} className="absolute left-3 top-4 text-slate-500 animate-spin" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Tag size={16} />
          Type
        </label>
        <div className="flex gap-2">
          {[
            { id: 'bug', label: 'Bug', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
            { id: 'idea', label: 'Idea', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
            { id: 'todo', label: 'Task', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
          ].map((typeItem) => (
            <button
              key={typeItem.id}
              onClick={() => {
                setNoteType(typeItem.id as 'idea' | 'bug' | 'todo');
                setIsTypeManual(true);
              }}
              className={`px-4 py-2 rounded-lg border text-sm transition-all ${noteType === typeItem.id ? typeItem.color : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
            >
              {typeItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority selector (Part 2C) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Priority</label>
        <div className="flex gap-2">
          {priorityOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={`px-4 py-2 rounded-lg border text-sm transition-all ${priority === opt.value
                ? opt.selected
                : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <PenTool size={16} />
          Note Content
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (formErrors.content) {
              setFormErrors((prev) => {
                const next = { ...prev };
                delete next.content;
                return next;
              });
            }
          }}
          placeholder="Write quickly... Markdown is supported."
          className={`w-full h-48 bg-slate-900 border ${formErrors.content ? 'border-red-500/50' : 'border-slate-800'
            } rounded-xl p-4 text-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm leading-relaxed resize-none`}
        />
        {formErrors.content && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1 mr-1">
            <AlertCircle size={14} />
            <span>{formErrors.content}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
          <Info size={12} />
          <span>{isTypeManual ? 'Type locked manually' : `Auto type: ${noteType}`} | Ctrl/Cmd + Enter</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isSaving
          ? 'bg-emerald-600 text-white cursor-wait'
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
          }`}
      >
        {isSaving ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={20} />
            Save Note
          </>
        )}
      </button>
    </div>
  );
};

export default AddNote;
