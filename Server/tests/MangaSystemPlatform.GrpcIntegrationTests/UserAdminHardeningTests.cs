using FluentAssertions;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Application.Services;
using Moq;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class UserAdminHardeningTests
{
    [Fact]
    public async Task CreateUser_RejectsUsernameThatDiffersOnlyByCase()
    {
        var users = new Mock<IUserRepository>();
        users.Setup(repository => repository.ExistsByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        users.Setup(repository => repository.ExistsByNormalizedUsernameAsync("MANGAKA01", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var service = new UserAdminService(
            users.Object,
            Mock.Of<IRoleRepository>(),
            Mock.Of<IAdminUserRepository>(),
            Mock.Of<IRefreshTokenRepository>(),
            Mock.Of<IAdminAuditRepository>(),
            Mock.Of<IIdentityUnitOfWork>(),
            Mock.Of<IPasswordHasher>());

        var result = await service.CreateUserAsync(new CreateAdminUserRequest
        {
            Email = "new.user@example.test",
            Username = "mangaka01",
            FullName = "New User",
            Password = "ValidPassword1!",
            Roles = new[] { "Mangaka" }
        }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Username already exists.");
        users.Verify(repository => repository.ExistsByNormalizedUsernameAsync("MANGAKA01", It.IsAny<CancellationToken>()), Times.Once);
    }
}
