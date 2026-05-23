namespace Manga.Notification.Domain.Enums;

public enum NotificationType
{
    TaskAssigned = 1,
    TaskSubmitted = 2,
    TaskApproved = 3,
    ChapterSubmittedForReview = 4,
    ChapterApproved = 5,
    RankingCalculated = 6,
    CancellationWarning = 7,
    FileUploaded = 8,
    System = 9
}
