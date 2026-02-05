import React, { useState, useRef, useEffect } from 'react';
import { Save, FolderGit2, Code2, Link as LinkIcon, HardDrive, Hash, Layers, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/types';
import { api } from '@/services/api';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(2, 'اسم المشروع يجب أن يكون حرفين على الأقل'),
  description: z.string().optional(),
  language: z.string().min(1, 'يرجى اختيار لغة البرمجة'),
  version: z.string().regex(/^v\d+\.\d+\.\d+$/, 'تنسيق الإصدار غير صحيح (مثال: v1.0.0)'),
  repoUrl: z.string().url('رابط المستودع غير صحيح').or(z.literal('')).optional(),
  localPath: z.string().optional(),
  branch: z.string().min(1, 'يرجى تحديد الفرع').default('main'),
});

// Predefined list of popular languages/frameworks with styling
const PROGRAMMING_LANGUAGES = [
  { name: 'JavaScript', code: 'JS', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  { name: 'TypeScript', code: 'TS', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { name: 'Python', code: 'Py', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { name: 'React', code: 'Re', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
  { name: 'React Native', code: 'RN', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { name: 'Flutter', code: 'Fl', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  { name: 'Node.js', code: 'No', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { name: 'Java', code: 'Ja', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { name: 'C#', code: 'C#', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { name: 'Go', code: 'Go', color: 'text-cyan-600', bg: 'bg-cyan-600/10', border: 'border-cyan-600/20' },
  { name: 'Rust', code: 'Ru', color: 'text-orange-600', bg: 'bg-orange-600/10', border: 'border-orange-600/20' },
  { name: 'PHP', code: 'Ph', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
  { name: 'Swift', code: 'Sw', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { name: 'Kotlin', code: 'Ko', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { name: 'HTML/CSS', code: 'FE', color: 'text-orange-300', bg: 'bg-orange-300/10', border: 'border-orange-300/20' },
];

const AddProject: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Language Dropdown State
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: '',
    version: 'v1.0.0',
    repoUrl: '',
    localPath: '',
    branch: 'main'
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleLanguageSelect = (langName: string) => {
    setFormData(prev => ({ ...prev, language: langName }));
    setIsLangOpen(false);
    if (formErrors.language) {
      setFormErrors(prev => ({ ...prev, language: '' }));
    }
  };

  const handleSave = async () => {
    // Validate with Zod
    const result = projectSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await api.projects.create(formData as Omit<Project, 'id' | 'lastUpdate' | 'status'>);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('فشل في حفظ المشروع. تأكد من تشغيل السيرفر.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to find selected language style
  const selectedLangStyle = PROGRAMMING_LANGUAGES.find(l => l.name === formData.language);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold mb-2">إضافة مشروع جديد</h2>
      <p className="text-slate-400 text-sm -mt-4">سجل بيانات المشروع يدوياً لتتمكن من إدارة ملاحظاته وإصداراته.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <FolderGit2 size={16} />
              اسم المشروع
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="مثال: تطبيق المتجر الإلكتروني"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Custom Language Dropdown */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Code2 size={16} />
              لغة البرمجة / التقنية
            </label>

            <div
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={`w-full bg-slate-900 border ${isLangOpen ? 'border-blue-500' : 'border-slate-800'} rounded-xl p-3 text-slate-200 cursor-pointer flex justify-between items-center transition-all hover:border-slate-700`}
            >
              {formData.language ? (
                <div className="flex items-center gap-3">
                  {selectedLangStyle ? (
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${selectedLangStyle.bg} ${selectedLangStyle.color} border ${selectedLangStyle.border}`}>
                      {selectedLangStyle.code}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                      <Code2 size={14} />
                    </div>
                  )}
                  <span className="font-medium">{formData.language}</span>
                </div>
              ) : (
                <span className="text-slate-500">اختر لغة البرمجة...</span>
              )}
              <ChevronDown size={18} className={`text-slate-500 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </div>

            {isLangOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto no-scrollbar p-1 animate-fade-in">
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <div
                    key={lang.name}
                    onClick={() => handleLanguageSelect(lang.name)}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-800 rounded-lg cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${lang.bg} ${lang.color} border ${lang.border}`}>
                        {lang.code}
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{lang.name}</span>
                    </div>
                    {formData.language === lang.name && <Check size={16} className="text-blue-500" />}
                  </div>
                ))}

                {/* Option for custom language if needed */}
                <div className="border-t border-slate-800 mt-1 pt-1">
                  <div
                    onClick={() => {
                      const custom = prompt("أدخل اسم اللغة/التقنية يدوياً:");
                      if (custom) handleLanguageSelect(custom);
                    }}
                    className="p-2 text-xs text-center text-blue-500 hover:text-blue-400 cursor-pointer"
                  >
                    لغتي غير موجودة في القائمة؟
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Layers size={16} />
              وصف مختصر
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="ما هو هدف هذا المشروع؟"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none h-24 resize-none"
            />
          </div>
        </div>

        {/* Technical Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Hash size={16} />
              رقم الإصدار الحالي
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="v1.0.0"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <LinkIcon size={16} />
              رابط المستودع (Repository URL)
            </label>
            <input
              type="text"
              name="repoUrl"
              value={formData.repoUrl}
              onChange={handleChange}
              placeholder="github.com/username/repo"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none font-mono text-xs"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <HardDrive size={16} />
              المسار المحلي (Local Path)
            </label>
            <input
              type="text"
              name="localPath"
              value={formData.localPath}
              onChange={handleChange}
              placeholder="C:/Projects/MyApp or ~/dev/myapp"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none font-mono text-xs"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-6 ${isSaving
          ? 'bg-emerald-600 text-white cursor-wait'
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
          }`}
      >
        {isSaving ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            جاري حفظ المشروع...
          </>
        ) : (
          <>
            <Save size={20} />
            حفظ المشروع
          </>
        )}
      </button>
    </div>
  );
};

export default AddProject;