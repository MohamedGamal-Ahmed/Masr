import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Shield, UploadCloud, CheckCircle2, AlertCircle, Loader2, X, Lock, Download, Upload, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';

interface BackupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
    const [token, setToken] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasStoredToken, setHasStoredToken] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('github_backup_token');
        if (savedToken) {
            setHasStoredToken(true);
            setToken(savedToken);
        }
    }, [isOpen]);

    const handleSync = async () => {
        if (!token.trim()) return;

        setIsSyncing(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const user = await api.github.getAuthenticatedUser(token);
            localStorage.setItem('github_backup_token', token);
            setHasStoredToken(true);

            await api.github.createBackupRepo(token);
            const blob = await api.backup.export();

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = (reader.result as string).split(',')[1];
                try {
                    await api.github.uploadFile(token, user.login, base64data, 'masar_backup.db');
                    setStatus('success');
                    setIsSyncing(false);
                } catch (err: any) {
                    setErrorMessage(err.message || 'فشل رفع الملف');
                    setStatus('error');
                    setIsSyncing(false);
                }
            };
        } catch (err: any) {
            setErrorMessage(err.message || 'حدث خطأ أثناء المحاولة');
            setStatus('error');
            setIsSyncing(false);
        }
    };

    const handleRestoreFromGithub = async () => {
        if (!token.trim()) return;
        if (!window.confirm('تحذير: استعادة النسخة السحابية ستحذف جميع البيانات الحالية في التطبيق وتستبدلها. هل تود الاستمرار؟')) return;

        setIsRestoring(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const user = await api.github.getAuthenticatedUser(token);
            const blob = await api.github.getFile(token, user.login, 'masar_backup.db');

            const file = new File([blob], 'masar_backup.db');
            await api.backup.import(file);

            setStatus('success');
            setTimeout(() => window.location.reload(), 2000); // Reload to reflect new DB
        } catch (err: any) {
            setErrorMessage(err.message || 'فشل استعادة البيانات من GitHub');
            setStatus('error');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleLocalExport = async () => {
        try {
            const blob = await api.backup.export();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `masar_backup_${new Date().toISOString().split('T')[0]}.db`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert('فشل تصدير الملف');
        }
    };

    const handleLocalImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.db';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!window.confirm('تحذير: استيراد هذا الملف سيحذف جميع بياناتك الحالية. هل تود الاستمرار؟')) return;

            setIsRestoring(true);
            try {
                await api.backup.import(file);
                setStatus('success');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err: any) {
                setErrorMessage(err.message || 'فشل استيراد الملف');
                setStatus('error');
            } finally {
                setIsRestoring(false);
            }
        };
        input.click();
    };

    const handleClearToken = () => {
        localStorage.removeItem('github_backup_token');
        setToken('');
        setHasStoredToken(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <UploadCloud className="text-blue-500" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-100 font-sans">إدارة النسخ الاحتياطي</h3>
                            </div>
                            <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* GitHub Backup Section */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Github size={14} /> الربط السحابي (GitHub)
                                </h4>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                        GitHub Personal Access Token <Lock size={10} />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            placeholder="ghp_xxxxxxxxxxxx"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                        {hasStoredToken && (
                                            <button
                                                onClick={handleClearToken}
                                                className="absolute left-2 top-2 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/20 transition-colors"
                                            >
                                                مسح
                                            </button>
                                        )}
                                    </div>
                                    <a
                                        href="https://github.com/settings/tokens/new?description=Masar%20Backup&scopes=repo"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-blue-500 hover:text-blue-400 block underline"
                                    >
                                        كيف أحصل على Token؟
                                    </a>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleSync}
                                        disabled={isSyncing || isRestoring || !token}
                                        className={`py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10'}`}
                                    >
                                        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                        مزامنة الآن
                                    </button>
                                    <button
                                        onClick={handleRestoreFromGithub}
                                        disabled={isSyncing || isRestoring || !token}
                                        className={`py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isRestoring ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}`}
                                    >
                                        {isRestoring ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                        استعادة سحابية
                                    </button>
                                </div>
                            </div>

                            {/* Local Backup Section */}
                            <div className="pt-6 border-t border-slate-800/50 space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={14} /> نسخة محلية (مانيوال)
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleLocalExport}
                                        className="py-3 px-2 rounded-xl text-[11px] font-bold border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Download size={14} /> تصدير ملف
                                    </button>
                                    <button
                                        onClick={handleLocalImport}
                                        className="py-3 px-2 rounded-xl text-[11px] font-bold border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Upload size={14} /> استيراد ملف
                                    </button>
                                </div>
                            </div>

                            {/* Status Messages */}
                            <AnimatePresence>
                                {status === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3"
                                    >
                                        <CheckCircle2 className="text-emerald-500 min-w-[20px]" size={18} />
                                        <p className="text-[11px] text-emerald-400 leading-tight">تمت العملية بنجاح! بياناتك الآن محفوظة أو تم استعادتها.</p>
                                    </motion.div>
                                )}

                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3"
                                    >
                                        <AlertCircle className="text-red-500 min-w-[20px]" size={18} />
                                        <p className="text-[11px] text-red-400 leading-tight">{errorMessage}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800">
                            <span className="text-[9px] text-slate-600 uppercase tracking-[0.2em]">End-to-End Local Sync & Recovery</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BackupModal;
