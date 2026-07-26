using FluentAssertions;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using Manga.Management.Application.EventHandlers;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Microsoft.Extensions.Logging.Abstractions;
using TaskStatus = Manga.Management.Domain.Enums.TaskStatus;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class ChapterStateMachineTests
{
    // ==========================================
    // A. DIRECT STATUS BYPASS
    // ==========================================

    [Fact]
    public async Task Mangaka_CannotSetSubmittedChapterToApproved()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.SubmittedForReview });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true, IsAdminOverride = false });

        var result = await service.UpdateStatusAsync(chapterId, new UpdateChapterStatusRequest { Status = ChapterStatus.Approved }, Guid.NewGuid());
        
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Chapter review status can only be modified through the editorial review workflow");
    }

    [Fact]
    public async Task Mangaka_CannotSetSubmittedChapterToRevisionRequired()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.SubmittedForReview });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true, IsAdminOverride = false });

        var result = await service.UpdateStatusAsync(chapterId, new UpdateChapterStatusRequest { Status = ChapterStatus.RevisionRequired }, Guid.NewGuid());
        
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Chapter review status can only be modified through the editorial review workflow");
    }

    [Fact]
    public async Task Mangaka_CannotSetSubmittedChapterToRejected()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.SubmittedForReview });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true, IsAdminOverride = false });

        var result = await service.UpdateStatusAsync(chapterId, new UpdateChapterStatusRequest { Status = ChapterStatus.Rejected }, Guid.NewGuid());
        
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Chapter review status can only be modified through the editorial review workflow");
    }

    [Fact]
    public async Task Mangaka_CannotSetApprovedChapterToScheduled()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.Approved });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true, IsAdminOverride = false });

        var result = await service.UpdateStatusAsync(chapterId, new UpdateChapterStatusRequest { Status = ChapterStatus.Scheduled }, Guid.NewGuid());
        
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Only administrators or the publication workflow can publish chapters");
    }

    [Fact]
    public async Task Mangaka_CannotSetApprovedChapterToPublished()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.Approved });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true, IsAdminOverride = false });

        var result = await service.UpdateStatusAsync(chapterId, new UpdateChapterStatusRequest { Status = ChapterStatus.Published }, Guid.NewGuid());
        
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Only administrators or the publication workflow can publish chapters");
    }

    [Fact]
    public async Task Mangaka_CannotSetStatusToSubmittedForReviewViaPatch()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true, IsAdminOverride = false });

        var result = await service.UpdateStatusAsync(chapterId, new UpdateChapterStatusRequest { Status = ChapterStatus.SubmittedForReview }, Guid.NewGuid());
        
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("To submit a chapter for review, please use the dedicated submit-review endpoint");
    }

    // ==========================================
    // B. SUBMIT REVIEW ENTRY POINT
    // ==========================================

    [Fact]
    public async Task SubmitReview_FromDraft_Fails()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.Draft });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("must be transitioned from Draft to InProduction before submitting");
    }

    [Fact]
    public async Task SubmitReview_FromInProduction_Succeeds()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        repository.Seed(Guid.NewGuid(), new Page { Id = Guid.NewGuid(), ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task SubmitReview_FromRevisionRequired_Succeeds()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.RevisionRequired });
        repository.Seed(Guid.NewGuid(), new Page { Id = Guid.NewGuid(), ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task SubmitReview_WithoutPages_Fails()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("must contain at least one page scan");
    }

    [Fact]
    public async Task SubmitReview_PageWithoutFileReference_Fails()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        repository.Seed(Guid.NewGuid(), new Page { Id = Guid.NewGuid(), ChapterId = chapterId, PageNumber = 1, FileId = null }); // No file reference
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("must have a valid file reference");
    }

    [Fact]
    public async Task SubmitReview_WithTodoTask_Fails()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        var pageId = Guid.NewGuid();
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        repository.Seed(Guid.NewGuid(), new MangaTask { Id = Guid.NewGuid(), PageId = pageId, Status = TaskStatus.Todo, Title = "Lineart" });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("All tasks in the chapter must be approved");
    }

    [Fact]
    public async Task SubmitReview_WithInProgressTask_Fails()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        var pageId = Guid.NewGuid();
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        repository.Seed(Guid.NewGuid(), new MangaTask { Id = Guid.NewGuid(), PageId = pageId, Status = TaskStatus.InProgress, Title = "Lettering" });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task SubmitReview_WithSubmittedTask_Fails()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        var pageId = Guid.NewGuid();
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        repository.Seed(Guid.NewGuid(), new MangaTask { Id = Guid.NewGuid(), PageId = pageId, Status = TaskStatus.Submitted, Title = "Tones" });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task SubmitReview_WithRevisionRequiredTask_Fails()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        var pageId = Guid.NewGuid();
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        repository.Seed(Guid.NewGuid(), new MangaTask { Id = Guid.NewGuid(), PageId = pageId, Status = TaskStatus.RevisionRequired, Title = "Fix lineart" });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task SubmitReview_WithOnlyApprovedTasks_Succeeds()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        var pageId = Guid.NewGuid();
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        repository.Seed(Guid.NewGuid(), new MangaTask { Id = Guid.NewGuid(), PageId = pageId, Status = TaskStatus.Approved, Title = "Complete Tones" });
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = true });

        var result = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
    }

    // ==========================================
    // C. DUPLICATE SUBMISSION
    // ==========================================

    [Fact]
    public async Task SubmitReview_CalledTwice_DoesNotCreateDuplicateOutboxEvent()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.InProduction });
        repository.Seed(Guid.NewGuid(), new Page { Id = Guid.NewGuid(), ChapterId = chapterId, PageNumber = 1, FileId = Guid.NewGuid() });
        var events = new FakeEventBus();
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), events, new FakeManagementAccessService { Allowed = true });

        // Call 1 - Succeeds
        var res1 = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());
        res1.IsSuccess.Should().BeTrue();

        // Call 2 - Fails because already submitted
        var res2 = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());
        res2.IsSuccess.Should().BeFalse();
        res2.Error.Should().Contain("Chapter is already submitted for review");

        // Outbox event was published exactly once
        events.PublishedEvents.Should().ContainSingle(m => m is ChapterSubmittedForReviewEvent);
    }

    // ==========================================
    // D. EVENT-DRIVEN DECISIONS
    // ==========================================

    [Fact]
    public async Task ChapterApprovedEvent_UpdatesSubmittedChapterToApproved()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.SubmittedForReview });
        var handler = new ChapterApprovedEventHandler(repository, new FakeManagementUnitOfWork(), NullLogger<ChapterApprovedEventHandler>.Instance);

        await handler.HandleAsync(new ChapterApprovedEvent(Guid.NewGuid(), chapterId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow));

        var chapter = await repository.GetByIdAsync<Chapter>(chapterId);
        chapter!.Status.Should().Be(ChapterStatus.Approved);
    }

    [Fact]
    public async Task ChapterRevisionRequestedEvent_UpdatesSubmittedChapterToRevisionRequired()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.SubmittedForReview });
        var handler = new ChapterReviewDecisionEventHandler(repository, new FakeManagementUnitOfWork(), NullLogger<ChapterReviewDecisionEventHandler>.Instance);

        await handler.HandleAsync(new ChapterReviewDecisionEvent(Guid.NewGuid(), chapterId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "RevisionRequested", "Reason", DateTime.UtcNow));

        var chapter = await repository.GetByIdAsync<Chapter>(chapterId);
        chapter!.Status.Should().Be(ChapterStatus.RevisionRequired);
    }

    [Fact]
    public async Task ChapterRejectedEvent_UpdatesSubmittedChapterToRejected()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.SubmittedForReview });
        var handler = new ChapterReviewDecisionEventHandler(repository, new FakeManagementUnitOfWork(), NullLogger<ChapterReviewDecisionEventHandler>.Instance);

        await handler.HandleAsync(new ChapterReviewDecisionEvent(Guid.NewGuid(), chapterId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "Rejected", "Reason", DateTime.UtcNow));

        var chapter = await repository.GetByIdAsync<Chapter>(chapterId);
        chapter!.Status.Should().Be(ChapterStatus.Rejected);
    }

    [Fact]
    public async Task DuplicateChapterApprovedEvent_IsProcessedOnce()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.SubmittedForReview });
        var handler = new ChapterApprovedEventHandler(repository, new FakeManagementUnitOfWork(), NullLogger<ChapterApprovedEventHandler>.Instance);

        var messageId = Guid.NewGuid();
        var approvedEvent = new ChapterApprovedEvent(messageId, chapterId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow);

        // Process first time
        await handler.HandleAsync(approvedEvent);
        var inboxList = await repository.ListAsync<InboxMessage>(m => m.MessageId == messageId);
        inboxList.Should().ContainSingle();

        // Process second time (should skip execution)
        await handler.HandleAsync(approvedEvent);
        var chapter = await repository.GetByIdAsync<Chapter>(chapterId);
        chapter!.Status.Should().Be(ChapterStatus.Approved); // Still approved, processed once
    }

    [Fact]
    public async Task EditorialEvent_WithInvalidCurrentState_IsIgnoredOrFailedSafely()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        // Chapter is currently Draft (NOT SubmittedForReview)
        repository.Seed(chapterId, new Chapter { Id = chapterId, Title = "Ch 1", Status = ChapterStatus.Draft });
        var handler = new ChapterApprovedEventHandler(repository, new FakeManagementUnitOfWork(), NullLogger<ChapterApprovedEventHandler>.Instance);

        var approvedEvent = new ChapterApprovedEvent(Guid.NewGuid(), chapterId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow);

        // Act
        await handler.HandleAsync(approvedEvent);

        // Assert: Event was processed but did not change status from Draft to Approved
        var chapter = await repository.GetByIdAsync<Chapter>(chapterId);
        chapter!.Status.Should().Be(ChapterStatus.Draft);
    }

    // ==========================================
    // E. OBJECT-LEVEL AUTHORIZATION
    // ==========================================

    [Fact]
    public async Task MangakaCannotCreateChapterInAnotherMangakasSeries()
    {
        var seriesId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var otherMangaka = Guid.NewGuid();
        repository.Seed(seriesId, new Series { Id = seriesId, CreatedBy = otherMangaka, Title = "Other Series" });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanManageSeriesAsync(seriesId);
        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task MangakaCannotCreatePageInAnotherMangakasChapter()
    {
        var chapterId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        var otherMangaka = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(seriesId, new Series { Id = seriesId, CreatedBy = otherMangaka, Title = "Other Series" });
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = seriesId, Title = "Other Chapter" });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanManageChapterAsync(chapterId);
        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task MangakaCannotCreateAnnotationOnAnotherMangakasPage()
    {
        var chapterId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        var pageId = Guid.NewGuid();
        var otherMangaka = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(seriesId, new Series { Id = seriesId, CreatedBy = otherMangaka, Title = "Other Series" });
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = seriesId, Title = "Other Chapter" });
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanManagePageAsync(pageId);
        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task MangakaCannotCreateTaskFromAnotherMangakasAnnotation()
    {
        var chapterId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        var pageId = Guid.NewGuid();
        var annotationId = Guid.NewGuid();
        var otherMangaka = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(seriesId, new Series { Id = seriesId, CreatedBy = otherMangaka, Title = "Other Series" });
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = seriesId, Title = "Other Chapter" });
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId });
        repository.Seed(annotationId, new Annotation { Id = annotationId, PageId = pageId });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanManageAnnotationAsync(annotationId);
        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task MangakaCannotApproveAnotherMangakasTask()
    {
        var chapterId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        var pageId = Guid.NewGuid();
        var otherMangaka = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(seriesId, new Series { Id = seriesId, CreatedBy = otherMangaka, Title = "Other Series" });
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = seriesId, Title = "Other Chapter" });
        repository.Seed(pageId, new Page { Id = pageId, ChapterId = chapterId });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanManagePageAsync(pageId); // approve task checks CanManagePageAsync
        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task AssistantCannotReadAnotherAssistantsTask()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var otherAssistant = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, AssignedToUserId = otherAssistant, Title = "Task" });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanAccessTaskAsync(taskId);
        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task AssistantCannotStartAnotherAssistantsTask()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var otherAssistant = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, AssignedToUserId = otherAssistant, Title = "Task" });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanWorkTaskAsync(taskId);
        allowed.Should().BeFalse();
    }

    [Fact]
    public async Task AssistantCannotSubmitAnotherAssistantsTask()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var otherAssistant = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, AssignedToUserId = otherAssistant, Title = "Task" });

        var access = new ManagementAccessService(repository, new TestCurrentUser(Guid.NewGuid(), false));
        var allowed = await access.CanWorkTaskAsync(taskId);
        allowed.Should().BeFalse();
    }

    private sealed class TestCurrentUser : ICurrentUserService
    {
        private readonly bool _isAdmin;
        public TestCurrentUser(Guid userId, bool isAdmin) { UserId = userId; _isAdmin = isAdmin; }
        public Guid UserId { get; }
        public bool IsInRole(string role) => _isAdmin && role == "Admin";
    }
}
