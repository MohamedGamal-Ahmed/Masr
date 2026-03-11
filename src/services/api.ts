import { Project, VersionLog, Note, GitHubIssueLink, IntegrationHook } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';

/**
 * Local Storage Helper for Masar App
 */
const STORAGE_KEYS = {
    PROJECTS: 'masar_projects',
    LOGS: 'masar_logs',
    NOTES: 'masar_notes',
    SETTINGS: 'masar_settings',
    HOOKS: 'masar_integration_hooks',
    SNIPPETS: 'masar_snippets',
    SYNC_QUEUE: 'masar_sync_queue',
    LAST_SYNC: 'masar_last_sync_at'
};

type SyncEntity = 'project' | 'note' | 'log' | 'settings' | 'backup';
type SyncAction = 'create' | 'update' | 'delete' | 'import';

interface SyncOperation {
    id: string;
    entity: SyncEntity;
    action: SyncAction;
    refId?: string;
    payload?: unknown;
    createdAt: string;
    attempts: number;
    status: 'pending' | 'failed';
}

const memoryCache = new Map<string, unknown>();

const getLocalData = <T>(key: string, defaultValue: T): T => {
    if (memoryCache.has(key)) {
        return memoryCache.get(key) as T;
    }
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as T) : defaultValue;
    memoryCache.set(key, parsed);
    return parsed;
};

const setLocalData = <T>(key: string, data: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        memoryCache.set(key, data);
    } catch (err) {
        const isQuotaError =
            err instanceof DOMException &&
            (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');

        if (isQuotaError) {
            console.warn('Masar local data limit reached.');
            let usedBytes = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k) usedBytes += (k.length + (localStorage.getItem(k)?.length || 0)) * 2;
            }
            const totalBytes = 5 * 1024 * 1024;
            window.dispatchEvent(
                new CustomEvent('masar:storage-full', {
                    detail: {
                        usedBytes,
                        totalBytes,
                        usedPercent: Math.min(100, Math.round((usedBytes / totalBytes) * 100)),
                    },
                })
            );
            throw new Error("Local Storage limits exceeded! Unable to save changes. Please export/backup your data or clear space.");
        }
        throw err;
    }
};

const parseTimestamp = (value: string): number => {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct.getTime();

    const parts = value.match(/\d+/g);
    if (parts && parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day).getTime();
    }

    return 0;
};

const buildMonthlyActivity = (logs: VersionLog[]): { name: string; value: number }[] => {
    const formatter = new Intl.DateTimeFormat('ar-EG', { month: 'short' });
    const now = new Date();
    const months: { key: string; name: string }[] = [];

    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push({ key, name: formatter.format(d) });
    }

    const counts = new Map<string, number>();
    months.forEach(m => counts.set(m.key, 0));

    logs.forEach(log => {
        const ts = parseTimestamp(log.date);
        if (!ts) return;
        const d = new Date(ts);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (counts.has(key)) {
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    });

    return months.map(m => ({ name: m.name, value: counts.get(m.key) || 0 }));
};

const byLatestDate = <T extends { date: string }>(items: T[]): T[] =>
    [...items].sort((a, b) => parseTimestamp(b.date) - parseTimestamp(a.date));

const isOnline = (): boolean => (typeof navigator === 'undefined' ? true : navigator.onLine);

const getQueue = (): SyncOperation[] => getLocalData<SyncOperation[]>(STORAGE_KEYS.SYNC_QUEUE, []);

const setQueue = (queue: SyncOperation[]): void => setLocalData(STORAGE_KEYS.SYNC_QUEUE, queue);

const enqueueSyncOperation = (operation: Omit<SyncOperation, 'id' | 'createdAt' | 'attempts' | 'status'>): void => {
    const queue = getQueue();
    queue.push({
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
        ...operation,
    });
    setQueue(queue);
};

const markLastSyncNow = (): void => {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

const githubRequest = async <T>(
    token: string,
    url: string,
    init?: RequestInit
): Promise<T> => {
    const response = await fetch(url, {
        ...init,
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error('GitHub token غير صالح');
        if (response.status === 403) throw new Error('صلاحيات GitHub غير كافية أو تم تجاوز حد الطلبات');
        if (response.status === 404) throw new Error('المستودع أو الـ Issue غير موجود');
        throw new Error('فشل الاتصال بـ GitHub');
    }

    return response.json();
};

type IntegrationEvent = 'note_created' | 'note_updated' | 'note_completed' | 'issue_linked';

const emitIntegrationEvent = async (
    event: IntegrationEvent,
    payload: Record<string, unknown>
): Promise<void> => {
    const hooks = getLocalData<IntegrationHook[]>(STORAGE_KEYS.HOOKS, []);
    const activeHooks = hooks.filter(hook => hook.enabled && hook.events.includes(event));
    if (activeHooks.length === 0) return;

    let hooksChanged = false;
    const updatedHooks = [...hooks];

    await Promise.all(
        activeHooks.map(async (hook) => {
            try {
                await fetch(hook.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(hook.secret ? { 'X-Masar-Signature': hook.secret } : {}),
                    },
                    body: JSON.stringify({
                        event,
                        source: 'masar',
                        createdAt: new Date().toISOString(),
                        payload,
                    }),
                });

                const idx = updatedHooks.findIndex(h => h.id === hook.id);
                if (idx !== -1) {
                    updatedHooks[idx] = { ...updatedHooks[idx], lastTriggeredAt: new Date().toISOString() };
                    hooksChanged = true;
                }
            } catch {
                // Hooks are best-effort; don't block app flow on integration failures.
            }
        })
    );

    if (hooksChanged) {
        setLocalData(STORAGE_KEYS.HOOKS, updatedHooks);
    }
};

/**
 * stand-alone Local API Service
 * Stores data directly in the device's LocalStorage
 */

// --- Storage Limits & Token Management ---
let memoryToken: string | null = null;
export const tokenManager = {
    setToken: (token: string) => { memoryToken = token; },
    getToken: (): string | null => memoryToken,
    clearToken: () => { memoryToken = null; }
};

const syncLocks = new Set<string>();
export const api = {
    // --- Projects ---
    projects: {
        getAll: async (): Promise<Project[]> => {
            return getLocalData<Project[]>(STORAGE_KEYS.PROJECTS, []);
        },
        getById: async (id: string): Promise<Project> => {
            const projects = getLocalData<Project[]>(STORAGE_KEYS.PROJECTS, []);
            const project = projects.find(p => p.id === id);
            if (!project) throw new Error('Project not found');
            return project;
        },
        create: async (project: Omit<Project, 'id' | 'lastUpdate' | 'status'>): Promise<Project> => {
            const projects = getLocalData<Project[]>(STORAGE_KEYS.PROJECTS, []);
            const newProject: Project = {
                ...project,
                name: project.name ? DOMPurify.sanitize(project.name) : project.name,
                description: project.description ? DOMPurify.sanitize(project.description) : undefined,
                id: uuidv4(),
                lastUpdate: new Date().toISOString(),
                status: 'active'
            };
            projects.unshift(newProject);
            setLocalData(STORAGE_KEYS.PROJECTS, projects);
            enqueueSyncOperation({ entity: 'project', action: 'create', refId: newProject.id, payload: newProject });
            if (isOnline()) void api.sync.processQueue();
            return newProject;
        },
        update: async (id: string, updates: Partial<Project>): Promise<Project> => {
            const projects = getLocalData<Project[]>(STORAGE_KEYS.PROJECTS, []);
            const index = projects.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Project not found');

            const safeUpdates = { ...updates };
            if (safeUpdates.name !== undefined) safeUpdates.name = DOMPurify.sanitize(safeUpdates.name);
            if (safeUpdates.description !== undefined && safeUpdates.description !== null) safeUpdates.description = DOMPurify.sanitize(safeUpdates.description);

            projects[index] = {
                ...projects[index],
                ...safeUpdates,
                lastUpdate: new Date().toISOString()
            };
            setLocalData(STORAGE_KEYS.PROJECTS, projects);
            enqueueSyncOperation({ entity: 'project', action: 'update', refId: id, payload: updates });
            if (isOnline()) void api.sync.processQueue();
            return projects[index];
        },
        delete: async (id: string): Promise<void> => {
            let projects = getLocalData<Project[]>(STORAGE_KEYS.PROJECTS, []);
            projects = projects.filter(p => p.id !== id);
            setLocalData(STORAGE_KEYS.PROJECTS, projects);

            // Clean up related logs and notes
            let logs = getLocalData<VersionLog[]>(STORAGE_KEYS.LOGS, []);
            setLocalData(STORAGE_KEYS.LOGS, logs.filter(l => l.projectId !== id));

            let notes = getLocalData<Note[]>(STORAGE_KEYS.NOTES, []);
            setLocalData(STORAGE_KEYS.NOTES, notes.filter(n => n.projectId !== id));
            enqueueSyncOperation({ entity: 'project', action: 'delete', refId: id });
            if (isOnline()) void api.sync.processQueue();
        },
    },

    // --- Version Logs ---
    logs: {
        getAll: async (projectId?: string): Promise<VersionLog[]> => {
            const logs = byLatestDate(getLocalData<VersionLog[]>(STORAGE_KEYS.LOGS, []));
            const filtered = projectId ? logs.filter(l => l.projectId === projectId) : logs;
            return byLatestDate(filtered);
        },
        create: async (log: Omit<VersionLog, 'id' | 'date'>): Promise<VersionLog> => {
            const logs = getLocalData<VersionLog[]>(STORAGE_KEYS.LOGS, []);
            const newLog: VersionLog = {
                ...log,
                id: uuidv4(),
                date: new Date().toISOString(),
            };
            logs.unshift(newLog);
            setLocalData(STORAGE_KEYS.LOGS, logs);
            enqueueSyncOperation({ entity: 'log', action: 'create', refId: newLog.id, payload: newLog });
            if (isOnline()) void api.sync.processQueue();

            // Update project version automatically
            await api.projects.update(log.projectId, { version: log.version });

            return newLog;
        },
    },

    // --- Notes ---
    notes: {
        getAll: async (): Promise<Note[]> => {
            return byLatestDate(getLocalData<Note[]>(STORAGE_KEYS.NOTES, []));
        },
        create: async (note: Omit<Note, 'id' | 'date' | 'progressLogs'>): Promise<Note> => {
            const notes = getLocalData<Note[]>(STORAGE_KEYS.NOTES, []);
            const newNote: Note = {
                ...note,
                title: note.title ? DOMPurify.sanitize(note.title) : note.title,
                content: note.content ? DOMPurify.sanitize(note.content) : note.content,
                // Bug 2 fix: normalize projectId to '' (never null/undefined) so ProjectDetails filter works
                projectId: note.projectId || '',
                priority: note.priority ?? 'normal',
                id: uuidv4(),
                date: new Date().toISOString(),
                progressLogs: [],
                mentions: note.mentions || [],
            };
            notes.unshift(newNote);
            setLocalData(STORAGE_KEYS.NOTES, notes);
            enqueueSyncOperation({ entity: 'note', action: 'create', refId: newNote.id, payload: newNote });
            if (isOnline()) void api.sync.processQueue();
            void emitIntegrationEvent('note_created', {
                noteId: newNote.id,
                title: newNote.title,
                type: newNote.type,
                status: newNote.status,
                projectId: newNote.projectId,
                assignee: newNote.assignee || null,
                mentions: newNote.mentions || [],
            });
            return newNote;
        },
        update: async (id: string, updates: Partial<Note>): Promise<Note> => {
            const notes = getLocalData<Note[]>(STORAGE_KEYS.NOTES, []);
            const index = notes.findIndex(n => n.id === id);
            if (index === -1) throw new Error('Note not found');

            const safeUpdates = { ...updates };
            if (safeUpdates.title !== undefined) safeUpdates.title = DOMPurify.sanitize(safeUpdates.title);
            if (safeUpdates.content !== undefined) safeUpdates.content = DOMPurify.sanitize(safeUpdates.content);
            if (safeUpdates.assignee !== undefined) safeUpdates.assignee = DOMPurify.sanitize(safeUpdates.assignee);
            if (safeUpdates.mentions !== undefined) safeUpdates.mentions = safeUpdates.mentions.map((m: string) => DOMPurify.sanitize(m));

            const previous = notes[index];
            notes[index] = { ...notes[index], ...safeUpdates };
            setLocalData(STORAGE_KEYS.NOTES, notes);
            enqueueSyncOperation({ entity: 'note', action: 'update', refId: id, payload: updates });
            if (isOnline()) void api.sync.processQueue();

            const updated = notes[index];
            if (updates.githubIssue && !previous.githubIssue) {
                void emitIntegrationEvent('issue_linked', {
                    noteId: updated.id,
                    issueNumber: updates.githubIssue.number,
                    issueUrl: updates.githubIssue.url,
                });
            } else if (updates.status === 'completed' && previous.status !== 'completed') {
                void emitIntegrationEvent('note_completed', {
                    noteId: updated.id,
                    title: updated.title,
                    projectId: updated.projectId,
                });
            } else {
                void emitIntegrationEvent('note_updated', {
                    noteId: updated.id,
                    title: updated.title,
                    projectId: updated.projectId,
                });
            }
            return updated;
        },
    },

    // --- Settings & Stats ---
    settings: {
        get: async (): Promise<Record<string, string>> => {
            return getLocalData<Record<string, string>>(STORAGE_KEYS.SETTINGS, {});
        },
        update: async (key: string, value: string): Promise<{ success: boolean }> => {
            const settings = getLocalData<Record<string, string>>(STORAGE_KEYS.SETTINGS, {});
            settings[key] = value;
            setLocalData(STORAGE_KEYS.SETTINGS, settings);
            enqueueSyncOperation({ entity: 'settings', action: 'update', refId: key, payload: { key, value } });
            if (isOnline()) void api.sync.processQueue();
            return { success: true };
        },
    },

    sync: {
        getState: async (): Promise<{
            isOnline: boolean;
            pendingCount: number;
            failedCount: number;
            lastSyncedAt: string | null;
        }> => {
            const queue = getQueue();
            const pendingCount = queue.filter(op => op.status === 'pending').length;
            const failedCount = queue.filter(op => op.status === 'failed').length;
            const lastSyncedAt = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
            return {
                isOnline: isOnline(),
                pendingCount,
                failedCount,
                lastSyncedAt,
            };
        },

        processQueue: async (options?: { includeFailed?: boolean }): Promise<{ processed: number; failed: number }> => {
            if (!isOnline()) {
                return { processed: 0, failed: getQueue().filter(op => op.status === 'failed').length };
            }

            const includeFailed = options?.includeFailed ?? false;
            const queue = getQueue();
            let processed = 0;
            let failed = 0;
            const remaining: SyncOperation[] = [];

            for (const op of queue) {
                const eligible = op.status === 'pending' || (includeFailed && op.status === 'failed');
                if (!eligible) {
                    remaining.push(op);
                    continue;
                }

                try {
                    // Queue processing hook: currently local-first (no remote endpoint yet).
                    // Keeping this step explicit makes backend sync integration straightforward.
                    processed += 1;
                } catch {
                    failed += 1;
                    remaining.push({
                        ...op,
                        attempts: op.attempts + 1,
                        status: 'failed',
                    });
                }
            }

            setQueue(remaining);
            markLastSyncNow();
            return { processed, failed };
        },

        retryFailed: async (): Promise<{ processed: number; failed: number }> => {
            return api.sync.processQueue({ includeFailed: true });
        },

        clear: async (): Promise<void> => {
            setQueue([]);
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
            const projects = getLocalData<Project[]>(STORAGE_KEYS.PROJECTS, []);
            const logs = getLocalData<VersionLog[]>(STORAGE_KEYS.LOGS, []);
            const notes = getLocalData<Note[]>(STORAGE_KEYS.NOTES, []);

            const activeProjects = projects.filter(p => p.status === 'active').length;

            // Calculate Dynamic Streak based on activity dates
            let streak = 0;
            const activityDates = new Set<string>();

            // Collect all unique activity dates
            logs.forEach(l => {
                const ts = parseTimestamp(l.date);
                if (ts) activityDates.add(new Date(ts).toDateString());
            });
            notes.forEach(n => {
                const ts = parseTimestamp(n.date);
                if (ts) activityDates.add(new Date(ts).toDateString());
                (n.progressLogs || []).forEach(pl => {
                    const pts = parseTimestamp(pl.date);
                    if (pts) activityDates.add(new Date(pts).toDateString());
                });
            });

            const sortedDates = Array.from(activityDates)
                .map(d => new Date(d).getTime())
                .sort((a, b) => b - a);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (sortedDates.length > 0) {
                const latest = new Date(sortedDates[0]);
                latest.setHours(0, 0, 0, 0);

                // If latest activity is today or yesterday, count streak
                if (latest.getTime() === today.getTime() || latest.getTime() === yesterday.getTime()) {
                    streak = 1;
                    let currentDate = latest;

                    for (let i = 1; i < sortedDates.length; i++) {
                        const prevDate = new Date(sortedDates[i]);
                        prevDate.setHours(0, 0, 0, 0);

                        const expectedPrev = new Date(currentDate);
                        expectedPrev.setDate(expectedPrev.getDate() - 1);

                        if (prevDate.getTime() === expectedPrev.getTime()) {
                            streak++;
                            currentDate = prevDate;
                        } else {
                            break; // Streak broken
                        }
                    }
                }
            }

            // Languages
            const langCounts: Record<string, number> = {};
            projects.forEach(p => {
                if (p.language) langCounts[p.language] = (langCounts[p.language] || 0) + 1;
            });
            const languages = Object.entries(langCounts).map(([name, count]) => ({
                name,
                value: Math.round((count / (projects.length || 1)) * 100)
            }));

            const activity = buildMonthlyActivity(logs);

            const projectsWithRepo = projects.filter(p => p.repoUrl).length;

            return {
                activeProjects,
                streak,
                activity,
                languages,
                syncStatus: projects.length > 0 ? Math.round((projectsWithRepo / projects.length) * 100) : 100,
                lastSyncTime: logs.length > 0 ? logs[0].date : null
            };
        },
    },

    // --- GitHub Integration ---
    github: {
        getRepos: async (username: string): Promise<GitHubRepo[]> => {
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`);
            if (!response.ok) throw new Error('فشل جلب المستودعات من GitHub');
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

        createIssue: async (
            token: string,
            owner: string,
            repo: string,
            payload: { title: string; body: string; labels?: string[] }
        ): Promise<GitHubIssueLink> => {
            const issue = await githubRequest<GitHubIssueResponse>(
                token,
                `https://api.github.com/repos/${owner}/${repo}/issues`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        title: payload.title,
                        body: payload.body,
                        labels: payload.labels || [],
                    }),
                }
            );

            return {
                owner,
                repo,
                number: issue.number,
                title: issue.title,
                url: issue.html_url,
                state: issue.state,
                lastSyncedAt: new Date().toISOString(),
            };
        },

        getIssue: async (token: string, owner: string, repo: string, issueNumber: number): Promise<GitHubIssueLink> => {
            const issue = await githubRequest<GitHubIssueResponse>(
                token,
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`
            );

            return {
                owner,
                repo,
                number: issue.number,
                title: issue.title,
                url: issue.html_url,
                state: issue.state,
                lastSyncedAt: new Date().toISOString(),
            };
        },

        updateIssueState: async (
            token: string,
            owner: string,
            repo: string,
            issueNumber: number,
            state: 'open' | 'closed'
        ): Promise<GitHubIssueLink> => {
            const issue = await githubRequest<GitHubIssueResponse>(
                token,
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ state }),
                }
            );

            return {
                owner,
                repo,
                number: issue.number,
                title: issue.title,
                url: issue.html_url,
                state: issue.state,
                lastSyncedAt: new Date().toISOString(),
            };
        },

        closeIssue: async (
            token: string,
            owner: string,
            repo: string,
            issueNumber: number,
            reason: 'completed' | 'not_planned' = 'completed'
        ): Promise<void> => {
            await githubRequest<GitHubIssueResponse>(
                token,
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ state: 'closed', state_reason: reason }),
                }
            );
        },

        reopenIssue: async (
            token: string,
            owner: string,
            repo: string,
            issueNumber: number
        ): Promise<void> => {
            await githubRequest<GitHubIssueResponse>(
                token,
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ state: 'open' }),
                }
            );
        },

        addComment: async (
            token: string,
            owner: string,
            repo: string,
            issueNumber: number,
            body: string
        ): Promise<void> => {
            await githubRequest<{ id: number }>(
                token,
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
                {
                    method: 'POST',
                    body: JSON.stringify({ body }),
                }
            );
        },

        syncLinkedIssues: async (token: string, signal?: AbortSignal): Promise<{ updated: number }> => {
            if (syncLocks.has('sync-linked')) throw new Error('Sync already in progress!');
            syncLocks.add('sync-linked');
            try {
                const notes = getLocalData<Note[]>(STORAGE_KEYS.NOTES, []);
                let updated = 0;
                const syncedNotes = [...notes];

                for (let i = 0; i < syncedNotes.length; i += 1) {
                    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
                    const issue = syncedNotes[i].githubIssue;
                    if (!issue) continue;
                    try {
                        const remote = await api.github.getIssue(token, issue.owner, issue.repo, issue.number);
                        remote.title = DOMPurify.sanitize(remote.title);
                        syncedNotes[i] = { ...syncedNotes[i], githubIssue: remote };
                        updated += 1;
                    } catch {
                        // keep local snapshot if sync for one note fails
                    }
                }

                if (updated > 0) {
                    setLocalData(STORAGE_KEYS.NOTES, syncedNotes);
                    enqueueSyncOperation({ entity: 'note', action: 'update', payload: { reason: 'github_issue_sync', updated } });
                    if (isOnline()) void api.sync.processQueue();
                }

                return { updated };
            } finally {
                syncLocks.delete('sync-linked');
            }
        },

        syncRepoIssues: async (token: string, owner: string, repo: string, projectId: string, signal?: AbortSignal): Promise<{ added: number, updated: number }> => {
            const lockKey = `repo-sync-${owner}-${repo}`;
            if (syncLocks.has(lockKey)) throw new Error("Sync already in progress!");
            syncLocks.add(lockKey);
            try {
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                    signal
                });

                if (!response.ok) throw new Error('Failed to fetch repository issues');
                const githubIssues = await response.json();

                let added = 0;
                let updated = 0;
                const notes = getLocalData<Note[]>(STORAGE_KEYS.NOTES, []);
                const updatedNotes = [...notes];

                // Loop through all GitHub issues
                for (const issue of githubIssues) {
                    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
                    // Ignore pull requests (they also appear in the issues endpoint)
                    if (issue.pull_request) continue;

                    // Check if we already have a note for this issue
                    const existingNoteIndex = updatedNotes.findIndex(n => n.githubIssue?.number === issue.number && n.projectId === projectId);

                    const mappedState = issue.state === 'closed' ? 'completed' : 'pending';

                    if (existingNoteIndex !== -1) {
                        // Update existing note state
                        const existingNote = updatedNotes[existingNoteIndex];
                        if (existingNote.githubIssue?.state !== issue.state || existingNote.status !== mappedState) {
                            updatedNotes[existingNoteIndex] = {
                                ...existingNote,
                                status: mappedState,
                                githubIssue: {
                                    ...existingNote.githubIssue!,
                                    state: issue.state,
                                    title: DOMPurify.sanitize(issue.title),
                                    url: issue.html_url,
                                    lastSyncedAt: new Date().toISOString()
                                }
                            };
                            updated += 1;
                        }
                    } else {
                        // Map GitHub labels to Masar Note types
                        const hasLabel = (name: string) => (issue.labels || []).some((l: any) => l.name.toLowerCase().includes(name));
                        let noteType: Note['type'] = 'idea';
                        if (hasLabel('bug')) noteType = 'bug';
                        if (hasLabel('enhancement') || hasLabel('feature')) noteType = 'todo';

                        // Create a new note
                        const newNote: Note = {
                            id: uuidv4(),
                            title: DOMPurify.sanitize(issue.title),
                            content: DOMPurify.sanitize(issue.body || 'No description provided on GitHub.'),
                            type: noteType,
                            status: mappedState,
                            projectId: projectId,
                            date: new Date(issue.created_at).toISOString(),
                            progressLogs: [],
                            reminder: false, // Default reminder state
                            githubIssue: {
                                owner,
                                repo,
                                number: issue.number,
                                title: issue.title,
                                url: issue.html_url,
                                state: issue.state,
                                lastSyncedAt: new Date().toISOString()
                            }
                        };
                        updatedNotes.unshift(newNote);
                        added += 1;
                    }
                }

                if (added > 0 || updated > 0) {
                    setLocalData(STORAGE_KEYS.NOTES, updatedNotes);
                    enqueueSyncOperation({ entity: 'note', action: 'update', payload: { reason: 'github_repo_sync', added, updated } });
                    if (isOnline()) void api.sync.processQueue();
                }

                return { added, updated };
            } finally {
                syncLocks.delete(lockKey);
            }
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
            if (!response.ok && response.status !== 422) throw new Error('Failed to create backup repository');
        },

        uploadFile: async (token: string, username: string, contentBase64: string, fileName: string): Promise<void> => {
            const repo = 'masar-data-backup';
            const url = `https://api.github.com/repos/${username}/${repo}/contents/${fileName}`;

            let sha = null;
            try {
                const getRes = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
                if (getRes.ok) {
                    const getData = await getRes.json();
                    sha = getData.sha;
                }
            } catch (e) { }

            const uploadRes = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Backup update ${new Date().toISOString()}`,
                    content: contentBase64,
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
                    'Accept': 'application/vnd.github.v3.raw',
                }
            });
            if (!response.ok) throw new Error('فشل جلب ملف النسخة الاحتياطية من GitHub');
            return response.blob();
        }
    },

    integrations: {
        getHooks: async (): Promise<IntegrationHook[]> => {
            return getLocalData<IntegrationHook[]>(STORAGE_KEYS.HOOKS, []);
        },

        createHook: async (hook: Omit<IntegrationHook, 'id' | 'lastTriggeredAt'>): Promise<IntegrationHook> => {
            const hooks = getLocalData<IntegrationHook[]>(STORAGE_KEYS.HOOKS, []);
            const newHook: IntegrationHook = {
                ...hook,
                id: uuidv4(),
            };
            hooks.unshift(newHook);
            setLocalData(STORAGE_KEYS.HOOKS, hooks);
            return newHook;
        },

        updateHook: async (id: string, updates: Partial<IntegrationHook>): Promise<IntegrationHook> => {
            const hooks = getLocalData<IntegrationHook[]>(STORAGE_KEYS.HOOKS, []);
            const index = hooks.findIndex(h => h.id === id);
            if (index === -1) throw new Error('Hook not found');
            hooks[index] = { ...hooks[index], ...updates };
            setLocalData(STORAGE_KEYS.HOOKS, hooks);
            return hooks[index];
        },

        deleteHook: async (id: string): Promise<void> => {
            const hooks = getLocalData<IntegrationHook[]>(STORAGE_KEYS.HOOKS, []);
            setLocalData(STORAGE_KEYS.HOOKS, hooks.filter(h => h.id !== id));
        },

        testHook: async (id: string): Promise<{ ok: boolean }> => {
            const hooks = getLocalData<IntegrationHook[]>(STORAGE_KEYS.HOOKS, []);
            const hook = hooks.find(h => h.id === id);
            if (!hook) throw new Error('Hook not found');
            await emitIntegrationEvent('note_updated', {
                test: true,
                hookId: id,
                message: 'Masar integration hook test',
            });
            return { ok: true };
        },
    },

    reports: {
        generateProjectHandoff: async (projectId: string): Promise<{ fileName: string; content: string }> => {
            const [notes, projects] = await Promise.all([
                api.notes.getAll(),
                api.projects.getAll(),
            ]);

            const isGeneral = projectId === 'general';
            const project = isGeneral ? null : projects.find(p => p.id === projectId) || null;
            const filteredNotes = notes.filter(note => (isGeneral ? !note.projectId || note.projectId === 'general' : note.projectId === projectId));

            const byStatus = {
                pending: filteredNotes.filter(n => n.status === 'pending'),
                in_progress: filteredNotes.filter(n => n.status === 'in_progress'),
                completed: filteredNotes.filter(n => n.status === 'completed'),
            };

            const title = isGeneral ? 'General Inbox' : (project?.name || 'Unknown Project');
            const now = new Date().toISOString();

            const renderNote = (note: Note): string => {
                const issueInfo = note.githubIssue ? `Issue #${note.githubIssue.number} (${note.githubIssue.state}) - ${note.githubIssue.url}` : 'No linked issue';
                const assigneeInfo = note.assignee ? `@${note.assignee}` : 'Unassigned';
                const mentionsInfo = note.mentions && note.mentions.length > 0 ? note.mentions.map(m => `@${m}`).join(', ') : 'None';
                return [
                    `- ${note.title}`,
                    `  - Type: ${note.type}`,
                    `  - Assignee: ${assigneeInfo}`,
                    `  - Mentions: ${mentionsInfo}`,
                    `  - Date: ${note.date}`,
                    `  - GitHub: ${issueInfo}`,
                    `  - Content: ${note.content.replace(/\n/g, ' ')}`,
                ].join('\n');
            };

            const content = [
                `# Masar Handoff Summary`,
                ``,
                `Generated: ${now}`,
                `Project: ${title}`,
                ``,
                `## Snapshot`,
                `- Total notes: ${filteredNotes.length}`,
                `- Pending: ${byStatus.pending.length}`,
                `- In progress: ${byStatus.in_progress.length}`,
                `- Completed: ${byStatus.completed.length}`,
                ``,
                `## Pending`,
                ...(byStatus.pending.length > 0 ? byStatus.pending.map(renderNote) : ['- None']),
                ``,
                `## In Progress`,
                ...(byStatus.in_progress.length > 0 ? byStatus.in_progress.map(renderNote) : ['- None']),
                ``,
                `## Completed`,
                ...(byStatus.completed.length > 0 ? byStatus.completed.map(renderNote) : ['- None']),
            ].join('\n');

            const safeProject = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const datePart = new Date().toISOString().slice(0, 10);
            return {
                fileName: `handoff-${safeProject || 'project'}-${datePart}.md`,
                content,
            };
        },
    },

    // --- Backup ---
    backup: {
        export: async (): Promise<Blob> => {
            const data = {
                projects: getLocalData(STORAGE_KEYS.PROJECTS, []),
                logs: getLocalData(STORAGE_KEYS.LOGS, []),
                notes: getLocalData(STORAGE_KEYS.NOTES, []),
                settings: {}, // Exclude settings completely to prevent masar_settings token leak
                snippets: getLocalData(STORAGE_KEYS.SNIPPETS, []),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            return blob;
        },
        import: async (file: File): Promise<{ success: boolean; message: string }> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target?.result as string);
                        if (data.projects) setLocalData(STORAGE_KEYS.PROJECTS, data.projects);
                        if (data.logs) setLocalData(STORAGE_KEYS.LOGS, data.logs);
                        if (data.notes) setLocalData(STORAGE_KEYS.NOTES, data.notes);
                        if (data.settings) {
                            delete data.settings.github_token;
                            delete data.settings.github_backup_token;
                            delete data.settings.githubToken;
                            setLocalData(STORAGE_KEYS.SETTINGS, data.settings);
                        }
                        if (data.snippets) setLocalData(STORAGE_KEYS.SNIPPETS, data.snippets);
                        enqueueSyncOperation({ entity: 'backup', action: 'import', payload: { source: 'file' } });
                        if (isOnline()) void api.sync.processQueue();
                        resolve({ success: true, message: 'Data imported successfully' });
                    } catch (err) {
                        reject(new Error('Invalid backup file format'));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
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

interface GitHubIssueResponse {
    number: number;
    title: string;
    html_url: string;
    state: 'open' | 'closed';
}
