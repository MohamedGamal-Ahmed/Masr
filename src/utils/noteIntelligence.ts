import { Note } from '@/types';

const BUG_KEYWORDS = [
  'bug', 'error', 'issue', 'crash', 'broken', 'fix', 'failed', 'regression',
  'خطأ', 'مشكلة', 'عطل', 'لا يعمل', 'فشل'
];

const IDEA_KEYWORDS = [
  'idea', 'feature', 'enhancement', 'improve', 'proposal', 'explore',
  'فكرة', 'ميزة', 'تحسين', 'اقتراح'
];

const TODO_KEYWORDS = [
  'todo', 'task', 'refactor', 'cleanup', 'later', 'follow up', 'next',
  'مهمة', 'لاحقا', 'متابعة', 'ترتيب'
];

const includesAny = (text: string, keywords: string[]): boolean =>
  keywords.some(keyword => text.includes(keyword));

export const classifyNoteType = (input: { title?: string; content: string }): Note['type'] => {
  const text = `${input.title || ''}\n${input.content || ''}`.toLowerCase();

  if (includesAny(text, BUG_KEYWORDS)) return 'bug';
  if (includesAny(text, TODO_KEYWORDS)) return 'todo';
  if (includesAny(text, IDEA_KEYWORDS)) return 'idea';

  // Fallback heuristic
  if (text.includes('?')) return 'idea';
  return 'todo';
};

export interface PriorityResult {
  score: number;
  level: 'high' | 'medium' | 'low';
}

export const computeNotePriority = (note: Note, now = Date.now()): PriorityResult => {
  const createdAt = new Date(note.date).getTime();
  const ageDays = Math.max(0, Math.floor((now - createdAt) / (24 * 60 * 60 * 1000)));

  let score = 0;
  score += Math.min(ageDays * 2, 30);

  if (note.type === 'bug') score += 28;
  if (note.type === 'todo') score += 18;
  if (note.type === 'idea') score += 12;

  if (note.status === 'pending') score += 20;
  if (note.status === 'in_progress') score += 8;
  if (note.status === 'completed') score -= 100;

  if (note.reminder) score += 5;

  const normalized = Math.max(0, Math.min(score, 100));
  if (normalized >= 70) return { score: normalized, level: 'high' };
  if (normalized >= 40) return { score: normalized, level: 'medium' };
  return { score: normalized, level: 'low' };
};
