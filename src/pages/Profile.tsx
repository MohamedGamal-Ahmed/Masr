import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Github, Globe, Save, Camera, Smartphone } from 'lucide-react';

const Profile: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: 'المطور محمد',
    email: 'mgamal.ahmed@outlook.com',
    title: 'مطور حلول برمجية',
    bio: 'مطور برمجيات شغوف ببناء تطبيقات الويب والموبايل. أحب القهوة وكتابة الكود النظيف.',
    github: 'mgamal-ahmed',
    website: 'https://masar.app',
    phone: ''
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('masar_profile');
    if (savedProfile) {
      setFormData(prev => ({ ...prev, ...JSON.parse(savedProfile) }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      localStorage.setItem('masar_profile', JSON.stringify(formData));
      setIsSaving(false);
      // Optional: Dispatch a custom event if we wanted to update Layout immediately without refresh
      // window.dispatchEvent(new Event('profileUpdated')); 
    }, 800);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header / Cover */}
      <div className="relative mb-16 md:mb-12">
        <div className="h-32 bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl overflow-hidden border border-slate-800">
          {/* Abstract Pattern */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="absolute -bottom-10 right-6 flex items-end gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-slate-950 border-4 border-slate-950 flex items-center justify-center overflow-hidden shadow-xl">
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white uppercase">
                {formData.name.charAt(0)}
              </div>
            </div>
            <button className="absolute bottom-[-5px] left-[-5px] p-2 bg-slate-800 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <div className="mb-2">
            <h2 className="text-xl font-bold text-white">{formData.name}</h2>
            <p className="text-sm text-slate-400">{formData.title}</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2">المعلومات الأساسية</h3>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <User size={14} /> الاسم الكامل
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Mail size={14} /> البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Briefcase size={14} /> المسمى الوظيفي
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">نبذة تعريفية</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none h-24 resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-200 border-b border-slate-800 pb-2">الروابط والشبكات</h3>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Github size={14} /> اسم المستخدم في GitHub
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-500 text-sm">@</span>
              <input
                type="text"
                name="github"
                value={formData.github}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-8 text-slate-200 focus:border-blue-500 focus:outline-none font-mono text-sm"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Globe size={14} /> الموقع الشخصي
            </label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none text-sm font-mono"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <Smartphone size={14} /> رقم الهاتف (اختياري)
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:border-blue-500 focus:outline-none text-sm font-mono"
              dir="ltr"
            />
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mt-6">
            <h4 className="text-sm font-bold text-slate-300 mb-2">إحصائيات العضوية</h4>
            <div className="flex justify-between text-xs text-slate-500 border-b border-slate-800/50 pb-2 mb-2">
              <span>تاريخ الانضمام</span>
              <span className="font-mono">Oct 2023</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>نوع الحساب</span>
              <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 rounded">Pro Plan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save size={18} /> حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Profile;