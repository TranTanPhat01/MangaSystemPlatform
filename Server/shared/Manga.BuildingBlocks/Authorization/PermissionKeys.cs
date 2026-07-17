namespace Manga.BuildingBlocks.Authorization;

public static class PermissionKeys
{
    public const string AdminUserRead = "ADMIN_USER_READ";
    public const string AdminUserManage = "ADMIN_USER_MANAGE";
    public const string AdminUserCreate = "ADMIN_USER_CREATE";
    public const string AdminUserUpdate = "ADMIN_USER_UPDATE";
    public const string AdminUserDelete = "ADMIN_USER_DELETE";
    public const string AdminUserResetPassword = "ADMIN_USER_RESET_PASSWORD";
    public const string AdminUserSessionRevoke = "ADMIN_USER_SESSION_REVOKE";
    public const string AdminRoleRead = "ADMIN_ROLE_READ";
    public const string AdminRoleManage = "ADMIN_ROLE_MANAGE";
    public const string AdminRolePermissionManage = "ADMIN_ROLE_PERMISSION_MANAGE";
    public const string AdminMonitoringRead = "ADMIN_MONITORING_READ";
    public const string AdminOutboxRead = "ADMIN_OUTBOX_READ";
    public const string AdminOutboxRetry = "ADMIN_OUTBOX_RETRY";
    public const string AdminAuditRead = "ADMIN_AUDIT_READ";
    public const string AdminSystemSettingsRead = "ADMIN_SYSTEM_SETTINGS_READ";

    public const string SeriesCreate = "SERIES_CREATE";
    public const string SeriesManageOwn = "SERIES_MANAGE_OWN";
    public const string PageUpload = "PAGE_UPLOAD";
    public const string TaskReadAssigned = "TASK_READ_ASSIGNED";
    public const string TaskSubmit = "TASK_SUBMIT";
    public const string EditorialReviewRead = "EDITORIAL_REVIEW_READ";
    public const string EditorialReviewManage = "EDITORIAL_REVIEW_MANAGE";
    public const string BoardProposalRead = "BOARD_PROPOSAL_READ";
    public const string BoardProposalVote = "BOARD_PROPOSAL_VOTE";
    public const string BoardRankingRead = "BOARD_RANKING_READ";
    public const string FileReadOwnOrAssigned = "FILE_READ_OWN_OR_ASSIGNED";
    public const string NotificationReadOwn = "NOTIFICATION_READ_OWN";

    public static readonly IReadOnlyCollection<string> All = new[]
    {
        AdminUserRead, AdminUserManage, AdminUserCreate, AdminUserUpdate, AdminUserDelete,
        AdminUserResetPassword, AdminUserSessionRevoke, AdminRoleRead, AdminRoleManage,
        AdminRolePermissionManage, AdminMonitoringRead, AdminOutboxRead,
        AdminOutboxRetry, AdminAuditRead, AdminSystemSettingsRead, SeriesCreate, SeriesManageOwn,
        PageUpload, TaskReadAssigned, TaskSubmit, EditorialReviewRead, EditorialReviewManage,
        BoardProposalRead, BoardProposalVote, BoardRankingRead, FileReadOwnOrAssigned,
        NotificationReadOwn
    };
}
