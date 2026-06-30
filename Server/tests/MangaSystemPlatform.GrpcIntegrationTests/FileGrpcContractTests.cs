using FluentAssertions;
using Grpc.Core;
using Manga.Contracts.File.V1;
using Manga.File.Api.GrpcServices;
using Manga.File.Application.Abstractions;
using Manga.File.Domain.Entities;
using Manga.File.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Microsoft.Extensions.DependencyInjection;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class FileGrpcContractTests
{
    [Fact]
    public async Task FileExists_WithActiveFile_ReturnsExists()
    {
        var file = CreateFile();
        using var host = CreateHost(file);
        var client = host.CreateClient(channel => new FileGrpcService.FileGrpcServiceClient(channel));

        var response = await client.FileExistsAsync(
            new FileExistsRequest { FileId = file.Id.ToString() },
            GrpcTestHost.ValidMetadata());

        response.Exists.Should().BeTrue();
        response.Category.Should().Be(file.FileCategory.ToString());
        response.ContentType.Should().Be(file.ContentType);
    }

    [Fact]
    public async Task FileExists_WithMissingFile_ReturnsFalse()
    {
        using var host = CreateHost();
        var client = host.CreateClient(channel => new FileGrpcService.FileGrpcServiceClient(channel));

        var response = await client.FileExistsAsync(
            new FileExistsRequest { FileId = Guid.NewGuid().ToString() },
            GrpcTestHost.ValidMetadata());

        response.Exists.Should().BeFalse();
    }

    [Fact]
    public async Task GetFileMetadata_WithActiveFile_ReturnsPublicMetadataOnly()
    {
        var file = CreateFile();
        using var host = CreateHost(file);
        var client = host.CreateClient(channel => new FileGrpcService.FileGrpcServiceClient(channel));

        var response = await client.GetFileMetadataAsync(
            new GetFileMetadataRequest { FileId = file.Id.ToString() },
            GrpcTestHost.ValidMetadata());

        response.FileId.Should().Be(file.Id.ToString());
        response.FileName.Should().Be(file.OriginalFileName);
        response.ContentType.Should().Be(file.ContentType);
        response.Size.Should().Be(file.SizeInBytes);
        response.Category.Should().Be(file.FileCategory.ToString());
        response.Url.Should().Be(file.PublicUrl);
        response.ToString().Should().NotContain(file.StoragePath);
        response.ToString().Should().NotContain(file.StorageProvider.ToString());
    }

    [Fact]
    public async Task Request_WithWrongApiKey_ReturnsUnauthenticated()
    {
        using var host = CreateHost();
        var client = host.CreateClient(channel => new FileGrpcService.FileGrpcServiceClient(channel));

        var act = async () => await client.FileExistsAsync(
            new FileExistsRequest { FileId = Guid.NewGuid().ToString() },
            GrpcTestHost.WrongMetadata());

        (await act.Should().ThrowAsync<RpcException>()).Which.StatusCode.Should().Be(StatusCode.Unauthenticated);
    }

    private static GrpcTestHost CreateHost(params FileAsset[] files)
    {
        var repository = new FakeFileAssetRepository();
        foreach (var file in files)
        {
            repository.Add(file);
        }

        return new GrpcTestHost(
            services => services.AddSingleton<IFileAssetRepository>(repository),
            endpoints => endpoints.MapGrpcService<FileGrpcServiceImpl>());
    }

    private static FileAsset CreateFile() => new()
    {
        Id = Guid.NewGuid(),
        OriginalFileName = "page-001.png",
        StoredFileName = "internal-stored-file.png",
        ContentType = "image/png",
        Extension = ".png",
        SizeInBytes = 1024,
        StorageProvider = StorageProvider.Local,
        StoragePath = "storage/files/internal-stored-file.png",
        PublicUrl = "/files/static/page-001.png",
        UploadedByUserId = Guid.NewGuid(),
        FileCategory = FileCategory.MangaPage,
        Status = FileStatus.Active
    };
}
