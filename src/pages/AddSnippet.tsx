import React, { useState } from 'react';
import { Save, Code2, Type, AlignLeft, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Snippet } from '../types';

const PROGRAMMING_LANGUAGES = [
  { name: 'JavaScript', code: 'JS' },
  { name: 'TypeScript', code: 'TS' },
  { name: 'Python', code: 'Py' },
  { name: 'Dart', code: 'Da' },
  { name: 'Java', code: 'Ja' },
  { name: 'C#', code: 'C#' },
  { name: 'HTML', code: 'Ht' },
  { name: 'CSS', code: 'Cs' },
  { name: 'SQL', code: 'DB' },
  { name: 'Shell', code: 'Sh' },
  { name: 'JSON', code: '{}' },
  { name: 'Other', code: '??' },
];

const AddSnippet: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'JavaScript',
    code: ''
  });

  const handleSave = () => {
    if (!formData.title || !formData.code) {
      alert("يرجى إدخال العنوان والكود");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const newSnippet: Snippet = {
        id: Date.now().toString(),
        ...formData
      };

      const existing = JSON.parse(localStorage.getItem('masar_snippets') || '[]');
      localStorage.setItem('masar_snippets', JSON.stringify([newSnippet, ...existing]));

      setIsSaving(false);
      navigate('/snippets');
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold mb-2">إضافة كود جديد</h2>
      <p className="text-slate-400 text-sm -mt-4">احفظ الدوال والسكربتات التي تستخدمها بشكل متكرر.</p>

      <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Type size={16} /> عنوان الكود
            </label>
            <input 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="مثال: دالة تحويل التاريخ"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
             {/* Language Selector */}
             <div className="space-y-2 relative">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Code2 size={16} /> اللغة
                </label>
                <div 
                   onClick={() => setIsLangOpen(!isLangOpen)}
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 cursor-pointer flex justify-between items-center"
                >
                   <span>{formData.language}</span>
                   <ChevronDown size={18} className="text-slate-500" />
                </div>
                {isLangOpen && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto no-scrollbar">
                      {PROGRAMMING_LANGUAGES.map(lang => (
                         <div 
                           key={lang.name}
                           onClick={() => { setFormData({...formData, language: lang.name}); setIsLangOpen(false); }}
                           className="p-3 hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                         >
                            <span>{lang.name}</span>
                            {formData.language === lang.name && <Check size={16} className="text-blue-500" />}
                         </div>
                      ))}
                   </div>
                )}
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <AlignLeft size={16} /> وصف قصير
                </label>
                <input 
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="ماذا يفعل هذا الكود؟"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
                />
             </div>
          </div>

          <div className="space-y-2 flex-1">
             <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Code2 size={16} /> الكود المصدري
             </label>
             <textarea 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="// الصق الكود هنا..."
                className="w-full h-64 bg-[#0B1021] border border-slate-800 rounded-xl p-4 text-slate-300 focus:border-blue-500 focus:outline-none font-mono text-sm leading-relaxed dir-ltr text-left resize-none"
             />
          </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
          isSaving 
          ? 'bg-emerald-600 text-white cursor-wait' 
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
        }`}
      >
        {isSaving ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            جاري الحفظ...
          </>
        ) : (
          <>
            <Save size={20} />
            حفظ الكود
          </>
        )}
      </button>
    </div>
  );
};

export default AddSnippet;