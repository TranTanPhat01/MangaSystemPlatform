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
  ChapterRevisionRequested = 10,
  ChapterRejected = 11,
  ReaderChapterPublished = 12,
  ProposalSubmitted = 13,
  ProposalApproved = 14,
  ProposalRejected = 15,
  CancellationWarningCreated = 16,
  SeriesCancelled = 17,
  SeriesHiatus = 18,
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
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
