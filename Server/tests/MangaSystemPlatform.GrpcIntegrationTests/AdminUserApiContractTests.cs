using System.Reflection;
using FluentAssertions;
using Manga.BuildingBlocks.Authorization;
using Manga.Identity.Api.Controllers;
using Manga.Identity.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class AdminUserApiContractTests
{
    [Fact]
    public void AdminUserList_RequiresAdminUserReadPermission()
    {
        GetAuthorizePolicy(nameof(AdminUsersController.GetUsers)).Should().Be(PermissionPolicies.RequireAdminUserRead);
    }

    [Fact]
    public void RoleCatalog_RequiresAdminRoleReadPermission()
    {
        GetAuthorizePolicy(nameof(AdminUsersController.GetRoles)).Should().Be(PermissionPolicies.RequireAdminRoleRead);
    }

    [Fact]
    public void AdminRoutes_AreExposedUnderIdentityAdminOnly()
    {
        typeof(AdminUsersController).GetCustomAttribute<RouteAttribute>()!.Template.Should().Be("identity/admin");
        typeof(AdminUsersController).GetMethod(nameof(AdminUsersController.GetUsers))!
            .GetCustomAttribute<HttpGetAttribute>()!.Template.Should().Be("users");
    }

    [Fact]
    public void PublicAdminUserDtos_DoNotExposeSensitiveCredentialFields()
    {
        var names = typeof(AdminUserDetailResponse).GetProperties().Select(property => property.Name).ToArray();
        names.Should().NotContain(new[] { "PasswordHash", "RefreshToken", "Secret" });
    }

    [Fact]
    public void PagingContract_HasBoundedDefaultValues()
    {
        var query = new AdminUserListQuery();
        query.Page.Should().Be(1);
        query.PageSize.Should().Be(20);
    }

    private static string? GetAuthorizePolicy(string methodName) =>
        typeof(AdminUsersController).GetMethod(methodName)!.GetCustomAttribute<AuthorizeAttribute>()!.Policy;
}
