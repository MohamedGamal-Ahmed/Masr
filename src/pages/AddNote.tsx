import React, { useState, useEffect } from 'react';
import { Save, Tag, PenTool, Hash, Info, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Note, Project } from '@/types';
import { api } from '@/services/api';
import { z } from 'zod';

const noteSchema = z.object({
  projectId: z.string().nullable(),
  type: z.enum(['idea', 'bug', 'todo']),
  content: z.string().min(3, 'محتوى الملاحظة قصير جداً (3 أحرف على الأقل)'),
  title: z.string().optional(),
});

const AddNote: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('');
  const [noteType, setNoteType] = useState<'idea' | 'bug' | 'todo'>('idea');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Fetch real projects from API
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
    fetchProjects();
  }, []);

  const handleSave = async () => {
    const rawData = {
      projectId: selectedProject || null,
      type: noteType,
      content: content.trim(),
    };

    // Validate with Zod
    const result = noteSchema.safeParse(rawData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setFormErrors({});

    try {
      // Generate title from content
      const words = content.split(' ');
      const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');

      // Save to API
      await api.notes.create({
        projectId: rawData.projectId,
        title: title,
        content: rawData.content,
        type: rawData.type,
        status: 'pending',
        reminder: true, // Default to true for task awareness
      });

      navigate('/'); // Return to dashboard
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('فشل في حفظ الملاحظة. تأكد من تشغيل السيرفر.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold mb-2">إضافة ملاحظة سريعة</h2>
      <p className="text-slate-400 text-sm -mt-4">سجل أفكارك أو الأخطاء البرمجية قبل نسيانها.</p>

      {/* Project Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Hash size={16} />
          المشروع المرتبط
        </label>
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={isLoadingProjects}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none appearance-none disabled:opacity-50"
          >
            <option value="">عام (بدون مشروع)</option>
            {allProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {isLoadingProjects && (
            <Loader2 size={16} className="absolute left-3 top-4 text-slate-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Note Type Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Tag size={16} />
          التصنيف
        </label>
        <div className="flex gap-2">
          {[
            { id: 'bug', label: 'إصلاح خطأ', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
            { id: 'idea', label: 'فكرة جديدة', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
            { id: 'todo', label: 'تحسين', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setNoteType(type.id as any)}
              className={`px-4 py-2 rounded-lg border text-sm transition-all ${noteType === type.id ? type.color : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area (Markdown-ish) */}
      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <PenTool size={16} />
          محتوى الملاحظة
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (formErrors.content) setFormErrors(prev => {
              const next = { ...prev };
              delete next.content;
              return next;
            });
          }}
          placeholder="اكتب هنا... يمكنك استخدام Markdown بسيط للكود."
          className={`w-full h-48 bg-slate-900 border ${formErrors.content ? 'border-red-500/50' : 'border-slate-800'
            } rounded-xl p-4 text-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm leading-relaxed resize-none`}
        ></textarea>
        {formErrors.content && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1 mr-1">
            <AlertCircle size={14} />
            <span>{formErrors.content}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
          <Info size={12} />
          <span>نصيحة: استخدم ``` للكتابة كـ Code Block.</span>
        </div>
      </div>

      {/* Action Button */}
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
            جاري الحفظ...
          </>
        ) : (
          <>
            <Save size={20} />
            حفظ الملاحظة
          </>
        )}
      </button>
    </div>
  );
};

export default AddNote;