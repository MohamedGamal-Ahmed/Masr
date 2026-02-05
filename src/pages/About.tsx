import React from 'react';
import { Github, Linkedin, Mail, Globe, ArrowRight, Zap, Coffee, Code2 } from 'lucide-react';

const About: React.FC = () => {
   const handleSocialClick = (url: string) => {
      window.open(url, '_blank');
   };

   return (
      <div className="space-y-8 animate-fade-in pb-20 flex flex-col min-h-[85vh]">

         {/* Hero Section */}
         <div className="relative mt-8">
            {/* Banner Gradient */}
            <div className="h-40 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 rounded-3xl overflow-hidden relative shadow-2xl shadow-blue-900/20">
               {/* Texture Overlay */}
               <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               {/* Abstract Glow */}
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl mix-blend-overlay"></div>
            </div>

            {/* Avatar Container */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
               <div className="relative group">
                  {/* Glow behind avatar */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>

                  {/* Avatar Box */}
                  <div className="w-28 h-28 rounded-2xl bg-slate-950 border-4 border-slate-950 overflow-hidden shadow-2xl flex items-center justify-center relative z-10">
                     {/* Placeholder Avatar - Replace with actual image if available */}
                     <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-slate-500">
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-400">MG</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Bio Section */}
         <div className="text-center pt-12 space-y-3 px-4">
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center justify-center gap-2 tracking-tight">
               Mohamed Gamal
               <Zap size={24} className="text-yellow-400 fill-yellow-400 animate-pulse" />
            </h1>
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold tracking-wide mb-2">
               مطور حلول برمجية
            </div>
            <p className="text-slate-400 max-w-lg mx-auto text-base leading-relaxed">
               مطور برمجيات شغوف ببناء حلول مبتكرة للويب والموبايل. أهتم بكتابة كود نظيف وتصميم واجهات مستخدم سهلة وفعالة.
            </p>
         </div>

         {/* Stats / Traits */}
         <div className="grid grid-cols-3 gap-4 max-w-md mx-auto w-full px-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-blue-500/30 transition-colors">
               <Code2 className="mx-auto text-blue-500 mb-2" size={20} />
               <div className="text-lg font-bold text-white">15+</div>
               <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Projects</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-purple-500/30 transition-colors">
               <Zap className="mx-auto text-purple-500 mb-2" size={20} />
               <div className="text-lg font-bold text-white">2y</div>
               <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Experience</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center hover:border-emerald-500/30 transition-colors">
               <Coffee className="mx-auto text-emerald-500 mb-2" size={20} />
               <div className="text-lg font-bold text-white">∞</div>
               <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Coffee</div>
            </div>
         </div>

         {/* Social Links */}
         <div className="flex justify-center gap-4 py-2">
            {[
               { icon: Github, url: 'https://github.com/MohamedGamal-Ahmed', color: 'hover:text-white hover:bg-slate-800 hover:border-white/20' },
               { icon: Linkedin, url: 'https://www.linkedin.com/in/mohamed-gamal-357b10356/', color: 'hover:text-blue-400 hover:bg-blue-900/20 hover:border-blue-500/30' },
               { icon: Globe, url: 'https://masar.app', color: 'hover:text-emerald-400 hover:bg-emerald-900/20 hover:border-emerald-500/30' },
               { icon: Mail, url: 'mailto:mgamal.ahmed@outlook.com', color: 'hover:text-red-400 hover:bg-red-900/20 hover:border-red-500/30' }
            ].map((item, idx) => (
               <button
                  key={idx}
                  onClick={() => handleSocialClick(item.url)}
                  className={`w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg ${item.color}`}
               >
                  <item.icon size={24} />
               </button>
            ))}
         </div>

         {/* CTA Button */}
         <div className="pt-2 max-w-xs mx-auto w-full px-6">
            <button
               onClick={() => window.open('mailto:mgamal.ahmed@outlook.com', '_self')}
               className="relative w-full group"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
               <div className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98]">
                  <span className="text-lg">Hire Me</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </div>
            </button>
         </div>

         {/* Footer */}
         <div className="mt-auto pt-8 text-center space-y-2 border-t border-slate-800/50">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-slate-400 text-xs font-mono">Masar v1.0.0</span>
            </div>
            <p className="text-slate-600 text-[10px] font-medium tracking-wide">© 2026 Masar. Crafted with 💙 by Mohamed Gamal.</p>
         </div>
      </div>
   );
};

export default About;