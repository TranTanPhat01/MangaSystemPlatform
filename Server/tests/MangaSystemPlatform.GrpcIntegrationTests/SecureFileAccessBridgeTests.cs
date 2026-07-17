using FluentAssertions;
using Manga.File.Application.Abstractions;
using Manga.File.Application.Services;
using Manga.File.Domain.Entities;
using Manga.File.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Moq;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class SecureFileAccessBridgeTests
{
    [Fact]
    public async Task BusinessRelatedUser_CanReadMetadataThroughBridge_ButCannotDelete()
    {
        var userId = Guid.NewGuid();
        var file = CreateFile();
        var repository = new FakeFileAssetRepository(); repository.Add(file);
        var currentUser = new Mock<ICurrentUserService>(); currentUser.SetupGet(user => user.UserId).Returns(userId);
        var bridge = new Mock<IMangaFileAccessChecker>(); bridge.Setup(checker => checker.CanReadAsync(userId, file.Id, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var unitOfWork = new Mock<IFileUnitOfWork>();
        var service = new FileAssetService(repository, unitOfWork.Object, Mock.Of<IFileStorageService>(), currentUser.Object, Mock.Of<Manga.BuildingBlocks.Messaging.IEventBus>(), bridge.Object);

        (await service.GetByIdAsync(file.Id)).IsSuccess.Should().BeTrue();
        (await service.GetUrlAsync(file.Id)).IsSuccess.Should().BeTrue();
        (await service.DeleteAsync(file.Id)).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task UploaderAndAdmin_CanReadWithoutBridge()
    {
        var file = CreateFile();
        var repository = new FakeFileAssetRepository(); repository.Add(file);
        var uploader = new Mock<ICurrentUserService>(); uploader.SetupGet(user => user.UserId).Returns(file.UploadedByUserId);
        var service = new FileAssetService(repository, Mock.Of<IFileUnitOfWork>(), Mock.Of<IFileStorageService>(), uploader.Object, Mock.Of<Manga.BuildingBlocks.Messaging.IEventBus>());
        (await service.GetByIdAsync(file.Id)).IsSuccess.Should().BeTrue();

        var admin = new Mock<ICurrentUserService>(); admin.SetupGet(user => user.UserId).Returns(Guid.NewGuid()); admin.Setup(user => user.IsInRole("Admin")).Returns(true);
        var adminService = new FileAssetService(repository, Mock.Of<IFileUnitOfWork>(), Mock.Of<IFileStorageService>(), admin.Object, Mock.Of<Manga.BuildingBlocks.Messaging.IEventBus>());
        (await adminService.GetByIdAsync(file.Id)).IsSuccess.Should().BeTrue();
    }

    private static FileAsset CreateFile() => new() { Id = Guid.NewGuid(), OriginalFileName = "asset.png", StoredFileName = "asset.png", ContentType = "image/png", Extension = ".png", SizeInBytes = 1, StoragePath = "asset.png", UploadedByUserId = Guid.NewGuid(), FileCategory = FileCategory.MangaPage, Status = FileStatus.Active };
}
