export interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  version: string;
  lastUpdate: string;
  status: 'active' | 'completed' | 'archived';
  repoUrl: string;
  localPath: string;
  branch: string;
}

export interface VersionLog {
  id: string;
  projectId: string;
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'bugfix' | 'improvement' | 'release';
  changes: string[];
}

export interface ProgressUpdate {
  id: string;
  date: string;
  content: string;
}

export interface Note {
  id: string;
  projectId: string; // Can be null if global
  title: string;
  content: string; // The initial description
  type: 'idea' | 'bug' | 'todo';
  date: string;
  status: 'pending' | 'in_progress' | 'completed'; // New: Workflow status
  progressLogs: ProgressUpdate[]; // New: History of work
  reminder: boolean; // New: If true, shows in notifications
  assignee?: string;
  mentions?: string[];
  githubIssue?: GitHubIssue;
}

export interface GitHubIssue {
  html_url: string;
  number: number;
  state: string;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string;
  tags?: string[];
}

export interface StatData {
  name: string;
  value: number;
}