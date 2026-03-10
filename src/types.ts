export interface Project {
  id: string;
  name: string;
  description?: string;
  language: string;
  version: string;
  lastUpdate: string;
  status: 'active' | 'completed' | 'archived';
  repoUrl: string;
  localPath: string;
  branch: string;
  githubRepo?: string;
  tags?: string[];
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
  status?: string;
}

export interface GitHubIssue {
  number: number;
  state: string;
  title: string;
  url: string;
  owner: string;
  repo: string;
  lastSyncedAt?: string;
}

export interface GitHubIssueLink {
  owner: string;
  repo: string;
  number: number;
}

export interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: 'idea' | 'bug' | 'todo' | 'feature';
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
  progressLogs: ProgressUpdate[];
  reminder: boolean;
  assignee?: string;
  mentions?: string[];
  githubIssue?: GitHubIssue;
}

export interface IntegrationHook {
  id: string;
  name: string;
  type: 'github' | 'webhook' | 'slack';
  url?: string;
  token?: string;
  enabled: boolean;
  createdAt: string;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string;
  tags?: string[];
  date?: string;
  projectId?: string;
}

export interface StatData {
  name: string;
  value: number;
}

export interface SyncOperation {
  id: string;
  entity: 'project' | 'note' | 'log' | 'settings' | 'backup' | 'snippet';
  action: 'create' | 'update' | 'delete' | 'import';
  payload: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'processed';
}