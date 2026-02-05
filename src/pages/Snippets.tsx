import React, { useState, useEffect } from 'react';
import { Search, Plus, Code, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Snippet } from '../types';

const Snippets: React.FC = () => {
  const navigate = useNavigate();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const savedSnippets = JSON.parse(localStorage.getItem('masar_snippets') || '[]');
    setSnippets(savedSnippets);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الكود؟')) {
      const updated = snippets.filter(s => s.id !== id);
      setSnippets(updated);
      localStorage.setItem('masar_snippets', JSON.stringify(updated));
    }
  };

  const handleCopy = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2">
              <Code className="text-blue-500" />
              مخزن الأكواد
           </h2>
           <p className="text-slate-400 text-sm mt-1">احتفظ بأكوادك المفيدة في مكان واحد.</p>
        </div>
        <button 
          onClick={() => navigate('/add-snippet')}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-transform active:scale-95"
        >
          <Plus size={18} />
          إضافة كود
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="ابحث عن كود، لغة، أو وصف..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder-slate-500 transition-all"
        />
        <Search className="absolute right-3 top-3.5 text-slate-500" size={18} />
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredSnippets.length === 0 ? (
           <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
             <Code className="mx-auto text-slate-600 mb-4" size={48} />
             <p className="text-slate-400 mb-4">لا توجد أكواد محفوظة {searchTerm && 'تطابق بحثك'}</p>
             {!searchTerm && (
                <button onClick={() => navigate('/add-snippet')} className="text-blue-500 font-bold hover:underline">
                  ابدأ بإضافة أول Snippet
                </button>
             )}
           </div>
        ) : (
          filteredSnippets.map((snippet) => (
            <div 
               key={snippet.id} 
               className={`bg-slate-900 rounded-xl border transition-all overflow-hidden ${expandedId === snippet.id ? 'border-blue-500/50 shadow-lg' : 'border-slate-800 hover:border-slate-700'}`}
            >
               <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedId(expandedId === snippet.id ? null : snippet.id)}
               >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-bold text-blue-400">
                        {snippet.language.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-200">{snippet.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{snippet.description}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700/50 hidden md:inline-block">
                        {snippet.language}
                     </span>
                     {expandedId === snippet.id ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                  </div>
               </div>

               {expandedId === snippet.id && (
                  <div className="border-t border-slate-800 bg-slate-950 p-4 animate-fade-in">
                     <div className="relative group">
                        <pre className="bg-[#0B1021] p-4 rounded-lg overflow-x-auto text-sm font-mono text-slate-300 border border-slate-800/50 max-h-96 custom-scrollbar dir-ltr text-left">
                           <code>{snippet.code}</code>
                        </pre>
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              onClick={(e) => handleCopy(snippet.code, snippet.id, e)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300 transition-colors"
                              title="نسخ الكود"
                           >
                              {copiedId === snippet.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                           </button>
                        </div>
                     </div>
                     <div className="mt-4 flex justify-between items-center">
                        <span className="text-[10px] text-slate-600">تم الحفظ محلياً</span>
                        <button 
                           onClick={(e) => handleDelete(snippet.id, e)}
                           className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors"
                        >
                           <Trash2 size={14} /> حذف
                        </button>
                     </div>
                  </div>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Snippets;