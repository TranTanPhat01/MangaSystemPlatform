using FluentAssertions;
using Manga.Contracts.Events;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Application.Services;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;
using Manga.Management.Domain.Entities;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class BusinessFlowTests
{
    [Fact]
    public async Task CreateTask_WithActiveAssistant_CreatesTaskAndPublishesEvent()
    {
        var context = CreateTaskContext(identityExists: true, hasAssistantRole: true);

        var result = await context.Service.CreateAsync(CreateTaskRequest(context.PageId, context.AnnotationId), Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
        context.UnitOfWork.SaveChangesCalls.Should().Be(1);
        context.EventBus.PublishedEvents.Should().ContainSingle(message => message is TaskAssignedEvent);
    }

    [Fact]
    public async Task CreateTask_WithMissingOrInactiveUser_ReturnsValidationAndDoesNotPublish()
    {
        var context = CreateTaskContext(identityExists: false, hasAssistantRole: true);

        var result = await context.Service.CreateAsync(CreateTaskRequest(context.PageId, context.AnnotationId), Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Assigned user does not exist or is inactive.");
        context.UnitOfWork.SaveChangesCalls.Should().Be(0);
        context.EventBus.PublishedEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateTask_WithActiveUserWithoutAssistantRole_ReturnsValidationAndDoesNotPublish()
    {
        var context = CreateTaskContext(identityExists: true, hasAssistantRole: false);

        var result = await context.Service.CreateAsync(CreateTaskRequest(context.PageId, context.AnnotationId), Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Assigned user must have Assistant role.");
        context.UnitOfWork.SaveChangesCalls.Should().Be(0);
        context.EventBus.PublishedEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task CreatePage_WithExistingFile_CreatesPage()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = Guid.NewGuid(), Title = "Chapter" });
        var unitOfWork = new FakeManagementUnitOfWork();
        var service = new PageService(repository, unitOfWork, new FakeFileLookupClient { Exists = true }, new FakeManagementAccessService());

        var result = await service.CreateAsync(chapterId, new CreatePageRequest { PageNumber = 1, FileId = Guid.NewGuid() });

        result.IsSuccess.Should().BeTrue();
        result.Value!.FileId.Should().NotBeNull();
        unitOfWork.SaveChangesCalls.Should().Be(1);
    }

    [Fact]
    public async Task CreatePage_WithMissingFile_ReturnsValidation()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = Guid.NewGuid(), Title = "Chapter" });
        var unitOfWork = new FakeManagementUnitOfWork();
        var service = new PageService(repository, unitOfWork, new FakeFileLookupClient { Exists = false }, new FakeManagementAccessService());

        var result = await service.CreateAsync(chapterId, new CreatePageRequest { PageNumber = 1, FileId = Guid.NewGuid() });

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("File does not exist or is not accessible.");
        unitOfWork.SaveChangesCalls.Should().Be(0);
    }

    [Fact]
    public async Task SubmitTask_WithExistingFile_SubmitsAndPublishesEvent()
    {
        var context = CreateTaskContext(identityExists: true, hasAssistantRole: true, fileExists: true);
        var taskId = Guid.NewGuid();
        context.Repository.Seed(taskId, new MangaTask
        {
            Id = taskId,
            PageId = context.PageId,
            AnnotationId = context.AnnotationId,
            AssignedToUserId = Guid.NewGuid(),
            CreatedByUserId = Guid.NewGuid(),
            Title = "Task",
            Status = Manga.Management.Domain.Enums.TaskStatus.InProgress
        });

        var result = await context.Service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
        context.UnitOfWork.SaveChangesCalls.Should().Be(1);
        context.EventBus.PublishedEvents.Should().ContainSingle(message => message is TaskSubmittedEvent);
    }

    [Fact]
    public async Task SubmitTask_WithMissingFile_ReturnsValidationAndDoesNotPublish()
    {
        var context = CreateTaskContext(identityExists: true, hasAssistantRole: true, fileExists: false);
        var taskId = Guid.NewGuid();
        context.Repository.Seed(taskId, new MangaTask
        {
            Id = taskId,
            PageId = context.PageId,
            AnnotationId = context.AnnotationId,
            AssignedToUserId = Guid.NewGuid(),
            CreatedByUserId = Guid.NewGuid(),
            Title = "Task",
            Status = Manga.Management.Domain.Enums.TaskStatus.InProgress
        });

        var result = await context.Service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("File does not exist or is not accessible.");
        context.UnitOfWork.SaveChangesCalls.Should().Be(0);
        context.EventBus.PublishedEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateEditorialReview_WithValidChapterAndSeries_CreatesReview()
    {
        var seriesId = Guid.NewGuid();
        var chapterId = Guid.NewGuid();
        var unitOfWork = new FakeEditorialUnitOfWork();
        var currentUser = new FakeCurrentUserService();
        var service = new EditorialReviewService(
            new FakeEditorialRepository(),
            unitOfWork,
            currentUser,
            new FakeEventBus(),
            new FakeMangaLookupClient
            {
                Series = new SeriesSummaryDto { SeriesId = seriesId, Title = "Series", AuthorUserId = currentUser.UserId },
                Chapter = new ChapterSummaryDto { ChapterId = chapterId, SeriesId = seriesId, Title = "Chapter", Number = 1 }
            });

        var result = await service.CreateAsync(new CreateEditorialReviewRequest { ChapterId = chapterId, SeriesId = seriesId });

        result.IsSuccess.Should().BeTrue();
        unitOfWork.SaveChangesCalls.Should().Be(1);
    }

    [Fact]
    public async Task CreateEditorialReview_WithInvalidLookup_ReturnsValidation()
    {
        var unitOfWork = new FakeEditorialUnitOfWork();
        var service = new EditorialReviewService(
            new FakeEditorialRepository(),
            unitOfWork,
            new FakeCurrentUserService(),
            new FakeEventBus(),
            new FakeMangaLookupClient { Chapter = null, Series = null });

        var result = await service.CreateAsync(new CreateEditorialReviewRequest { ChapterId = Guid.NewGuid(), SeriesId = Guid.NewGuid() });

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Chapter not found.");
        unitOfWork.SaveChangesCalls.Should().Be(0);
    }

    [Fact]
    public async Task CreateEditorialReview_WithMismatchedChapterAndSeries_ReturnsValidation()
    {
        var requestedSeriesId = Guid.NewGuid();
        var unitOfWork = new FakeEditorialUnitOfWork();
        var service = new EditorialReviewService(
            new FakeEditorialRepository(),
            unitOfWork,
            new FakeCurrentUserService(),
            new FakeEventBus(),
            new FakeMangaLookupClient
            {
                Series = new SeriesSummaryDto { SeriesId = requestedSeriesId, Title = "Series", AuthorUserId = Guid.NewGuid() },
                Chapter = new ChapterSummaryDto { ChapterId = Guid.NewGuid(), SeriesId = Guid.NewGuid(), Title = "Chapter", Number = 1 }
            });

        var result = await service.CreateAsync(new CreateEditorialReviewRequest { ChapterId = Guid.NewGuid(), SeriesId = requestedSeriesId });

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Chapter does not belong to series.");
        unitOfWork.SaveChangesCalls.Should().Be(0);
    }

    private static TaskContext CreateTaskContext(bool identityExists, bool hasAssistantRole, bool fileExists = true)
    {
        var pageId = Guid.NewGuid();
        var annotationId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = Guid.NewGuid(), PageNumber = 1 });
        repository.Seed(annotationId, new Annotation { Id = annotationId, PageId = pageId, CoordinatesJson = "{}" });
        var unitOfWork = new FakeManagementUnitOfWork();
        var eventBus = new FakeEventBus();
        var service = new TaskService(
            repository,
            unitOfWork,
            eventBus,
            new FakeIdentityLookupClient { Exists = identityExists, HasRole = hasAssistantRole },
            new FakeFileLookupClient { Exists = fileExists },
            new FakeManagementAccessService());

        return new TaskContext(service, repository, unitOfWork, eventBus, pageId, annotationId);
    }

    private static CreateTaskRequest CreateTaskRequest(Guid pageId, Guid annotationId) => new()
    {
        PageId = pageId,
        AnnotationId = annotationId,
        Title = "Lettering cleanup",
        AssignedToUserId = Guid.NewGuid()
    };

    private sealed record TaskContext(
        TaskService Service,
        FakeManagementRepository Repository,
        FakeManagementUnitOfWork UnitOfWork,
        FakeEventBus EventBus,
        Guid PageId,
        Guid AnnotationId);
}
