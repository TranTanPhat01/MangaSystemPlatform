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
    System = 9,
    ChapterRevisionRequested = 10,
    ChapterRejected = 11,
    ReaderChapterPublished = 12,
    ProposalSubmitted = 13,
    ProposalApproved = 14,
    ProposalRejected = 15,
    CancellationWarningCreated = 16,
    SeriesCancelled = 17,
    SeriesHiatus = 18
}
