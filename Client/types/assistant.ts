// Assistant domain types

export type ActiveNav =
  | 'Dashboard'
  | 'My Tasks'
  | 'Assigned Pages'
  | 'Submissions'
  | 'Revision Requests'
  | 'Files & Assets'
  | 'Earnings'
  | 'Notifications'
  | 'Settings';

export type TaskStatus =
  | 'In Progress'
  | 'Submitted'
  | 'Revision Required'
  | 'Approved'
  | 'Pending';

export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TaskAction = 'Continue' | 'View' | 'Fix Now' | 'Review';

export interface Task {
  id: string;
  title: string;
  series: string;
  chapter: string;
  annotationType: string;
  priority: TaskPriority;
  deadline: string;
  deadlineOverdue?: boolean;
  status: TaskStatus;
  action: TaskAction;
  color: string;
}

export interface RevisionRequest {
  id: string;
  taskTitle: string;
  series: string;
  chapter: string;
  feedback: string;
  newDeadline: string;
  mangaka: string;
  severity: 'High' | 'Medium';
}

export interface ActivityItem {
  id: string;
  type: 'approved' | 'assigned' | 'revision' | 'upload';
  message: string;
  time: string;
  series?: string;
}

export interface DeadlineItem {
  task: string;
  series: string;
  due: string;
  urgent: boolean;
}
