using System.Reflection;
using FluentAssertions;
using Manga.BuildingBlocks.Authorization;
using Manga.Identity.Api.Controllers;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Validation;
using Manga.Identity.Domain.Entities;
using Manga.Identity.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class IdentityAdminLifecycleContractTests
{
    [Theory]
    [InlineData(nameof(AdminUsersController.Create), PermissionPolicies.RequireAdminUserCreate)]
    [InlineData(nameof(AdminUsersController.Update), PermissionPolicies.RequireAdminUserUpdate)]
    [InlineData(nameof(AdminUsersController.Delete), PermissionPolicies.RequireAdminUserDelete)]
    [InlineData(nameof(AdminUsersController.ResetPassword), PermissionPolicies.RequireAdminUserResetPassword)]
    [InlineData(nameof(AdminUsersController.RevokeSessions), PermissionPolicies.RequireAdminUserSessionRevoke)]
    public void UserLifecycleEndpoints_RequireDedicatedPermission(string methodName, string policy) =>
        PolicyFor<AdminUsersController>(methodName).Should().Be(policy);

    [Theory]
    [InlineData(nameof(AdminRolesController.Create), PermissionPolicies.RequireAdminRoleManage)]
    [InlineData(nameof(AdminRolesController.Update), PermissionPolicies.RequireAdminRoleManage)]
    [InlineData(nameof(AdminRolesController.Retire), PermissionPolicies.RequireAdminRoleManage)]
    [InlineData(nameof(AdminRolesController.ReplacePermissions), PermissionPolicies.RequireAdminRolePermissionManage)]
    public void RoleMutationEndpoints_RequireDedicatedPermission(string methodName, string policy) =>
        PolicyFor<AdminRolesController>(methodName).Should().Be(policy);

    [Fact]
    public void AuditLogEndpoint_RequiresAuditReadPermission()
    {
        PolicyFor<AdminAuditLogsController>(nameof(AdminAuditLogsController.Get)).Should().Be(PermissionPolicies.RequireAdminAuditRead);
        typeof(AdminAuditLogsController).GetCustomAttribute<RouteAttribute>()!.Template.Should().Be("identity/admin/audit-logs");
    }

    [Fact]
    public void SoftDeletedLockedAndDisabledUsers_CannotAuthenticate()
    {
        var now = DateTime.UtcNow;
        new User { Status = UserStatus.Active, DeletedAt = now }.CanAuthenticate(now).Should().BeFalse();
        new User { Status = UserStatus.Locked }.CanAuthenticate(now).Should().BeFalse();
        new User { Status = UserStatus.Disabled }.CanAuthenticate(now).Should().BeFalse();
        new User { Status = UserStatus.Active, LockoutUntil = now.AddMinutes(1) }.CanAuthenticate(now).Should().BeFalse();
        new User { Status = UserStatus.Active, LockoutUntil = now.AddMinutes(-1) }.CanAuthenticate(now).Should().BeTrue();
    }

    [Fact]
    public void ManualLockAndTemporaryLockout_HaveDistinctAuthenticationSemantics()
    {
        var now = DateTime.UtcNow;
        var manuallyLocked = new User { Status = UserStatus.Locked };
        var expiredLegacyLockout = new User { Status = UserStatus.Locked, LockoutUntil = now.AddMinutes(-1) };

        manuallyLocked.GetAuthenticationFailureCategory(now).Should().Be("ManualLock");
        manuallyLocked.CanAuthenticate(now).Should().BeFalse();
        expiredLegacyLockout.CanAuthenticate(now).Should().BeTrue();
        expiredLegacyLockout.ClearExpiredTemporaryLockout(now).Should().BeTrue();
        expiredLegacyLockout.Status.Should().Be(UserStatus.Active);
        expiredLegacyLockout.LockoutUntil.Should().BeNull();
    }

    [Fact]
    public void CreateUserValidator_RejectsInvalidEmailUsernameAndPassword()
    {
        var result = new CreateAdminUserRequestValidator().Validate(new CreateAdminUserRequest { Email = "invalid", Username = "!", FullName = "", Password = "short" });
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void AuditQueryValidator_RequiresValidPageAndDateRange()
    {
        var result = new AdminAuditLogQueryValidator().Validate(new AdminAuditLogQuery { Page = 0, PageSize = 101, From = DateTime.UtcNow, To = DateTime.UtcNow.AddDays(-1) });
        result.IsValid.Should().BeFalse();
    }

    private static string? PolicyFor<TController>(string methodName) where TController : ControllerBase =>
        typeof(TController).GetMethod(methodName)!.GetCustomAttribute<AuthorizeAttribute>()!.Policy;
}
