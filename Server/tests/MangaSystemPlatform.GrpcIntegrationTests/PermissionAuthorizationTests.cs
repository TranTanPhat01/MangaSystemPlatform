using System.Security.Claims;
using FluentAssertions;
using Manga.BuildingBlocks.Authorization;
using Manga.Identity.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class PermissionAuthorizationTests
{
    [Fact]
    public void Admin_HasUserReadPermission() =>
        IdentityPermissionCatalog.GetPermissionKeysForRole(IdentityRoleIds.Admin).Should().Contain(PermissionKeys.AdminUserRead);

    [Fact]
    public void Admin_HasMonitoringReadPermission() =>
        IdentityPermissionCatalog.GetPermissionKeysForRole(IdentityRoleIds.Admin).Should().Contain(PermissionKeys.AdminMonitoringRead);

    [Fact]
    public void Mangaka_DoesNotHaveAdminUserReadPermission() =>
        IdentityPermissionCatalog.GetPermissionKeysForRole(IdentityRoleIds.Mangaka).Should().NotContain(PermissionKeys.AdminUserRead);

    [Fact]
    public void Assistant_DoesNotHaveBoardProposalVotePermission() =>
        IdentityPermissionCatalog.GetPermissionKeysForRole(IdentityRoleIds.Assistant).Should().NotContain(PermissionKeys.BoardProposalVote);

    [Fact]
    public void EditorialBoard_HasBoardProposalVotePermission() =>
        IdentityPermissionCatalog.GetPermissionKeysForRole(IdentityRoleIds.EditorialBoard).Should().Contain(PermissionKeys.BoardProposalVote);

    [Fact]
    public async Task DisabledUser_IsNotAuthorizedEvenWhenPermissionClaimExists()
    {
        var authorized = await IsAuthorizedAsync(PermissionKeys.AdminUserRead, "Disabled", PermissionKeys.AdminUserRead);

        authorized.Should().BeFalse();
    }

    [Fact]
    public async Task Handler_UsesPermissionClaim_NotRoleName()
    {
        var roleOnlyAuthorized = await IsAuthorizedAsync(PermissionKeys.AdminUserRead, "Active", permission: null, role: "Admin");
        var permissionOnlyAuthorized = await IsAuthorizedAsync(PermissionKeys.AdminUserRead, "Active", PermissionKeys.AdminUserRead);

        roleOnlyAuthorized.Should().BeFalse();
        permissionOnlyAuthorized.Should().BeTrue();
    }

    private static async Task<bool> IsAuthorizedAsync(string requiredPermission, string status, string? permission, string? role = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new(PermissionClaimTypes.UserStatus, status)
        };
        if (permission is not null) claims.Add(new Claim(PermissionClaimTypes.Permission, permission));
        if (role is not null) claims.Add(new Claim(ClaimTypes.Role, role));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        var context = new AuthorizationHandlerContext(new[] { new PermissionRequirement(requiredPermission) }, principal, null);
        await new PermissionAuthorizationHandler().HandleAsync(context);
        return context.HasSucceeded;
    }
}
