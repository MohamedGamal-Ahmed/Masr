import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Code2, Folder, ExternalLink, Plus, Loader2, AlertCircle, Github, Star, GitFork, X, Check } from 'lucide-react';
import { Project } from '@/types';
import { api, GitHubRepo } from '@/services/api';
import { StaggerContainer, StaggerItem, ScaleHover } from '@/components/Animations';

// Default GitHub username - can be changed in the modal
const DEFAULT_GITHUB_USERNAME = '';

const getLanguageIcon = (lang: string) => {
  const l = (lang || '').toLowerCase();
  if (l.includes('python')) return <span className="text-yellow-400 font-bold">Py</span>;
  if (l.includes('typescript') || l === 'ts') return <span className="text-blue-400 font-bold">TS</span>;
  if (l.includes('javascript') || l === 'js') return <span className="text-yellow-300 font-bold">JS</span>;
  if (l.includes('react native')) return <span className="text-blue-400 font-bold">R</span>;
  if (l.includes('dart') || l.includes('flutter')) return <span className="text-blue-500 font-bold">Da</span>;
  if (l.includes('java')) return <span className="text-red-500 font-bold">Ja</span>;
  if (l.includes('html')) return <span className="text-orange-500 font-bold">Ht</span>;
  if (l.includes('css')) return <span className="text-blue-500 font-bold">Cs</span>;
  if (l.includes('sql') || l.includes('db')) return <span className="text-purple-400 font-bold">DB</span>;

  if (lang && lang.length >= 2) {
    return <span className="text-slate-400 font-bold">{lang.substring(0, 2)}</span>;
  }

  return <Code2 className="text-slate-400" size={20} />;
};

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GitHub Import Modal State
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [githubUsername, setGithubUsername] = useState(DEFAULT_GITHUB_USERNAME);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await api.projects.getAll();
        setAllProjects(data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Unable to load projects. Please make sure the backend server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = allProjects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch GitHub repos
  const fetchGitHubRepos = async () => {
    if (!githubUsername.trim()) return;

    setIsLoadingRepos(true);
    setRepoError(null);
    setGithubRepos([]);
    setSelectedRepos(new Set());

    try {
      const repos = await api.github.getRepos(githubUsername.trim());
      setGithubRepos(repos);
    } catch (err: any) {
      setRepoError(err.message || 'Failed to fetch repositories.');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Toggle repo selection
  const toggleRepoSelection = (repoId: number) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(repoId)) {
        newSet.delete(repoId);
      } else {
        newSet.add(repoId);
      }
      return newSet;
    });
  };

  // Import selected repos to local database
  const importSelectedRepos = async () => {
    if (selectedRepos.size === 0) return;

    setIsImporting(true);

    try {
      const reposToImport = githubRepos.filter(r => selectedRepos.has(r.id));

      for (const repo of reposToImport) {
        await api.projects.create({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          version: 'v1.0.0',
          repoUrl: repo.htmlUrl,
          localPath: '',
          branch: repo.defaultBranch,
        });
      }

      // Refresh projects list
      const updatedProjects = await api.projects.getAll();
      setAllProjects(updatedProjects);

      // Close modal and reset state
      setShowGitHubModal(false);
      setSelectedRepos(new Set());
      setGithubRepos([]);

    } catch (err: any) {
      setRepoError('Import failed for one or more repositories.');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-400 animate-pulse">Loading your projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
        <AlertCircle size={40} className="text-red-500" />
        <h3 className="text-red-200 font-bold">Connection Error</h3>
        <p className="text-red-400/80 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors"
        >Add your first project</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4">
        <h2 className="text-2xl font-bold">Projects</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowGitHubModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600"
          >
            <Github size={18} />
            Import from GitHub
          </button>
          <button
            onClick={() => navigate('/add-project')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-transform active:scale-95"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search projects by name or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder-slate-500 transition-all"
          />
          <Search className="absolute right-3 top-3.5 text-slate-500" size={18} />
        </div>
      </div>

      {/* Projects List */}
      <StaggerContainer>
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 mb-2">No projects match your search.</p>
              <button onClick={() => navigate('/add-project')} className="text-blue-500 text-sm font-medium">Add your first project</button>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <StaggerItem key={project.id}>
                <ScaleHover>
                  <Link to={`/project/${project.id}`} className="block h-full">
                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-colors h-full min-h-[160px] flex flex-col justify-between">
                      
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                              {getLanguageIcon(project.language)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-100">{project.name}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] bg-slate-800 px-1.5 rounded text-slate-400 border border-slate-700/50">{project.language}</span>
                                <span className="text-[10px] text-slate-500">{project.lastUpdate}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full border ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                            {project.version}
                          </span>
                        </div>

                        <p className="text-sm text-slate-400 mb-4 line-clamp-2 pl-2 border-l-2 border-slate-800 ml-1">
                          {project.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50 mt-auto">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Folder size={12} />
                          <span className="font-mono max-w-[150px] truncate" dir="ltr">{project.localPath || project.branch}</span>
                        </div>
                        {project.repoUrl && (
                          <div className="flex items-center gap-1 text-xs text-blue-500">
                            <ExternalLink size={12} />
                            <span>GitHub</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </Link>
                </ScaleHover>
              </StaggerItem>
            ))
          )}
        </div>
      </StaggerContainer>

      {/* GitHub Import Modal */}
      {showGitHubModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGitHubModal(false)}>
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Github size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Import from GitHub</h3>
                  <p className="text-xs text-slate-500">Select repositories to add to your local project list.</p>
                </div>
              </div>
              <button
                onClick={() => setShowGitHubModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Username Input */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute right-3 top-3 text-slate-500">@</span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchGitHubRepos()}
                    placeholder="اسم المستخدم على GitHub"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-8 pl-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={fetchGitHubRepos}
                  disabled={isLoadingRepos || !githubUsername.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  {isLoadingRepos ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Search
                </button>
              </div>
            </div>

            {/* Repos List */}
            <div className="p-4 overflow-y-auto max-h-[40vh] space-y-2">
              {repoError && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm text-center">
                  {repoError}
                </div>
              )}

              {isLoadingRepos && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                </div>
              )}

              {!isLoadingRepos && githubRepos.length === 0 && !repoError && (
                <div className="text-center py-10 text-slate-500">
                  <Github size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Enter a username and press Search to list repositories.</p>
                </div>
              )}

              {githubRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => toggleRepoSelection(repo.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRepos.has(repo.id)
                    ? 'bg-blue-500/10 border-blue-500/50'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-200">{repo.name}</h4>
                        {selectedRepos.has(repo.id) && (
                          <Check size={16} className="text-blue-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{repo.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">{repo.language}</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Star size={10} /> {repo.stargazersCount}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <GitFork size={10} /> {repo.forksCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            {githubRepos.length > 0 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Selected: <span className="text-blue-400 font-bold">{selectedRepos.size}</span> repo(s)
                </span>
                <button
                  onClick={importSelectedRepos}
                  disabled={selectedRepos.size === 0 || isImporting}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Import Selected
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;


















