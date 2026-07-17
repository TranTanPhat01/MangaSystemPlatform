using FluentAssertions;
using Manga.BuildingBlocks.Messaging;
using Manga.File.Infrastructure.Persistence;
using Manga.Editorial.Infrastructure.Persistence;
using Manga.Management.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using FileOutboxMigration = Manga.File.Infrastructure.Persistence.Migrations.AddOutboxMessages;
using EditorialOutboxMigration = Manga.Editorial.Infrastructure.Persistence.Migrations.AddOutboxMessages;
using MangaOutboxMigration = Manga.Management.Infrastructure.Persistence.Migrations.AddOutboxMessages;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class OutboxSchemaStartupTests
{
    [Theory]
    [InlineData(typeof(MangaManagementDbContext))]
    [InlineData(typeof(FileDbContext))]
    [InlineData(typeof(EditorialDbContext))]
    public void EachOutboxPublisherContext_ExposesOutboxMessageSet(Type contextType)
    {
        contextType.GetProperties()
            .Should()
            .Contain(property => property.PropertyType == typeof(DbSet<OutboxMessage>) && property.Name == "OutboxMessages");
    }

    [Theory]
    [InlineData(typeof(MangaOutboxMigration))]
    [InlineData(typeof(FileOutboxMigration))]
    [InlineData(typeof(EditorialOutboxMigration))]
    public void OutboxCreateMigration_HasStableEfMigrationId(Type migrationType)
    {
        migrationType.GetCustomAttributes(typeof(MigrationAttribute), inherit: false)
            .Cast<MigrationAttribute>()
            .Single()
            .Id.Should().Be("20260713000000_AddOutboxMessages");
        migrationType.GetCustomAttributes(typeof(DbContextAttribute), inherit: false)
            .Cast<DbContextAttribute>()
            .Should()
            .ContainSingle();
    }

    [Theory]
    [InlineData("services/manga-service/Manga.Management.Infrastructure/Persistence/Migrations/20260713000000_AddOutboxMessages.cs", "services/manga-service/Manga.Management.Infrastructure/Persistence/Migrations/20260714062616_AddOutboxMessagesRuntimeFix.cs")]
    [InlineData("services/file-service/Manga.File.Infrastructure/Persistence/Migrations/20260713000000_AddOutboxMessages.cs", "services/file-service/Manga.File.Infrastructure/Persistence/Migrations/20260714062820_AddOutboxMessagesRuntimeFix.cs")]
    [InlineData("services/editorial-service/Manga.Editorial.Infrastructure/Persistence/Migrations/20260713000000_AddOutboxMessages.cs", "services/editorial-service/Manga.Editorial.Infrastructure/Persistence/Migrations/20260714062653_AddOutboxMessagesRuntimeFix.cs")]
    public void OutboxMigrationChain_CreatesTableExactlyOnce(string createMigration, string noOpMigration)
    {
        ReadFromSolution(createMigration).Should().Contain("CreateTable");
        ReadFromSolution(noOpMigration).Should().NotContain("CreateTable");
    }

    [Theory]
    [InlineData("services/manga-service/Manga.Management.Api/Program.cs")]
    [InlineData("services/file-service/Manga.File.Api/Program.cs")]
    [InlineData("services/editorial-service/Manga.Editorial.Api/Program.cs")]
    public void ApiStartup_MigratesDatabaseBeforeApplicationRuns(string programFile)
    {
        var program = ReadFromSolution(programFile);
        program.IndexOf("await MigrateDatabaseAsync", StringComparison.Ordinal)
            .Should()
            .BeLessThan(program.IndexOf("app.Run();", StringComparison.Ordinal));
        program.Should().Contain("Database.MigrateAsync");
    }

    private static string ReadFromSolution(string relativePath)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "MangaSystemPlatform.Server.sln")))
        {
            directory = directory.Parent;
        }

        return File.ReadAllText(Path.Combine(directory!.FullName, relativePath.Replace('/', Path.DirectorySeparatorChar)));
    }
}
