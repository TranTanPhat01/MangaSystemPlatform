import { TaskItem } from '@/components/mangaka/TaskTable';

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    taskName: 'Background drawing',
    page: 'P05',
    assistant: 'Hana',
    status: 'Submitted',
    priority: 'High',
    deadline: 'Today',
    actionText: 'Review',
  },
  {
    id: 'task-2',
    taskName: 'Character shading',
    page: 'P08',
    assistant: 'Kenji',
    status: 'In Progress',
    priority: 'Medium',
    deadline: 'Tomorrow',
    actionText: 'Open',
  },
  {
    id: 'task-3',
    taskName: 'Speed effect',
    page: 'P10',
    assistant: 'Mina',
    status: 'Revision Required',
    priority: 'Urgent',
    deadline: 'Overdue',
    actionText: 'Review',
  },
  {
    id: 'task-4',
    taskName: 'Foreground Inking',
    page: 'P03',
    assistant: 'Hana',
    status: 'Approved',
    priority: 'Medium',
    deadline: '3 days ago',
    actionText: 'Open',
  },
  {
    id: 'task-5',
    taskName: 'Screentone clean',
    page: 'P04',
    assistant: 'Mina',
    status: 'Approved',
    priority: 'Low',
    deadline: '4 days ago',
    actionText: 'Open',
  }
];

export const DEADLINES = [
  {
    id: 'dl-1',
    title: 'Chapter 12',
    subtitle: 'Final Editorial Draft Submission',
    dueText: '2 days left',
    isUrgent: false,
  },
  {
    id: 'dl-2',
    title: 'Page 08 shading',
    subtitle: 'Kenji - Assist task delivery',
    dueText: 'Due today',
    isUrgent: true,
  },
  {
    id: 'dl-3',
    title: 'Background P05',
    subtitle: 'Hana - Draft revision submission',
    dueText: 'Due tomorrow',
    isUrgent: false,
  },
  {
    id: 'dl-4',
    title: 'Chapter 13 outline',
    subtitle: 'Initial plot storyboard review',
    dueText: '6 days left',
    isUrgent: false,
  },
];

export const CHAPTERS = [
  { ch: 'Chapter 12', title: 'The Broken Gate', status: 'In Production (78%)', date: 'Jul 15, 2026', pages: '14/18', badge: 'bg-amber-50 text-amber-700 border-amber-200/80' },
  { ch: 'Chapter 11', title: 'The Whispering Shadows', status: 'Revision Required', date: 'Jul 08, 2026', pages: '18/18', badge: 'bg-burgundy-50 text-burgundy-700 border-burgundy-200/80' },
  { ch: 'Chapter 10', title: 'Across the Abyss', status: 'Approved', date: 'Jul 01, 2026', pages: '18/18', badge: 'bg-emerald-50 text-emerald-700 border-emerald-250' },
  { ch: 'Chapter 09', title: 'Storm Warning', status: 'Published', date: 'Jun 24, 2026', pages: '20/20', badge: 'bg-slate-100 text-slate-655 border-slate-200' }
];

export const FILES = [
  { name: 'Blue_Moon_C12_P01.clip', type: 'Clip Paint File', size: '48 MB', date: '3 hours ago' },
  { name: 'Character_Concept_Hana.png', type: 'Design Sketch Image', size: '4.2 MB', date: '2 days ago' },
  { name: 'Shading_Brush_Custom.sut', type: 'Sub Tool Asset', size: '150 KB', date: '1 week ago' },
  { name: 'Chapter12_Outline.docx', type: 'Word Document', size: '1.2 MB', date: '5 days ago' },
  { name: 'CrimsonDays_C24_P15.psd', type: 'Photoshop Document', size: '84 MB', date: '1 day ago' },
  { name: 'Panel_Layout_Grid.png', type: 'Layout Template', size: '890 KB', date: '2 weeks ago' },
];

export const RANKING_BOARD = [
  { title: 'Blue Moon', rank: '#4', trend: 'up', class: 'text-emerald-600 bg-emerald-50' },
  { title: 'Silent Wind', rank: '#7', trend: 'up', class: 'text-emerald-600 bg-emerald-50' },
  { title: 'Twilight Hunt', rank: '#11', trend: 'neutral', class: 'text-slate-500 bg-slate-50' },
  { title: 'Crimson Days', rank: '#18', trend: 'down', class: 'text-red-600 bg-red-50' }
];

export const NOTIFICATIONS = [
  { title: 'Assistant Kenji sent Page 08 character shading', type: 'Task Submitted', time: '1 hour ago', unread: true },
  { title: 'Editor Sato requested changes on Chapter 11 dialogue layout', type: 'Editorial Review', time: '3 hours ago', unread: true },
  { title: 'Assistant Hana completed Background drawing for Page 05', type: 'Task Submitted', time: '5 hours ago', unread: false },
  { title: 'Monthly Publishing Rankings calculated: Crimson Days dropped 5 positions', type: 'System Alert', time: '1 day ago', unread: false },
  { title: 'Blue Moon Chapter 10 approved for publishing export', type: 'System Notification', time: '2 days ago', unread: false }
];
