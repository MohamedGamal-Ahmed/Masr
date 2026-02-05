import { Project, VersionLog, Note, StatData } from '@/types';

const API_BASE = 'http://localhost:3004/api';

// Helper to map snake_case from DB to camelCase for TypeScript
const mapProjectFromDb = (data: any): Project => ({
    id: data.id,
    name: data.name,
    description: data.description,
    language: data.language,
    version: data.version,
    lastUpdate: data.last_update,
    status: data.status,
    repoUrl: data.repo_url || '',
    localPath: data.local_path || '',
    branch: data.branch,
});

/**
 * API Service for Masar Project
 * Connects the Frontend with the Express/SQLite Backend
 */
export const api = {
    // --- Projects ---
    projects: {
        getAll: async (): Promise<Project[]> => {
            const response = await fetch(`${API_BASE}/projects`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            return data.map(mapProjectFromDb);
        },
        getById: async (id: string): Promise<Project> => {
            const response = await fetch(`${API_BASE}/projects/${id}`);
            if (!response.ok) throw new Error('Project not found');
            const data = await response.json();
            return mapProjectFromDb(data);
        },
        create: async (project: Omit<Project, 'id' | 'lastUpdate' | 'status'>): Promise<Project> => {
            const response = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            });
            if (!response.ok) throw new Error('Failed to create project');
            const data = await response.json();
            return mapProjectFromDb(data);
        },
        update: async (id: string, project: Partial<Project>): Promise<Project> => {
            const response = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            });
            if (!response.ok) throw new Error('Failed to update project');
            const data = await response.json();
            return mapProjectFromDb(data);
        },
        delete: async (id: string): Promise<void> => {
            const response = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete project');
        },
    },

    // --- Version Logs ---
    logs: {
        getAll: async (projectId?: string): Promise<VersionLog[]> => {
            const url = projectId ? `${API_BASE}/logs?projectId=${projectId}` : `${API_BASE}/logs`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            return data.map((log: any) => ({
                id: log.id,
                projectId: log.project_id,
                version: log.version,
                date: log.date,
                title: log.title,
                description: log.description,
                type: log.type,
                changes: log.changes || [],
            }));
        },
        create: async (log: Omit<VersionLog, 'id' | 'date'>): Promise<VersionLog> => {
            const response = await fetch(`${API_BASE}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log),
            });
            if (!response.ok) throw new Error('Failed to create log');
            const data = await response.json();
            return {
                id: data.id,
                projectId: data.project_id,
                version: data.version,
                date: data.date,
                title: data.title,
                description: data.description,
                type: data.type,
                changes: data.changes || [],
            };
        },
    },

    // --- Notes ---
    notes: {
        getAll: async (): Promise<Note[]> => {
            const response = await fetch(`${API_BASE}/notes`);
            if (!response.ok) throw new Error('Failed to fetch notes');
            const data = await response.json();
            return data.map((note: any) => ({
                id: note.id,
                projectId: note.project_id || '',
                title: note.title,
                content: note.content,
                type: note.type,
                date: note.date,
                status: note.status || 'pending',
                progressLogs: note.progress_logs ? JSON.parse(note.progress_logs) : [],
                reminder: note.reminder === 1 || note.reminder === true,
            }));
        },
        create: async (note: Omit<Note, 'id' | 'date' | 'progressLogs'>): Promise<Note> => {
            const response = await fetch(`${API_BASE}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(note),
            });
            if (!response.ok) throw new Error('Failed to create note');
            const data = await response.json();
            return {
                id: data.id,
                projectId: data.project_id || '',
                title: data.title,
                content: data.content,
                type: data.type,
                date: data.date,
                status: data.status || 'pending',
                progressLogs: data.progress_logs ? JSON.parse(data.progress_logs) : [],
                reminder: data.reminder === 1 || data.reminder === true,
            };
        },
        update: async (id: string, note: Partial<Note>): Promise<Note> => {
            const response = await fetch(`${API_BASE}/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(note),
            });
            if (!response.ok) throw new Error('Failed to update note');
            const data = await response.json();
            return {
                id: data.id,
                projectId: data.project_id || '',
                title: data.title,
                content: data.content,
                type: data.type,
                date: data.date,
                status: data.status || 'pending',
                progressLogs: data.progress_logs ? JSON.parse(data.progress_logs) : [],
                reminder: data.reminder === 1 || data.reminder === true,
            };
        },
    },

    // --- Settings & Stats ---
    settings: {
        get: async (): Promise<Record<string, string>> => {
            const response = await fetch(`${API_BASE}/settings`);
            if (!response.ok) throw new Error('Failed to fetch settings');
            return response.json();
        },
        update: async (key: string, value: string): Promise<{ success: boolean }> => {
            const response = await fetch(`${API_BASE}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });
            if (!response.ok) throw new Error('Failed to update setting');
            return response.json();
        },
    },

    stats: {
        getDashboard: async (): Promise<{
            activeProjects: number;
            streak: number;
            activity: { name: string; value: number }[];
            languages: { name: string; value: number }[];
            syncStatus: number;
            lastSyncTime: string | null;
        }> => {
            const response = await fetch(`${API_BASE}/stats/dashboard`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        },
    },

    // --- GitHub Integration ---
    github: {
        /**
         * Fetch public repositories from a GitHub user
         * Uses GitHub's public API (no authentication required for public repos)
         */
        getRepos: async (username: string): Promise<GitHubRepo[]> => {
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            if (!response.ok) {
                if (response.status === 404) throw new Error('المستخدم غير موجود على GitHub');
                if (response.status === 403) throw new Error('تم تجاوز حد الطلبات. حاول مرة أخرى لاحقاً');
                throw new Error('فشل في جلب المستودعات من GitHub');
            }
            const data = await response.json();
            return data.map((repo: any) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description || 'لا يوجد وصف',
                language: repo.language || 'Unknown',
                htmlUrl: repo.html_url,
                cloneUrl: repo.clone_url,
                defaultBranch: repo.default_branch,
                updatedAt: repo.updated_at,
                stargazersCount: repo.stargazers_count,
                forksCount: repo.forks_count,
            }));
        },

        createBackupRepo: async (token: string): Promise<void> => {
            const response = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'masar-data-backup',
                    description: 'Automated backup for Masar App data',
                    private: true,
                }),
            });
            if (!response.ok && response.status !== 422) { // 422 usually means repo already exists
                throw new Error('Failed to create backup repository');
            }
        },

        uploadFile: async (token: string, username: string, content: string, fileName: string): Promise<void> => {
            const repo = 'masar-data-backup';
            const path = fileName;
            const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

            // 1. Get file SHA if it exists (for update)
            let sha = null;
            try {
                const getRes = await fetch(url, {
                    headers: { 'Authorization': `token ${token}` }
                });
                if (getRes.ok) {
                    const getData = await getRes.json();
                    sha = getData.sha;
                }
            } catch (e) { /* file doesn't exist */ }

            // 2. Upload/Update file
            const uploadRes = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Backup update ${new Date().toISOString()}`,
                    content: btoa(unescape(encodeURIComponent(content))), // Handle Unicode properly
                    sha: sha || undefined
                })
            });

            if (!uploadRes.ok) throw new Error('فشل رفع ملف النسخة الاحتياطية');
        },

        getAuthenticatedUser: async (token: string): Promise<{ login: string }> => {
            const response = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${token}` }
            });
            if (!response.ok) throw new Error('Token غير صالح');
            return response.json();
        },

        getFile: async (token: string, username: string, fileName: string): Promise<Blob> => {
            const repo = 'masar-data-backup';
            const url = `https://api.github.com/repos/${username}/${repo}/contents/${fileName}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3.raw', // Get raw content
                }
            });

            if (!response.ok) throw new Error('فشل جلب ملف النسخة الاحتياطية من GitHub');
            return response.blob();
        }
    },

    // --- Backup ---
    backup: {
        export: async (): Promise<Blob> => {
            const response = await fetch(`${API_BASE}/backup/export`);
            if (!response.ok) throw new Error('Failed to export backup');
            return response.blob();
        },
        import: async (file: File): Promise<{ success: boolean; message: string }> => {
            const formData = new FormData();
            formData.append('backup', file);

            const response = await fetch(`${API_BASE}/backup/import`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'فشل استيراد البيانات');
            }
            return response.json();
        }
    }
};

// GitHub Repository Type
export interface GitHubRepo {
    id: number;
    name: string;
    fullName: string;
    description: string;
    language: string;
    htmlUrl: string;
    cloneUrl: string;
    defaultBranch: string;
    updatedAt: string;
    stargazersCount: number;
    forksCount: number;
}
