export enum NotificationType {
  TaskAssigned = 1,
  TaskSubmitted = 2,
  TaskApproved = 3,
  ChapterSubmittedForReview = 4,
  ChapterApproved = 5,
  RankingCalculated = 6,
  CancellationWarning = 7,
  FileUploaded = 8,
  System = 9,
}

export enum NotificationStatus {
  Unread = 1,
  Read = 2,
}

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  sourceEventType?: string;
  sourceEventId?: string;
  createdAt: string;
  readAt?: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
