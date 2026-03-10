import React, { lazy, Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Lazy load pages for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const AddNote = lazy(() => import('./pages/AddNote'));
const QuickCapture = lazy(() => import('./pages/QuickCapture'));
const AddProject = lazy(() => import('./pages/AddProject'));
const Stats = lazy(() => import('./pages/Stats'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Snippets = lazy(() => import('./pages/Snippets'));
const AddSnippet = lazy(() => import('./pages/AddSnippet'));
const About = lazy(() => import('./pages/About'));

const PageLoader = () => (
  <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
    <Loader2 size={40} className="text-blue-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 selection:bg-blue-500/30">
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      <HashRouter>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/add-project" element={<AddProject />} />
              <Route path="/project/:id" element={<ProjectDetails />} />
              <Route path="/add-note" element={<AddNote />} />
              <Route path="/quick-capture" element={<QuickCapture />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/snippets" element={<Snippets />} />
              <Route path="/add-snippet" element={<AddSnippet />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </HashRouter>
    </div>
  );
};

export default App;
