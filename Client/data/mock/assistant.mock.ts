import { Task, RevisionRequest, ActivityItem, DeadlineItem } from '@/types/assistant';

export const TASKS: Task[] = [
  {
    id: 't1',
    title: 'Background Drawing',
    series: 'Blue Moon',
    chapter: 'Ch.12 Page 05',
    annotationType: 'Background',
    priority: 'High',
    deadline: 'Today',
    status: 'In Progress',
    action: 'Continue',
    color: 'bg-indigo-500',
  },
  {
    id: 't2',
    title: 'Character Shading',
    series: 'Blue Moon',
    chapter: 'Ch.12 Page 08',
    annotationType: 'Shading',
    priority: 'Medium',
    deadline: 'Tomorrow',
    status: 'Submitted',
    action: 'View',
    color: 'bg-emerald-500',
  },
  {
    id: 't3',
    title: 'Speed Effect',
    series: 'Re:Birth',
    chapter: 'Ch.03 Page 10',
    annotationType: 'Effect',
    priority: 'Urgent',
    deadline: 'Overdue',
    deadlineOverdue: true,
    status: 'Revision Required',
    action: 'Fix Now',
    color: 'bg-rose-500',
  },
  {
    id: 't4',
    title: 'Screen Tone Fill',
    series: 'Kaze no Tsubasa',
    chapter: 'Ch.07 Page 02',
    annotationType: 'Screentone',
    priority: 'Medium',
    deadline: 'Jun 22',
    status: 'Pending',
    action: 'Review',
    color: 'bg-amber-500',
  },
  {
    id: 't5',
    title: 'Panel Border Inking',
    series: 'Blue Moon',
    chapter: 'Ch.12 Page 11',
    annotationType: 'Inking',
    priority: 'Low',
    deadline: 'Jun 25',
    status: 'Pending',
    action: 'Review',
    color: 'bg-slate-400',
  },
];

export const REVISIONS: RevisionRequest[] = [
  {
    id: 'r1',
    taskTitle: 'Speed Effect',
    series: 'Re:Birth',
    chapter: 'Ch.03 Page 10',
    feedback:
      'The motion lines are too thick in the upper-left zone. Please reduce stroke weight to ~1.5px and extend the focal point lines 15% longer. Reference attached.',
    newDeadline: 'Jun 19, 2026 · 18:00',
    mangaka: 'Akira Sato',
    severity: 'High',
  },
  {
    id: 'r2',
    taskTitle: 'Background Drawing',
    series: 'Blue Moon',
    chapter: 'Ch.11 Page 03',
    feedback:
      'The building perspective in panel 2 is slightly off. Please re-align to the vanishing point as marked in the overlay file.',
    newDeadline: 'Jun 21, 2026 · 12:00',
    mangaka: 'Hana Noda',
    severity: 'Medium',
  },
];

export const ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'approved', message: 'Mangaka approved your submission', time: '30 min ago', series: 'Ch.12 Page 03 · Blue Moon' },
  { id: 'a2', type: 'assigned', message: 'New task assigned to you', time: '2h ago', series: 'Panel Border Inking · Blue Moon' },
  { id: 'a3', type: 'revision', message: 'Revision requested by Akira Sato', time: '4h ago', series: 'Speed Effect · Re:Birth' },
  { id: 'a4', type: 'upload', message: 'Reference file uploaded by Mangaka', time: '1d ago', series: 'Ch.11 overlay.psd · Blue Moon' },
  { id: 'a5', type: 'approved', message: 'Tantou Editor approved batch #4', time: '2d ago', series: '6 pages approved' },
];

export const DEADLINES: DeadlineItem[] = [
  { task: 'Speed Effect fix', series: 'Re:Birth', due: 'Today 18:00', urgent: true },
  { task: 'Background Drawing', series: 'Blue Moon', due: 'Today 23:59', urgent: true },
  { task: 'Character Shading', series: 'Blue Moon', due: 'Tomorrow', urgent: false },
  { task: 'Screen Tone Fill', series: 'Kaze no Tsubasa', due: 'Jun 22', urgent: false },
];
