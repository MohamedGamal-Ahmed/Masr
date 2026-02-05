import { motion } from 'framer-motion';
import React from 'react';

export const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

export const StaggerContainer = ({ children, delayChildren = 0, staggerChildren = 0.1 }: { children: React.ReactNode; delayChildren?: number; staggerChildren?: number }) => (
    <motion.div
        initial="hidden"
        animate="show"
        variants={{
            hidden: { opacity: 0 },
            show: {
                opacity: 1,
                transition: {
                    delayChildren,
                    staggerChildren
                }
            }
        }}
    >
        {children}
    </motion.div>
);

export const StaggerItem = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
        }}
    >
        {children}
    </motion.div>
);

export const ScaleHover = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
        {children}
    </motion.div>
);
