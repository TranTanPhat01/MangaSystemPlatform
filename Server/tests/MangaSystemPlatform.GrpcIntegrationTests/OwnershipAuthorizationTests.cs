using FluentAssertions;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;
using Manga.Management.Domain.Entities;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class OwnershipAuthorizationTests
{
    [Fact]
    public async Task SeriesOwner_CanAccessAndManageOwnSeries()
    {
        var ownerId = Guid.NewGuid();
        var access = CreateAccess(ownerId, out var repository, out var seriesId, isOwner: true);

        (await access.CanAccessSeriesAsync(seriesId)).Should().BeTrue();
        (await access.CanManageSeriesAsync(seriesId)).Should().BeTrue();
    }

    [Fact]
    public async Task UnrelatedMangaka_CannotAccessOrManageSeries()
    {
        var access = CreateAccess(Guid.NewGuid(), out _, out var seriesId);

        (await access.CanAccessSeriesAsync(seriesId)).Should().BeFalse();
        (await access.CanManageSeriesAsync(seriesId)).Should().BeFalse();
    }

    [Fact]
    public async Task AssignedAssistant_CanAccessTaskButCannotManageItsPage()
    {
        var assistantId = Guid.NewGuid();
        var access = CreateAccess(assistantId, out var repository, out var seriesId);
        var chapterId = Guid.NewGuid();
        var pageId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = seriesId, Title = "Chapter" });
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1 });
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, AssignedToUserId = assistantId, CreatedByUserId = Guid.NewGuid(), Title = "Task" });

        (await access.CanAccessTaskAsync(taskId)).Should().BeTrue();
        (await access.CanWorkTaskAsync(taskId)).Should().BeTrue();
        (await access.CanAccessPageAsync(pageId)).Should().BeTrue();
        (await access.CanManagePageAsync(pageId)).Should().BeFalse();
    }

    [Fact]
    public async Task Admin_CanManageAnySeries()
    {
        var access = CreateAccess(Guid.NewGuid(), out _, out var seriesId, isAdmin: true);

        (await access.CanAccessSeriesAsync(seriesId)).Should().BeTrue();
        (await access.CanManageSeriesAsync(seriesId)).Should().BeTrue();
    }

    [Fact]
    public async Task AssignedAssistant_CanStartAndSubmitAssignedTask()
    {
        var assistantId = Guid.NewGuid();
        var repository = SeedTaskGraph(assistantId, out var taskId, out _);
        var service = CreateTaskService(repository, new TestCurrentUser(assistantId, false));

        (await service.StartAsync(taskId)).IsSuccess.Should().BeTrue();
        var submissionFileId = Guid.NewGuid();
        (await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = submissionFileId, Note = "Done" }, assistantId)).IsSuccess.Should().BeTrue();
        (await service.GetByIdAsync(taskId)).Value!.LatestSubmission!.FileId.Should().Be(submissionFileId);
    }

    [Fact]
    public async Task Assistant_CannotAccessUnrelatedTaskOrManagePage()
    {
        var repository = SeedTaskGraph(Guid.NewGuid(), out var taskId, out var pageId);
        var service = CreateTaskService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var pageService = new PageService(repository, new FakeManagementUnitOfWork(), new FakeFileLookupClient(), new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false)));

        (await service.GetByIdAsync(taskId)).IsSuccess.Should().BeFalse();
        (await service.StartAsync(taskId)).IsSuccess.Should().BeFalse();
        (await pageService.UpdateStatusAsync(pageId, new UpdatePageStatusRequest())).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task MangakaOwner_CanCreateTaskForOwnPage_AndUnrelatedMangakaCannotManageAnnotation()
    {
        var ownerId = Guid.NewGuid();
        var repository = SeedTaskGraph(Guid.NewGuid(), out _, out var pageId, ownerId);
        var annotation = (await repository.ListAsync<Annotation>()).Single();
        var ownerService = CreateTaskService(repository, new TestCurrentUser(ownerId, false));
        var create = await ownerService.CreateAsync(new CreateTaskRequest { PageId = pageId, AnnotationId = annotation.Id, Title = "Cleanup", AssignedToUserId = Guid.NewGuid() }, ownerId);
        var unrelatedAnnotationService = new AnnotationService(repository, new FakeManagementUnitOfWork(), new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false)));

        create.IsSuccess.Should().BeTrue();
        (await unrelatedAnnotationService.DeleteAsync(annotation.Id)).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Admin_CanManagePageAnnotationAndTaskOutsideOwnership()
    {
        var repository = SeedTaskGraph(Guid.NewGuid(), out var taskId, out var pageId);
        var annotation = (await repository.ListAsync<Annotation>()).Single();
        var admin = new TestCurrentUser(Guid.NewGuid(), true);
        var access = new ManagementAccessService(repository, admin);

        (await access.CanManagePageAsync(pageId)).Should().BeTrue();
        (await access.CanManageAnnotationAsync(annotation.Id)).Should().BeTrue();
        (await access.CanAccessTaskAsync(taskId)).Should().BeTrue();
    }

    [Fact]
    public async Task Owner_CanApproveSubmittedTask_AndPublishesApprovalEvent()
    {
        var ownerId = Guid.NewGuid();
        var repository = SeedTaskGraph(Guid.NewGuid(), out var taskId, out _, ownerId);
        var task = await repository.GetByIdAsync<MangaTask>(taskId);
        task!.Status = Manga.Management.Domain.Enums.TaskStatus.Submitted;
        await repository.AddAsync(new Submission { TaskId = taskId, SubmittedByUserId = task.AssignedToUserId, SubmittedAt = DateTime.UtcNow });
        var events = new FakeEventBus();
        var service = CreateTaskService(repository, new TestCurrentUser(ownerId, false), events);

        var result = await service.ApproveAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(Manga.Management.Domain.Enums.TaskStatus.Approved);
        events.PublishedEvents.Should().ContainSingle(message => message is Manga.Contracts.Events.TaskApprovedEvent);
    }

    [Fact]
    public async Task Owner_CanRequestRevisionWithReason_ButCannotApproveBeforeSubmission()
    {
        var ownerId = Guid.NewGuid();
        var repository = SeedTaskGraph(Guid.NewGuid(), out var taskId, out _, ownerId);
        var service = CreateTaskService(repository, new TestCurrentUser(ownerId, false));

        (await service.ApproveAsync(taskId)).IsSuccess.Should().BeFalse();
        (await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "Please fix lettering" }, ownerId)).IsSuccess.Should().BeFalse();

        (await repository.GetByIdAsync<MangaTask>(taskId))!.Status = Manga.Management.Domain.Enums.TaskStatus.Submitted;
        (await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "Please fix lettering" }, ownerId)).IsSuccess.Should().BeTrue();
        (await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "" }, ownerId)).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Assistant_CannotSubmitApprovedTask_AndUnassignedAssistantCannotSubmit()
    {
        var assignedId = Guid.NewGuid();
        var repository = SeedTaskGraph(assignedId, out var taskId, out _);
        (await repository.GetByIdAsync<MangaTask>(taskId))!.Status = Manga.Management.Domain.Enums.TaskStatus.Approved;

        (await CreateTaskService(repository, new TestCurrentUser(assignedId, false)).SubmitAsync(taskId, new SubmitTaskRequest(), assignedId)).IsSuccess.Should().BeFalse();
        (await CreateTaskService(repository, new TestCurrentUser(Guid.NewGuid(), false)).SubmitAsync(taskId, new SubmitTaskRequest(), Guid.NewGuid())).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task AssignedAssistant_SeesPageFileReference_AndCannotSubmitWithoutFile()
    {
        var assistantId = Guid.NewGuid();
        var repository = SeedTaskGraph(assistantId, out var taskId, out var pageId);
        var page = await repository.GetByIdAsync<Page>(pageId);
        var pageFileId = Guid.NewGuid();
        page!.FileId = pageFileId;
        (await repository.GetByIdAsync<MangaTask>(taskId))!.Status = Manga.Management.Domain.Enums.TaskStatus.InProgress;
        var service = CreateTaskService(repository, new TestCurrentUser(assistantId, false));

        var task = await service.GetByIdAsync(taskId);
        task.Value!.PageFileId.Should().Be(pageFileId);
        task.Value.PageNumber.Should().Be(page.PageNumber);
        (await service.SubmitAsync(taskId, new SubmitTaskRequest(), assistantId)).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Admin_CanApproveAndRequestRevisionForAnySubmittedTask()
    {
        var repository = SeedTaskGraph(Guid.NewGuid(), out var taskId, out _);
        (await repository.GetByIdAsync<MangaTask>(taskId))!.Status = Manga.Management.Domain.Enums.TaskStatus.Submitted;
        var admin = CreateTaskService(repository, new TestCurrentUser(Guid.NewGuid(), true));

        (await admin.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "Revise" }, Guid.NewGuid())).IsSuccess.Should().BeTrue();
        (await repository.GetByIdAsync<MangaTask>(taskId))!.Status = Manga.Management.Domain.Enums.TaskStatus.Submitted;
        (await admin.ApproveAsync(taskId)).IsSuccess.Should().BeTrue();
    }

    private static ManagementAccessService CreateAccess(Guid userId, out FakeManagementRepository repository, out Guid seriesId, bool isAdmin = false, bool isOwner = false)
    {
        repository = new FakeManagementRepository();
        var studioId = Guid.NewGuid();
        seriesId = Guid.NewGuid();
        var ownerId = isOwner ? userId : Guid.NewGuid();
        repository.Seed(studioId, new Studio { Id = studioId, OwnerId = ownerId, Name = "Studio" });
        repository.Seed(seriesId, new Series { Id = seriesId, StudioId = studioId, CreatedBy = ownerId, Title = "Series" });
        return new ManagementAccessService(repository, new TestCurrentUser(userId, isAdmin));
    }

    private sealed class TestCurrentUser : ICurrentUserService
    {
        private readonly bool _isAdmin;
        public TestCurrentUser(Guid userId, bool isAdmin) { UserId = userId; _isAdmin = isAdmin; }
        public Guid UserId { get; }
        public bool IsInRole(string role) => _isAdmin && role == "Admin";
    }

    private static FakeManagementRepository SeedTaskGraph(Guid assignedUserId, out Guid taskId, out Guid pageId, Guid? ownerId = null)
    {
        var repository = new FakeManagementRepository();
        var owner = ownerId ?? Guid.NewGuid();
        var studioId = Guid.NewGuid(); var seriesId = Guid.NewGuid(); var chapterId = Guid.NewGuid(); pageId = Guid.NewGuid(); var annotationId = Guid.NewGuid(); taskId = Guid.NewGuid();
        repository.Seed(studioId, new Studio { Id = studioId, OwnerId = owner, Name = "Studio" });
        repository.Seed(seriesId, new Series { Id = seriesId, StudioId = studioId, CreatedBy = owner, Title = "Series" });
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = seriesId, Title = "Chapter" });
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1 });
        repository.Seed(annotationId, new Annotation { Id = annotationId, PageId = pageId, CoordinatesJson = "{}" });
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, AnnotationId = annotationId, AssignedToUserId = assignedUserId, CreatedByUserId = owner, Title = "Task" });
        return repository;
    }

    private static TaskService CreateTaskService(FakeManagementRepository repository, ICurrentUserService currentUser, FakeEventBus? eventBus = null) =>
        new(repository, new FakeManagementUnitOfWork(), eventBus ?? new FakeEventBus(), new FakeIdentityLookupClient(), new FakeFileLookupClient(), new ManagementAccessService(repository, currentUser));
}
