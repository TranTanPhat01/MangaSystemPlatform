using FluentAssertions;
using Manga.Identity.Infrastructure.Services;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class PasswordHasherSafetyTests
{
    [Theory]
    [InlineData("")]
    [InlineData("not-a-password-hash")]
    [InlineData("100000.invalid-base64.invalid-base64")]
    public void VerifyPassword_ReturnsFalse_ForMalformedStoredHash(string storedHash)
    {
        var hasher = new PasswordHasher();

        hasher.VerifyPassword("any-password", storedHash).Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_UsesTheOriginalPassword()
    {
        var hasher = new PasswordHasher();
        var hash = hasher.HashPassword("correct-password");

        hasher.VerifyPassword("correct-password", hash).Should().BeTrue();
        hasher.VerifyPassword("wrong-password", hash).Should().BeFalse();
    }
}
