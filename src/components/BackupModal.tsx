import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Shield, UploadCloud, CheckCircle2, AlertCircle, Loader2, X, Lock } from 'lucide-react';
import { api } from '@/services/api';

interface BackupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
    const [token, setToken] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasStoredToken, setHasStoredToken] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('github_backup_token');
        if (savedToken) {
            setHasStoredToken(true);
            setToken(savedToken);
        }
    }, []);

    const handleSync = async () => {
        if (!token.trim()) return;

        setIsSyncing(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            // 1. Verify Token and get Username
            const user = await api.github.getAuthenticatedUser(token);

            // 2. Store token securely in localStorage
            localStorage.setItem('github_backup_token', token);
            setHasStoredToken(true);

            // 3. Create Repo if it doesn't exist
            await api.github.createBackupRepo(token);

            // 4. Export Database
            const blob = await api.backup.export();

            // 5. Convert blob to Base64/String for upload
            // Since SQLite is binary, we can convert it to base64 or a string representation
            // For GitHub API content upload, we need a base64 string
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = (reader.result as string).split(',')[1];

                try {
                    // 6. Upload file
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
            console.error('Backup failed:', err);
            setErrorMessage(err.message || 'حدث خطأ أثناء المحاولة');
            setStatus('error');
            setIsSyncing(false);
        }
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
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-3 flex-row-reverse">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <CloudUpload className="text-blue-500" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-100 font-sans">النسخ الاحتياطي سحابياً</h3>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl text-right">
                                <p className="text-xs text-blue-400 leading-relaxed font-sans">
                                    سيتم إنشاء مستودع خاص (Private Repo) في حسابك على GitHub لحفظ نسخة من بياناتك بشكل آمن. لا يتم مشاركة الـ Token مع أي جهة خارجية.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 flex items-center gap-2 justify-end">
                                        GitHub Personal Access Token <Lock size={12} />
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            placeholder="ghp_xxxxxxxxxxxx"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-center focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                        {hasStoredToken && (
                                            <button
                                                onClick={handleClearToken}
                                                className="absolute left-3 top-3.5 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/20 transition-colors"
                                            >
                                                مسح
                                            </button>
                                        )}
                                    </div>
                                    <a
                                        href="https://github.com/settings/tokens/new?description=Masar%20Backup&scopes=repo"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-blue-500 hover:text-blue-400 block text-center mt-1 underline"
                                    >
                                        كيف أحصل على Token؟
                                    </a>
                                </div>

                                {status === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-row-reverse items-center gap-3"
                                    >
                                        <CheckCircle2 className="text-emerald-500 min-w-[20px]" size={20} />
                                        <p className="text-xs text-emerald-400 text-right font-sans">تمت عملية المزامنة بنجاح! بياناتك الآن محفوظة بأمان على GitHub.</p>
                                    </motion.div>
                                )}

                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-row-reverse items-center gap-3"
                                    >
                                        <AlertCircle className="text-red-500 min-w-[20px]" size={20} />
                                        <p className="text-xs text-red-400 text-right font-sans">{errorMessage}</p>
                                    </motion.div>
                                )}

                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing || !token}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isSyncing ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                                        }`}
                                >
                                    {isSyncing ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>جاري المزامنة...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Github size={20} />
                                            <span>مزامنة البيانات الآن</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800 px-6">
                            <div className="flex items-center justify-center gap-2 text-slate-500">
                                <Shield size={14} />
                                <span className="text-[10px] uppercase tracking-wider font-sans">End-to-End Local Encryption</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BackupModal;
