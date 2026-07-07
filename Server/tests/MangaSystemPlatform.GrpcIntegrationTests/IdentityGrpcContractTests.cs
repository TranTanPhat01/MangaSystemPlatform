using FluentAssertions;
using Grpc.Core;
using Manga.Contracts.Identity.V1;
using Manga.Identity.Api.GrpcServices;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Domain.Entities;
using Manga.Identity.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Microsoft.Extensions.DependencyInjection;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class IdentityGrpcContractTests
{
    [Fact]
    public async Task CheckUserExists_WithActiveUser_ReturnsExistsAndActive()
    {
        var user = CreateUser("assistant@manga.local", UserStatus.Active, "Assistant");
        using var host = CreateHost(user);
        var client = host.CreateClient(channel => new IdentityGrpcService.IdentityGrpcServiceClient(channel));

        var response = await client.CheckUserExistsAsync(
            new CheckUserExistsRequest { UserId = user.Id.ToString() },
            GrpcTestHost.ValidMetadata());

        response.Exists.Should().BeTrue();
        response.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CheckUserExists_WithMissingOrInvalidUser_ReturnsFalse()
    {
        using var host = CreateHost();
        var client = host.CreateClient(channel => new IdentityGrpcService.IdentityGrpcServiceClient(channel));

        var missing = await client.CheckUserExistsAsync(
            new CheckUserExistsRequest { UserId = Guid.NewGuid().ToString() },
            GrpcTestHost.ValidMetadata());
        var invalid = await client.CheckUserExistsAsync(
            new CheckUserExistsRequest { UserId = "not-a-guid" },
            GrpcTestHost.ValidMetadata());

        missing.Exists.Should().BeFalse();
        invalid.Exists.Should().BeFalse();
    }

    [Fact]
    public async Task GetUserSummary_WithActiveUser_ReturnsProfileAndRoles()
    {
        var user = CreateUser("assistant@manga.local", UserStatus.Active, "Assistant", "Reader");
        using var host = CreateHost(user);
        var client = host.CreateClient(channel => new IdentityGrpcService.IdentityGrpcServiceClient(channel));

        var response = await client.GetUserSummaryAsync(
            new GetUserSummaryRequest { UserId = user.Id.ToString() },
            GrpcTestHost.ValidMetadata());

        response.UserId.Should().Be(user.Id.ToString());
        response.Email.Should().Be(user.Email);
        response.DisplayName.Should().Be(user.FullName);
        response.Roles.Should().Contain(new[] { "Assistant", "Reader" });
        response.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CheckUserRole_ReturnsExpectedRoleStatus()
    {
        var assistant = CreateUser("assistant@manga.local", UserStatus.Active, "Assistant");
        var reader = CreateUser("reader@manga.local", UserStatus.Active, "Reader");
        using var host = CreateHost(assistant, reader);
        var client = host.CreateClient(channel => new IdentityGrpcService.IdentityGrpcServiceClient(channel));

        var assistantResponse = await client.CheckUserRoleAsync(
            new CheckUserRoleRequest { UserId = assistant.Id.ToString(), Role = "Assistant" },
            GrpcTestHost.ValidMetadata());
        var readerResponse = await client.CheckUserRoleAsync(
            new CheckUserRoleRequest { UserId = reader.Id.ToString(), Role = "Assistant" },
            GrpcTestHost.ValidMetadata());

        assistantResponse.HasRole.Should().BeTrue();
        assistantResponse.IsActive.Should().BeTrue();
        readerResponse.HasRole.Should().BeFalse();
        readerResponse.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task Request_WithMissingOrWrongApiKey_ReturnsUnauthenticated()
    {
        using var host = CreateHost();
        var client = host.CreateClient(channel => new IdentityGrpcService.IdentityGrpcServiceClient(channel));

        var missing = async () => await client.CheckUserExistsAsync(new CheckUserExistsRequest { UserId = Guid.NewGuid().ToString() });
        var wrong = async () => await client.CheckUserExistsAsync(
            new CheckUserExistsRequest { UserId = Guid.NewGuid().ToString() },
            GrpcTestHost.WrongMetadata());

        (await missing.Should().ThrowAsync<RpcException>()).Which.StatusCode.Should().Be(StatusCode.Unauthenticated);
        (await wrong.Should().ThrowAsync<RpcException>()).Which.StatusCode.Should().Be(StatusCode.Unauthenticated);
    }

    private static GrpcTestHost CreateHost(params User[] users)
    {
        var repository = new FakeUserRepository();
        foreach (var user in users)
        {
            repository.Add(user);
        }

        return new GrpcTestHost(
            services => services.AddSingleton<IUserRepository>(repository),
            endpoints => endpoints.MapGrpcService<IdentityGrpcServiceImpl>());
    }

    private static User CreateUser(string email, UserStatus status, params string[] roles)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = email.Split('@')[0],
            Status = status
        };

        foreach (var roleName in roles)
        {
            var role = new Role
            {
                Id = Guid.NewGuid(),
                Name = roleName
            };

            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                User = user,
                RoleId = role.Id,
                Role = role
            });
        }

        return user;
    }
}
