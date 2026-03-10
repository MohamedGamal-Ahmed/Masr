import { Note } from '@/types';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  type: Note['type'];
  title: string;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'توثيق خطأ بسرعة مع خطوات إعادة الإنتاج',
    type: 'bug',
    title: 'Bug: ',
    content: [
      '## Problem',
      '- What happened?',
      '',
      '## Steps to Reproduce',
      '1. ',
      '2. ',
      '',
      '## Expected',
      '- ',
      '',
      '## Environment',
      '- Branch: ',
      '- Device: ',
    ].join('\n'),
  },
  {
    id: 'feature-idea',
    name: 'Feature Idea',
    description: 'فكرة ميزة جديدة مع قيمة واضحة للمستخدم',
    type: 'idea',
    title: 'Idea: ',
    content: [
      '## Idea',
      '- ',
      '',
      '## Why now?',
      '- ',
      '',
      '## Impact',
      '- User value:',
      '- Engineering effort:',
      '',
      '## Next step',
      '- ',
    ].join('\n'),
  },
  {
    id: 'refactor-task',
    name: 'Refactor Task',
    description: 'مهمة تحسين للكود مع نطاق واضح',
    type: 'todo',
    title: 'Refactor: ',
    content: [
      '## Area',
      '- File/module:',
      '',
      '## Current pain',
      '- ',
      '',
      '## Refactor plan',
      '- [ ] ',
      '- [ ] ',
      '',
      '## Definition of done',
      '- ',
    ].join('\n'),
  },
  {
    id: 'meeting-note',
    name: 'Meeting Note',
    description: 'تلخيص سريع لاجتماع أو مكالمة',
    type: 'todo',
    title: 'Meeting: ',
    content: [
      '## Context',
      '- ',
      '',
      '## Decisions',
      '- ',
      '',
      '## Action Items',
      '- [ ] ',
      '- [ ] ',
      '',
      '## Open Questions',
      '- ',
    ].join('\n'),
  },
];
