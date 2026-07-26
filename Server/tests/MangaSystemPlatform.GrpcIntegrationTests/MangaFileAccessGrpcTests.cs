using FluentAssertions;
using Manga.Contracts.Management.V1;
using Manga.Management.Api.GrpcServices;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Microsoft.Extensions.DependencyInjection;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class MangaFileAccessGrpcTests
{
    [Fact]
    public async Task AssignedAssistant_CanReadPageFile_ButUnassignedUserCannot()
    {
        var assistantId = Guid.NewGuid();
        var fileId = Guid.NewGuid();
        using var host = CreateHost(CreateGraph(fileId, assistantId, out _, out _));
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var allowed = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = assistantId.ToString(), FileId = fileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());
        var denied = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = Guid.NewGuid().ToString(), FileId = fileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());

        allowed.Allowed.Should().BeTrue();
        denied.Allowed.Should().BeFalse();
    }

    [Fact]
    public async Task SeriesOwner_CanReadAssistantSubmissionFile_ButUnrelatedMangakaCannot()
    {
        var assistantId = Guid.NewGuid();
        var submissionFileId = Guid.NewGuid();
        var repository = CreateGraph(Guid.NewGuid(), assistantId, out var ownerId, out var taskId);
        repository.Seed(Guid.NewGuid(), new Submission { TaskId = taskId, SubmittedByUserId = assistantId, FileId = submissionFileId });
        using var host = CreateHost(repository);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var owner = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = ownerId.ToString(), FileId = submissionFileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());
        var unrelated = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = Guid.NewGuid().ToString(), FileId = submissionFileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());

        owner.Allowed.Should().BeTrue();
        unrelated.Allowed.Should().BeFalse();
    }

    [Fact]
    public async Task AssistantCannotDownloadAnotherAssistantsSubmission()
    {
        var assistantAId = Guid.NewGuid();
        var assistantBId = Guid.NewGuid();
        var submissionFileId = Guid.NewGuid();
        
        var repository = CreateGraph(Guid.NewGuid(), assistantAId, out _, out var taskId);
        repository.Seed(Guid.NewGuid(), new Submission { TaskId = taskId, SubmittedByUserId = assistantAId, FileId = submissionFileId });
        
        using var host = CreateHost(repository);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var result = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = assistantBId.ToString(), FileId = submissionFileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());

        result.Allowed.Should().BeFalse();
    }

    [Fact]
    public async Task MangakaOwnerCanDownloadSubmission()
    {
        var assistantId = Guid.NewGuid();
        var submissionFileId = Guid.NewGuid();
        
        var repository = CreateGraph(Guid.NewGuid(), assistantId, out var ownerId, out var taskId);
        repository.Seed(Guid.NewGuid(), new Submission { TaskId = taskId, SubmittedByUserId = assistantId, FileId = submissionFileId });
        
        using var host = CreateHost(repository);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var result = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = ownerId.ToString(), FileId = submissionFileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());

        result.Allowed.Should().BeTrue();
    }

    [Fact]
    public async Task UnrelatedUserCannotGetSubmissionFileUrl()
    {
        var assistantId = Guid.NewGuid();
        var submissionFileId = Guid.NewGuid();
        
        var repository = CreateGraph(Guid.NewGuid(), assistantId, out _, out var taskId);
        repository.Seed(Guid.NewGuid(), new Submission { TaskId = taskId, SubmittedByUserId = assistantId, FileId = submissionFileId });
        
        using var host = CreateHost(repository);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var result = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = Guid.NewGuid().ToString(), FileId = submissionFileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());

        result.Allowed.Should().BeFalse();
    }

    [Fact]
    public async Task AssistantCannotSubmitAnotherUsersPrivateFile()
    {
        var assistantId = Guid.NewGuid();
        var privateFileId = Guid.NewGuid();
        
        // Setup graph but the file does not belong to any page/task assigned to assistantId
        var repository = CreateGraph(Guid.NewGuid(), assistantId, out _, out _);
        
        using var host = CreateHost(repository);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        // AssistantId tries to access a private file uploaded by someone else
        var result = await client.CanAccessFileAsync(new CanAccessFileRequest { UserId = assistantId.ToString(), FileId = privateFileId.ToString(), AccessType = "Read" }, GrpcTestHost.ValidMetadata());

        result.Allowed.Should().BeFalse();
    }

    private static GrpcTestHost CreateHost(FakeManagementRepository repository) => new(
        services => { services.AddSingleton<IManagementRepository>(repository); services.AddSingleton<IManagementUnitOfWork, FakeManagementUnitOfWork>(); },
        endpoints => endpoints.MapGrpcService<MangaManagementGrpcServiceImpl>());

    private static FakeManagementRepository CreateGraph(Guid pageFileId, Guid assistantId, out Guid ownerId, out Guid taskId)
    {
        var repository = new FakeManagementRepository();
        ownerId = Guid.NewGuid();
        var studioId = Guid.NewGuid(); var seriesId = Guid.NewGuid(); var chapterId = Guid.NewGuid(); var pageId = Guid.NewGuid(); taskId = Guid.NewGuid();
        repository.Seed(studioId, new Studio { Id = studioId, OwnerId = ownerId, Name = "Studio" });
        repository.Seed(seriesId, new Series { Id = seriesId, StudioId = studioId, CreatedBy = ownerId, Title = "Series" });
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = seriesId, Title = "Chapter" });
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1, FileId = pageFileId });
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, AssignedToUserId = assistantId, CreatedByUserId = ownerId, Title = "Task" });
        return repository;
    }
}
