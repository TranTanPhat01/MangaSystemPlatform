using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Manga.File.Application.Abstractions;
using Manga.File.Application.DTOs;
using Manga.File.Application.Services;
using Manga.File.Domain.Entities;
using Manga.File.Domain.Enums;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.File.Infrastructure.DependencyInjection;
using Manga.File.Infrastructure.Services;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class StorageProviderTests
{
    [Fact]
    public void DI_WithLocalStorageProvider_ResolvesLocalFileStorageService()
    {
        // Arrange
        var inMemorySettings = new Dictionary<string, string>
        {
            { "Storage:Provider", "Local" },
            { "ConnectionStrings:FileDb", "Host=localhost;Database=MangaFileDb;Username=postgres;Password=postgres" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings!)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging(builder => builder.AddConsole());
        services.AddFileInfrastructure(configuration);

        // Act
        using var provider = services.BuildServiceProvider();
        var storageService = provider.GetRequiredService<IFileStorageService>();

        // Assert
        storageService.Should().BeOfType<LocalFileStorageService>();
        storageService.Provider.Should().Be(StorageProvider.Local);
    }

    [Fact]
    public void DI_WithMinioStorageProvider_ResolvesMinioFileStorageService()
    {
        // Arrange
        var inMemorySettings = new Dictionary<string, string>
        {
            { "Storage:Provider", "Minio" },
            { "Storage:Minio:Endpoint", "localhost:9000" },
            { "Storage:Minio:AccessKey", "minioadmin" },
            { "Storage:Minio:SecretKey", "minioadmin" },
            { "Storage:Minio:Bucket", "manga-files" },
            { "ConnectionStrings:FileDb", "Host=localhost;Database=MangaFileDb;Username=postgres;Password=postgres" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings!)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging(builder => builder.AddConsole());
        services.AddFileInfrastructure(configuration);

        // Act
        using var provider = services.BuildServiceProvider();
        var storageService = provider.GetRequiredService<IFileStorageService>();

        // Assert
        storageService.Should().BeOfType<MinioFileStorageService>();
        storageService.Provider.Should().Be(StorageProvider.MinIO);
    }

    [Fact]
    public async Task UploadAsync_WithSuccessfulStorageSave_PublishesFileUploadedEvent()
    {
        // Arrange
        var repositoryMock = new Mock<IFileAssetRepository>();
        var unitOfWorkMock = new Mock<IFileUnitOfWork>();
        var storageMock = new Mock<IFileStorageService>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var eventBusMock = new Mock<IEventBus>();

        var userId = Guid.NewGuid();
        currentUserMock.Setup(x => x.UserId).Returns(userId);

        var storedFile = new StoredFileInfo
        {
            StoredFileName = "test-stored.png",
            StoragePath = "test-stored.png",
            PublicUrl = "/files/static/test-stored.png",
            SizeInBytes = 100
        };

        storageMock.Setup(x => x.Provider).Returns(StorageProvider.MinIO);
        storageMock.Setup(x => x.SaveAsync(
            It.IsAny<Stream>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<long>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manga.File.Application.Common.Result<StoredFileInfo>.Success(storedFile));

        var fileAssetService = new FileAssetService(
            repositoryMock.Object,
            unitOfWorkMock.Object,
            storageMock.Object,
            currentUserMock.Object,
            eventBusMock.Object);

        var fileStream = new MemoryStream(new byte[] { 1, 2, 3 });

        // Act
        var result = await fileAssetService.UploadAsync(
            fileStream,
            "test.png",
            "image/png",
            3,
            FileCategory.MangaPage,
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        repositoryMock.Verify(x => x.AddAsync(It.IsAny<FileAsset>(), It.IsAny<CancellationToken>()), Times.Once);
        unitOfWorkMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        eventBusMock.Verify(x => x.PublishAsync(
            It.Is<FileUploadedEvent>(e => e.OriginalFileName == "test.png" && e.UploadedByUserId == userId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadAsync_WithFailedStorageSave_DoesNotPublishFileUploadedEvent()
    {
        // Arrange
        var repositoryMock = new Mock<IFileAssetRepository>();
        var unitOfWorkMock = new Mock<IFileUnitOfWork>();
        var storageMock = new Mock<IFileStorageService>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var eventBusMock = new Mock<IEventBus>();

        storageMock.Setup(x => x.SaveAsync(
            It.IsAny<Stream>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<long>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(Manga.File.Application.Common.Result<StoredFileInfo>.Failure("Storage full"));

        var fileAssetService = new FileAssetService(
            repositoryMock.Object,
            unitOfWorkMock.Object,
            storageMock.Object,
            currentUserMock.Object,
            eventBusMock.Object);

        var fileStream = new MemoryStream(new byte[] { 1, 2, 3 });

        // Act
        var result = await fileAssetService.UploadAsync(
            fileStream,
            "test.png",
            "image/png",
            3,
            FileCategory.MangaPage,
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Storage full");
        repositoryMock.Verify(x => x.AddAsync(It.IsAny<FileAsset>(), It.IsAny<CancellationToken>()), Times.Never);
        unitOfWorkMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        eventBusMock.Verify(x => x.PublishAsync(It.IsAny<FileUploadedEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
