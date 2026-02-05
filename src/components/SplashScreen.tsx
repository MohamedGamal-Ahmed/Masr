import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center"
        >
            <div className="relative">
                {/* Outer Glow Effect */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"
                />

                {/* Animated Logo */}
                <motion.img
                    src="/logo.png"
                    alt="Masar Logo"
                    className="w-32 h-32 relative z-10"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>

            {/* Title & Slogan */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-8 text-center"
            >
                <h1 className="text-3xl font-black text-white tracking-widest font-sans">MASAR</h1>
                <p className="text-blue-500 font-medium text-sm mt-1 tracking-widest uppercase opacity-80">Dev Companion</p>
            </motion.div>

            {/* Loading Indicator (Subtle) */}
            <motion.div
                className="absolute bottom-20 w-48 h-1 bg-slate-900 rounded-full overflow-hidden"
            >
                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                />
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;
