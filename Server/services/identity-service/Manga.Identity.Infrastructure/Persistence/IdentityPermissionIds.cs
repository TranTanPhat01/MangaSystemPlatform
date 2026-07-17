namespace Manga.Identity.Infrastructure.Persistence;

public static class IdentityPermissionIds
{
    public static readonly Guid AdminUserRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de301");
    public static readonly Guid AdminUserManage = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de302");
    public static readonly Guid AdminUserCreate = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de321");
    public static readonly Guid AdminUserUpdate = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de322");
    public static readonly Guid AdminUserDelete = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de323");
    public static readonly Guid AdminUserResetPassword = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de324");
    public static readonly Guid AdminUserSessionRevoke = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de325");
    public static readonly Guid AdminRoleRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de303");
    public static readonly Guid AdminRoleManage = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de326");
    public static readonly Guid AdminRolePermissionManage = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de327");
    public static readonly Guid AdminMonitoringRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de304");
    public static readonly Guid AdminOutboxRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de305");
    public static readonly Guid AdminOutboxRetry = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de306");
    public static readonly Guid AdminAuditRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de307");
    public static readonly Guid AdminSystemSettingsRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de308");
    public static readonly Guid SeriesCreate = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de309");
    public static readonly Guid SeriesManageOwn = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de310");
    public static readonly Guid PageUpload = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de311");
    public static readonly Guid TaskReadAssigned = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de312");
    public static readonly Guid TaskSubmit = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de313");
    public static readonly Guid EditorialReviewRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de314");
    public static readonly Guid EditorialReviewManage = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de315");
    public static readonly Guid BoardProposalRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de316");
    public static readonly Guid BoardProposalVote = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de317");
    public static readonly Guid BoardRankingRead = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de318");
    public static readonly Guid FileReadOwnOrAssigned = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de319");
    public static readonly Guid NotificationReadOwn = Guid.Parse("b04211be-dc6a-4b5a-a1e7-28308a7de320");
}
