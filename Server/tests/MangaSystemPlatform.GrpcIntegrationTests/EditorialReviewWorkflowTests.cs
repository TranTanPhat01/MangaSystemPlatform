using FluentAssertions;
using Manga.Contracts.Events;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Application.EventHandlers;
using Manga.Editorial.Application.Services;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;
using Manga.Management.Application.EventHandlers;
using Manga.Management.Application.Services;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Microsoft.Extensions.Logging.Abstractions;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class EditorialReviewWorkflowTests
{
    [Fact]
    public async Task MangakaOwner_CanSubmitChapterForReview_AndUnrelatedUserCannot()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = Guid.NewGuid(), Title = "Chapter", Status = ChapterStatus.InProduction });
        var events = new FakeEventBus();
        var allowed = new FakeManagementAccessService { Allowed = true };
        var service = new ChapterService(repository, new FakeManagementUnitOfWork(), events, allowed);

        var submitted = await service.SubmitChapterForReviewAsync(chapterId, Guid.NewGuid());

        submitted.IsSuccess.Should().BeTrue();
        submitted.Value!.Status.Should().Be(ChapterStatus.SubmittedForReview);
        events.PublishedEvents.Should().ContainSingle(message => message is ChapterSubmittedForReviewEvent);

        var otherChapterId = Guid.NewGuid();
        repository.Seed(otherChapterId, new Chapter { Id = otherChapterId, SeriesId = Guid.NewGuid(), Title = "Other", Status = ChapterStatus.InProduction });
        var denied = new ChapterService(repository, new FakeManagementUnitOfWork(), new FakeEventBus(), new FakeManagementAccessService { Allowed = false });
        (await denied.SubmitChapterForReviewAsync(otherChapterId, Guid.NewGuid())).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task SubmitEvent_CreatesPendingReview_AndResubmissionReopensIt()
    {
        var repository = new FakeEditorialRepository();
        var handler = new ChapterSubmittedForReviewEventHandler(repository, new FakeEditorialUnitOfWork(), NullLogger<ChapterSubmittedForReviewEventHandler>.Instance);
        var chapterId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();

        await handler.HandleAsync(new ChapterSubmittedForReviewEvent(Guid.NewGuid(), chapterId, Guid.NewGuid(), requesterId, DateTime.UtcNow));

        var review = (await repository.ListAsync<EditorialReview>()).Should().ContainSingle().Subject;
        review.Status.Should().Be(EditorialReviewStatus.Pending);
        review.RequestedByUserId.Should().Be(requesterId);
        review.Status = EditorialReviewStatus.RevisionRequested;
        review.ReviewerUserId = Guid.NewGuid();
        review.DecisionNote = "Fix dialogue";

        await handler.HandleAsync(new ChapterSubmittedForReviewEvent(Guid.NewGuid(), chapterId, review.SeriesId, requesterId, DateTime.UtcNow));

        review.Status.Should().Be(EditorialReviewStatus.Pending);
        review.ReviewerUserId.Should().BeNull();
        review.DecisionNote.Should().BeNull();
    }

    [Fact]
    public async Task AssignedTantou_CanStartCommentAndApprove_AndPublishesApproval()
    {
        var editorId = Guid.NewGuid();
        var review = CreateReview(reviewerId: editorId);
        var context = CreateEditorialService(editorId, "TantouEditor", review);

        (await context.Service.StartReviewAsync(review.Id)).Value!.Status.Should().Be(EditorialReviewStatus.InReview);
        (await context.Service.AddCommentAsync(review.Id, new CreateEditorialCommentRequest { CommentText = "Looks good" })).IsSuccess.Should().BeTrue();
        var approved = await context.Service.ApproveAsync(review.Id, new DecisionRequest { DecisionNote = "Approved" });

        approved.IsSuccess.Should().BeTrue();
        approved.Value!.LatestComment!.CommentText.Should().Be("Looks good");
        context.Events.PublishedEvents.Should().ContainSingle(message => message is ChapterApprovedEvent);
    }

    [Fact]
    public async Task UnassignedTantou_CannotApproveReviewAssignedToAnotherEditor()
    {
        var review = CreateReview(reviewerId: Guid.NewGuid(), status: EditorialReviewStatus.InReview);
        var context = CreateEditorialService(Guid.NewGuid(), "TantouEditor", review);

        (await context.Service.ApproveAsync(review.Id, new DecisionRequest())).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task TantouQueue_IncludesPendingAndOwnAssignedReviewsOnly()
    {
        var editorId = Guid.NewGuid();
        var pending = CreateReview();
        var assignedToEditor = CreateReview(editorId, EditorialReviewStatus.InReview);
        var assignedToOtherEditor = CreateReview(Guid.NewGuid(), EditorialReviewStatus.InReview);
        var context = CreateEditorialService(editorId, "TantouEditor", pending, assignedToEditor, assignedToOtherEditor);

        var queue = await context.Service.GetAllAsync();

        queue.Value!.Select(review => review.Id).Should().BeEquivalentTo(new[] { pending.Id, assignedToEditor.Id });
    }

    [Fact]
    public async Task RevisionAndReject_RequireReason_AndPublishDecisionEvent()
    {
        var editorId = Guid.NewGuid();
        var review = CreateReview(reviewerId: editorId, status: EditorialReviewStatus.InReview);
        var context = CreateEditorialService(editorId, "TantouEditor", review);

        (await context.Service.RequestRevisionAsync(review.Id, new DecisionRequest())).IsSuccess.Should().BeFalse();
        var revision = await context.Service.RequestRevisionAsync(review.Id, new DecisionRequest { DecisionNote = "Correct panel order" });

        revision.IsSuccess.Should().BeTrue();
        context.Events.PublishedEvents.Should().ContainSingle();
        context.Events.PublishedEvents.Single().Should().BeOfType<ChapterReviewDecisionEvent>().Which.Decision.Should().Be("RevisionRequested");

        review.Status = EditorialReviewStatus.InReview;
        (await context.Service.RejectAsync(review.Id, new DecisionRequest())).IsSuccess.Should().BeFalse();
        (await context.Service.RejectAsync(review.Id, new DecisionRequest { DecisionNote = "Does not meet quality bar" })).IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task DecisionAndApprovalHandlers_UpdateMangaChapterStatus()
    {
        var chapterId = Guid.NewGuid();
        var repository = new FakeManagementRepository();
        repository.Seed(chapterId, new Chapter { Id = chapterId, SeriesId = Guid.NewGuid(), Title = "Chapter", Status = ChapterStatus.SubmittedForReview });

        var decisionHandler = new ChapterReviewDecisionEventHandler(repository, new FakeManagementUnitOfWork(), NullLogger<ChapterReviewDecisionEventHandler>.Instance);
        await decisionHandler.HandleAsync(new ChapterReviewDecisionEvent(Guid.NewGuid(), chapterId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "RevisionRequested", "Fix", DateTime.UtcNow));
        (await repository.GetByIdAsync<Chapter>(chapterId))!.Status.Should().Be(ChapterStatus.RevisionRequired);

        var approvalHandler = new ChapterApprovedEventHandler(repository, new FakeManagementUnitOfWork(), NullLogger<ChapterApprovedEventHandler>.Instance);
        await approvalHandler.HandleAsync(new ChapterApprovedEvent(Guid.NewGuid(), chapterId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow));
        (await repository.GetByIdAsync<Chapter>(chapterId))!.Status.Should().Be(ChapterStatus.Approved);
    }

    private static EditorialReview CreateReview(Guid? reviewerId = null, EditorialReviewStatus status = EditorialReviewStatus.Pending) => new()
    {
        ChapterId = Guid.NewGuid(), SeriesId = Guid.NewGuid(), RequestedByUserId = Guid.NewGuid(), ReviewerUserId = reviewerId, Status = status, CreatedAt = DateTime.UtcNow
    };

    private static EditorialContext CreateEditorialService(Guid userId, string role, params EditorialReview[] reviews)
    {
        var repository = new FakeEditorialRepository();
        foreach (var review in reviews) repository.Seed(review.Id, review);
        var user = new FakeCurrentUserService { UserId = userId };
        user.Roles.Add(role);
        var events = new FakeEventBus();
        var service = new EditorialReviewService(repository, new FakeEditorialUnitOfWork(), user, events, new FakeMangaLookupClient());
        return new EditorialContext(service, events);
    }

    private sealed record EditorialContext(EditorialReviewService Service, FakeEventBus Events);
}
