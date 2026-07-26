import { NotificationResponse, NotificationType } from '@/types/notification';

/**
 * Resolves a notification response to a type-safe relative route.
 * Prevents javascript: or external redirect vulnerabilities.
 */
export function resolveNotificationRoute(notification: NotificationResponse): string {
  // If the server provided a validated ActionUrl, verify it is relative
  if (notification.actionUrl) {
    const trimmed = notification.actionUrl.trim();
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
  }

  const { type, resourceId, resourceType } = notification;

  // Fallback if type is missing or unknown
  switch (type) {
    case NotificationType.TaskAssigned:
      return resourceId ? `/tasks?taskId=${resourceId}` : '/tasks';

    case NotificationType.TaskSubmitted:
    case NotificationType.TaskApproved:
      return resourceId ? `/tasks?taskId=${resourceId}` : '/tasks';

    case NotificationType.ChapterSubmittedForReview:
      return resourceId ? `/editorial?chapterId=${resourceId}` : '/editorial';

    case NotificationType.ChapterApproved:
    case NotificationType.ChapterRevisionRequested:
    case NotificationType.ChapterRejected:
      return resourceId ? `/series/chapters/${resourceId}` : '/series';

    case NotificationType.RankingCalculated:
      return resourceId ? `/board?tab=Rankings&issueId=${resourceId}` : '/board';

    case NotificationType.CancellationWarning:
    case NotificationType.CancellationWarningCreated:
      return resourceId ? `/series/${resourceId}` : '/board';

    case NotificationType.ProposalSubmitted:
      return resourceId ? `/board?tab=Proposals&seriesId=${resourceId}` : '/board';

    case NotificationType.ProposalApproved:
    case NotificationType.ProposalRejected:
    case NotificationType.SeriesCancelled:
    case NotificationType.SeriesHiatus:
      return resourceId ? `/series/${resourceId}` : '/series';

    default:
      return '/notifications';
  }
}
