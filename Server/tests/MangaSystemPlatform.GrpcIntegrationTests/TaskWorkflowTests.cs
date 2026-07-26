using FluentAssertions;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Events;
using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using TaskStatus = Manga.Management.Domain.Enums.TaskStatus;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class TaskWorkflowTests
{
    // ==========================================
    // TASK STATE TESTS
    // ==========================================

    [Fact]
    public async Task StartTask_FromTodo_Succeeds()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Todo });
        var service = CreateTaskService(repository, allowed: true);

        var result = await service.StartAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(TaskStatus.InProgress);
    }

    [Fact]
    public async Task StartTask_FromRevisionRequired_Succeeds()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.RevisionRequired });
        var service = CreateTaskService(repository, allowed: true);

        var result = await service.StartAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(TaskStatus.InProgress);
    }

    [Fact]
    public async Task StartTask_FromInProgress_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var service = CreateTaskService(repository, allowed: true);

        var result = await service.StartAsync(taskId);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Only assigned or revision-requested tasks can be started");
    }

    [Fact]
    public async Task StartTask_FromSubmitted_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Submitted });
        var service = CreateTaskService(repository, allowed: true);

        var result = await service.StartAsync(taskId);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task StartTask_FromApproved_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Approved });
        var service = CreateTaskService(repository, allowed: true);

        var result = await service.StartAsync(taskId);

        result.IsSuccess.Should().BeFalse();
    }

    // ==========================================
    // SUBMISSION TESTS
    // ==========================================

    [Fact]
    public async Task SubmitTask_FromInProgress_CreatesSubmissionVersionOne()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var service = CreateTaskService(repository, fileExists: true);

        var fileId = Guid.NewGuid();
        var result = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = fileId, Note = "First draft" }, Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
        result.Value!.FileId.Should().Be(fileId);
        result.Value!.Note.Should().Be("First draft");

        // Verify task updated to Submitted
        var task = await repository.GetByIdAsync<MangaTask>(taskId);
        task!.Status.Should().Be(TaskStatus.Submitted);
    }

    [Fact]
    public async Task SubmitTask_FromTodo_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Todo });
        var service = CreateTaskService(repository);

        var result = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Only in-progress tasks can be submitted");
    }

    [Fact]
    public async Task SubmitTask_FromRevisionRequiredWithoutRestart_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.RevisionRequired });
        var service = CreateTaskService(repository);

        var result = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Only in-progress tasks can be submitted");
    }

    [Fact]
    public async Task SubmitTask_WithInvalidFileId_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var service = CreateTaskService(repository, fileExists: false); // File does not exist

        var result = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("File does not exist or is not accessible");
    }

    [Fact]
    public async Task SubmitTask_ByUnassignedAssistant_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var service = CreateTaskService(repository, allowed: false); // Unassigned

        var result = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("You do not have permission to submit this task");
    }

    [Fact]
    public async Task SubmitTask_CalledTwice_DoesNotCreateDuplicateSubmission()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var events = new FakeEventBus();
        var service = CreateTaskService(repository, events: events);

        var fileId = Guid.NewGuid();
        var res1 = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = fileId }, Guid.NewGuid());
        res1.IsSuccess.Should().BeTrue();

        var res2 = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = fileId }, Guid.NewGuid());
        res2.IsSuccess.Should().BeFalse();
        res2.Error.Should().Contain("Task is already submitted");

        // Verify only 1 Submission entity created
        var submissions = await repository.ListAsync<Submission>(s => s.TaskId == taskId);
        submissions.Should().ContainSingle();

        // Verify only 1 Outbox event published
        events.PublishedEvents.Should().ContainSingle(e => e is TaskSubmittedEvent);
    }

    // ==========================================
    // REVISION TESTS
    // ==========================================

    [Fact]
    public async Task RequestRevision_FromSubmitted_Succeeds()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        repository.Seed(Guid.NewGuid(), new Submission { TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow });
        var service = CreateTaskService(repository);

        var result = await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "Shading is too dark" }, Guid.NewGuid());

        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(TaskStatus.RevisionRequired);

        // Verify latest submission marked as RevisionRequired
        var submissions = await repository.ListAsync<Submission>(s => s.TaskId == taskId);
        submissions.Single().Status.Should().Be(SubmissionStatus.RevisionRequired);

        // Verify a revision record is stored
        var revisions = await repository.ListAsync<Revision>(r => r.TaskId == taskId);
        revisions.Should().ContainSingle();
        revisions.Single().Reason.Should().Be("Shading is too dark");
    }

    [Fact]
    public async Task RequestRevision_WithoutReason_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Submitted });
        var service = CreateTaskService(repository);

        var result = await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "" }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Revision reason is required");
    }

    [Fact]
    public async Task RequestRevision_FromInProgress_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var service = CreateTaskService(repository);

        var result = await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "Fix it" }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task RequestRevision_ByUnrelatedMangaka_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Submitted });
        var service = CreateTaskService(repository, pageAccess: false); // No access to page/series

        var result = await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "Fix it" }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("You do not have permission to request a revision");
    }

    [Fact]
    public async Task Revision_PreservesPreviousSubmission()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        var subId = Guid.NewGuid();
        repository.Seed(subId, new Submission { Id = subId, TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow, Note = "Ver 1 note" });
        var service = CreateTaskService(repository);

        await service.RequestRevisionAsync(taskId, new RequestRevisionRequest { Reason = "Fix" }, Guid.NewGuid());

        // Verify version 1 submission is preserved in DB and not deleted or overwritten
        var oldSub = await repository.GetByIdAsync<Submission>(subId);
        oldSub.Should().NotBeNull();
        oldSub!.Note.Should().Be("Ver 1 note");
        oldSub.Status.Should().Be(SubmissionStatus.RevisionRequired);
    }

    // ==========================================
    // RESUBMISSION TESTS
    // ==========================================

    [Fact]
    public async Task Resubmit_AfterRevision_CreatesVersionTwo()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        
        // Setup: Task starts at RevisionRequired with Version 1 submission already completed
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.RevisionRequired });
        var sub1Id = Guid.NewGuid();
        repository.Seed(sub1Id, new Submission { Id = sub1Id, TaskId = taskId, Status = SubmissionStatus.RevisionRequired, SubmittedAt = DateTime.UtcNow.AddMinutes(-10), Note = "Version 1" });
        
        var service = CreateTaskService(repository);

        // Step 1: Assistant starts task (status becomes InProgress)
        var startResult = await service.StartAsync(taskId);
        startResult.IsSuccess.Should().BeTrue();

        // Step 2: Assistant submits Version 2
        var file2Id = Guid.NewGuid();
        var submitResult = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = file2Id, Note = "Version 2 fixed" }, Guid.NewGuid());
        submitResult.IsSuccess.Should().BeTrue();

        // Assert: 2 submissions exist
        var submissions = await repository.ListAsync<Submission>(s => s.TaskId == taskId);
        submissions.Count.Should().Be(2);

        // Assert: Version 1 is preserved
        var v1 = submissions.FirstOrDefault(s => s.Id == sub1Id);
        v1.Should().NotBeNull();
        v1!.Note.Should().Be("Version 1");

        // Assert: Version 2 is the latest submission
        var latest = submissions.OrderByDescending(s => s.SubmittedAt).First();
        latest.Note.Should().Be("Version 2 fixed");
        latest.FileId.Should().Be(file2Id);
    }

    // ==========================================
    // APPROVAL TESTS
    // ==========================================

    [Fact]
    public async Task ApproveTask_WithLatestSubmission_Succeeds()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        var subId = Guid.NewGuid();
        repository.Seed(subId, new Submission { Id = subId, TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow });
        var service = CreateTaskService(repository);

        var result = await service.ApproveAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Status.Should().Be(TaskStatus.Approved);

        // Verify latest submission updated to Approved
        var submission = await repository.GetByIdAsync<Submission>(subId);
        submission!.Status.Should().Be(SubmissionStatus.Approved);
    }

    [Fact]
    public async Task ApproveTask_FromNonSubmittedState_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var service = CreateTaskService(repository);

        var result = await service.ApproveAsync(taskId);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Only submitted tasks can be approved");
    }

    [Fact]
    public async Task ApproveTask_ByUnrelatedMangaka_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Submitted });
        var service = CreateTaskService(repository, pageAccess: false);

        var result = await service.ApproveAsync(taskId);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("You do not have permission to approve this task");
    }

    [Fact]
    public async Task ApproveTask_CalledTwice_FailsSafely()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        repository.Seed(Guid.NewGuid(), new Submission { TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow });
        var service = CreateTaskService(repository);

        var res1 = await service.ApproveAsync(taskId);
        res1.IsSuccess.Should().BeTrue();

        var res2 = await service.ApproveAsync(taskId);
        res2.IsSuccess.Should().BeFalse();
        res2.Error.Should().Contain("Task is already approved");
    }

    // ==========================================
    // AUTHORIZATION TESTS
    // ==========================================

    [Fact]
    public async Task AssistantCannotReadAnotherAssistantsSubmissionHistory()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, AssignedToUserId = Guid.NewGuid() });
        var service = CreateTaskService(repository, allowed: false); // Current user is NOT the assignee

        var result = await service.GetByIdAsync(taskId);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Task not found");
    }

    [Fact]
    public async Task MangakaCannotReviewTaskOutsideOwnedSeries()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.Submitted });
        var service = CreateTaskService(repository, pageAccess: false); // Mangaka has no series access

        var result = await service.ApproveAsync(taskId);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("You do not have permission to approve this task");
    }

    [Fact]
    public async Task ApproveTask_AfterTwoSubmissions_ApprovesLatestSubmission()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        
        var sub1 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.RevisionRequired, SubmittedAt = DateTime.UtcNow.AddMinutes(-5) };
        var sub2 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow };
        repository.Seed(sub1.Id, sub1);
        repository.Seed(sub2.Id, sub2);
        
        var service = CreateTaskService(repository);

        var result = await service.ApproveAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        
        // Assert latest is approved
        var dbSub2 = await repository.GetByIdAsync<Submission>(sub2.Id);
        dbSub2!.Status.Should().Be(SubmissionStatus.Approved);
    }

    [Fact]
    public async Task ApproveTask_DoesNotApproveSupersededSubmission()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        
        var sub1 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.RevisionRequired, SubmittedAt = DateTime.UtcNow.AddMinutes(-5) };
        var sub2 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow };
        repository.Seed(sub1.Id, sub1);
        repository.Seed(sub2.Id, sub2);
        
        var service = CreateTaskService(repository);

        var result = await service.ApproveAsync(taskId);
        result.IsSuccess.Should().BeTrue();

        // Assert older is still RevisionRequired
        var dbSub1 = await repository.GetByIdAsync<Submission>(sub1.Id);
        dbSub1!.Status.Should().Be(SubmissionStatus.RevisionRequired);
    }

    [Fact]
    public async Task SubmissionHistory_IsOrderedByVersion()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        
        var sub1 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.RevisionRequired, SubmittedAt = DateTime.UtcNow.AddMinutes(-10) };
        var sub2 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow };
        repository.Seed(sub1.Id, sub1);
        repository.Seed(sub2.Id, sub2);
        
        var service = CreateTaskService(repository);
        var result = await service.GetByIdAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        result.Value!.SubmissionHistory.Should().HaveCount(2);
        
        // History must be ordered descending by SubmittedAt (Version 2 first, Version 1 second)
        result.Value!.SubmissionHistory[0].Id.Should().Be(sub2.Id);
        result.Value!.SubmissionHistory[1].Id.Should().Be(sub1.Id);
    }

    [Fact]
    public async Task SubmissionVersions_AreUniquePerTask()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        repository.Seed(taskId, new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted });
        
        var sub1 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.RevisionRequired, SubmittedAt = DateTime.UtcNow.AddMinutes(-10) };
        var sub2 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow };
        repository.Seed(sub1.Id, sub1);
        repository.Seed(sub2.Id, sub2);
        
        var service = CreateTaskService(repository);
        var result = await service.GetByIdAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        var history = result.Value!.SubmissionHistory;
        
        // Calculated version numbers based on array order:
        // Version for history[0] (latest) = history.Count - 0 = 2
        // Version for history[1] (oldest) = history.Count - 1 = 1
        var vLatest = history.Count - 0;
        var vOldest = history.Count - 1;

        vLatest.Should().Be(2);
        vOldest.Should().Be(1);
        vLatest.Should().NotBe(vOldest);
    }

    [Fact]
    public async Task SubmitTask_ConcurrentSubmissions_OnlyOneSucceeds()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var events = new FakeEventBus();
        var service = CreateTaskService(repository, events);

        var task1 = service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());
        var task2 = service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        var results = await Task.WhenAll(task1, task2);

        var successCount = results.Count(r => r.IsSuccess);
        var failureCount = results.Count(r => !r.IsSuccess);

        successCount.Should().Be(1);
        failureCount.Should().Be(1);

        results.FirstOrDefault(r => !r.IsSuccess)?.Error.Should().Contain("Task is already submitted");

        // Verify only 1 submission entity was added in database
        var submissions = await repository.ListAsync<Submission>(s => s.TaskId == taskId);
        submissions.Should().ContainSingle();

        // Verify only 1 TaskSubmittedEvent was published
        events.PublishedEvents.Should().ContainSingle(e => e is Manga.Contracts.Events.TaskSubmittedEvent);
    }

    [Fact]
    public async Task ApproveTask_PersistsApprovedSubmissionId()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        var task = new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted };
        repository.Seed(taskId, task);
        
        var sub1 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.RevisionRequired, SubmittedAt = DateTime.UtcNow.AddMinutes(-5) };
        var sub2 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow };
        repository.Seed(sub1.Id, sub1);
        repository.Seed(sub2.Id, sub2);
        
        var service = CreateTaskService(repository);

        var result = await service.ApproveAsync(taskId);

        result.IsSuccess.Should().BeTrue();
        result.Value!.ApprovedSubmissionId.Should().Be(sub2.Id);
        
        var dbTask = await repository.GetByIdAsync<MangaTask>(taskId);
        dbTask!.ApprovedSubmissionId.Should().Be(sub2.Id);
    }

    [Fact]
    public async Task LatestSubmission_IsStableAfterReload()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        var pageId = Guid.NewGuid();
        var task = new MangaTask { Id = taskId, PageId = pageId, Status = TaskStatus.Submitted };
        repository.Seed(taskId, task);
        
        var sub1 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.RevisionRequired, SubmittedAt = DateTime.UtcNow.AddMinutes(-5) };
        var sub2 = new Submission { Id = Guid.NewGuid(), TaskId = taskId, Status = SubmissionStatus.Submitted, SubmittedAt = DateTime.UtcNow };
        repository.Seed(sub1.Id, sub1);
        repository.Seed(sub2.Id, sub2);
        
        var service = CreateTaskService(repository);

        var result1 = await service.GetByIdAsync(taskId);
        result1.IsSuccess.Should().BeTrue();
        result1.Value!.LatestSubmission!.Id.Should().Be(sub2.Id);

        // Reload from repository
        var service2 = CreateTaskService(repository);
        var result2 = await service2.GetByIdAsync(taskId);
        result2.IsSuccess.Should().BeTrue();
        result2.Value!.LatestSubmission!.Id.Should().Be(sub2.Id);
    }

    [Fact]
    public async Task SubmitTask_WithSoftDeletedFileId_Fails()
    {
        var taskId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(taskId, new MangaTask { Id = taskId, Status = TaskStatus.InProgress });
        var service = CreateTaskService(repository, fileExists: false);

        var result = await service.SubmitAsync(taskId, new SubmitTaskRequest { FileId = Guid.NewGuid() }, Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("File does not exist or is not accessible");
    }

    // ==========================================
    // HELPER CREATION
    // ==========================================

    private static TaskService CreateTaskService(
        FakeManagementRepository repository,
        IEventBus? events = null,
        bool allowed = true,
        bool pageAccess = true,
        bool fileExists = true)
    {
        var access = new FakeManagementAccessService { Allowed = allowed };
        // We can hook page access logic through overriding
        // FakeManagementAccessService allows checking CanManagePageAsync
        // Since FakeManagementAccessService.CanManagePageAsync returns Allowed, we can set that.
        // But to support both allowed=true (for assistant work) and pageAccess=false (for mangaka approval check),
        // we can create a sub-class or custom FakeManagementAccessService.
        var customAccess = new CustomAccessService(allowed, pageAccess);

        return new TaskService(
            repository,
            new FakeManagementUnitOfWork(),
            events ?? new FakeEventBus(),
            new FakeIdentityLookupClient(),
            new FakeFileLookupClient { Exists = fileExists },
            customAccess);
    }

    private sealed class CustomAccessService : IManagementAccessService
    {
        private readonly bool _allowed;
        private readonly bool _pageAccess;
        public CustomAccessService(bool allowed, bool pageAccess) { _allowed = allowed; _pageAccess = pageAccess; }
        public bool IsAdministrator => false;
        public bool CanViewBoardData => false;
        public Task<bool> CanAccessStudioAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanManageStudioAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanAccessSeriesAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanManageSeriesAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanAccessChapterAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanManageChapterAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanAccessPageAsync(Guid id, CancellationToken ct) => Task.FromResult(_pageAccess);
        public Task<bool> CanManagePageAsync(Guid id, CancellationToken ct) => Task.FromResult(_pageAccess);
        public Task<bool> CanAccessAnnotationAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanManageAnnotationAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanAccessTaskAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
        public Task<bool> CanWorkTaskAsync(Guid id, CancellationToken ct) => Task.FromResult(_allowed);
    }
}
