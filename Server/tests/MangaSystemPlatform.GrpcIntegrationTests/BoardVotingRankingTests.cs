using FluentAssertions;
using Manga.Contracts.Events;
using Manga.Editorial.Application.DTOs;
using Manga.Editorial.Application.Services;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class BoardVotingRankingTests
{
    [Fact]
    public async Task BoardCanVoteOnce_AndRejectOrRevisionRequireReason()
    {
        var repository = new FakeEditorialRepository();
        var user = BoardUser();
        var service = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), user, new FakeMangaLookupClient(), new FakeEventBus());
        var seriesId = Guid.NewGuid();

        (await service.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve })).IsSuccess.Should().BeTrue();
        (await service.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve })).IsSuccess.Should().BeFalse();
        var secondBoard = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), new FakeMangaLookupClient(), new FakeEventBus());
        (await secondBoard.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Reject })).IsSuccess.Should().BeFalse();
        (await secondBoard.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.RequestRevision, Note = "Clarify target audience" })).IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task NonBoardCannotVote_AndProposalCannotFinalizeBeforeQuorum()
    {
        var repository = new FakeEditorialRepository();
        var nonBoard = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), new FakeCurrentUserService(), new FakeMangaLookupClient(), new FakeEventBus());
        (await nonBoard.VoteAsync(Guid.NewGuid(), new BoardVoteRequest { VoteValue = BoardVoteValue.Approve })).IsSuccess.Should().BeFalse();

        var manga = new FakeMangaLookupClient();
        var board = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, new FakeEventBus());
        var seriesId = Guid.NewGuid();
        await board.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve });
        (await board.FinalizeProposalAsync(seriesId, new FinalizeProposalRequest())).IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task QuorumApproval_FinalizesProposalThroughMangaBridge()
    {
        var repository = new FakeEditorialRepository();
        var seriesId = Guid.NewGuid();
        var manga = new FakeMangaLookupClient { Series = new SeriesSummaryDto { SeriesId = seriesId, AuthorUserId = Guid.NewGuid(), Status = "Submitted" } };
        var events = new FakeEventBus();
        for (var index = 0; index < 3; index++)
        {
            var service = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, events);
            (await service.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve })).IsSuccess.Should().BeTrue();
        }

        var finalizer = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, events);
        var result = await finalizer.FinalizeProposalAsync(seriesId, new FinalizeProposalRequest());

        result.IsSuccess.Should().BeTrue();
        result.Value!.QuorumReached.Should().BeTrue();
        result.Value.FinalRecommendation.Should().Be("Approve");
        manga.ProposalDecision.Should().Be("Approve");
        events.PublishedEvents.Should().ContainSingle(message => message is SeriesProposalDecidedEvent);
    }

    [Fact]
    public async Task ScheduleRequiresApprovedSeries_AndRankingCreatesItemsAndWarning()
    {
        var board = BoardUser();
        var repository = new FakeEditorialRepository();
        var seriesId = Guid.NewGuid();
        var chapterId = Guid.NewGuid();
        repository.Seed(Guid.NewGuid(), new EditorialReview { SeriesId = seriesId, ChapterId = chapterId, Status = EditorialReviewStatus.Approved });
        var manga = new FakeMangaLookupClient { Series = new SeriesSummaryDto { SeriesId = seriesId, Status = "Submitted" } };
        var publication = new PublicationService(repository, new FakeEditorialUnitOfWork(), board, manga);
        (await publication.CreateScheduleAsync(new CreatePublicationScheduleRequest { SeriesId = seriesId, ChapterId = chapterId, PublicationType = PublicationType.Weekly, ScheduledDate = DateTime.UtcNow })).IsSuccess.Should().BeFalse();
        manga.Series.Status = "Approved";
        var scheduled = await publication.CreateScheduleAsync(new CreatePublicationScheduleRequest { SeriesId = seriesId, ChapterId = chapterId, PublicationType = PublicationType.Weekly, ScheduledDate = DateTime.UtcNow });
        scheduled.IsSuccess.Should().BeTrue();
        var published = await publication.PublishAsync(scheduled.Value!.Id);
        published.IsSuccess.Should().BeTrue();
        published.Value!.Status.Should().Be(PublicationStatus.Published);
        manga.PublishedChapterId.Should().Be(chapterId);

        var events = new FakeEventBus();
        var ranking = new RankingService(repository, new FakeEditorialUnitOfWork(), board, events);
        var issueId = Guid.NewGuid();
        (await ranking.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 2 })).IsSuccess.Should().BeTrue();
        (await ranking.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 3 })).IsSuccess.Should().BeFalse();
        var secondSeries = Guid.NewGuid();
        await ranking.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = secondSeries, VoteCount = 1 });
        var snapshot = await ranking.CalculateRankingAsync(issueId);

        snapshot.IsSuccess.Should().BeTrue();
        snapshot.Value!.Items.Should().HaveCount(2);
        events.PublishedEvents.Should().Contain(message => message is RankingCalculatedEvent);
        events.PublishedEvents.Should().Contain(message => message is CancellationWarningCreatedEvent);
    }

    private static FakeCurrentUserService BoardUser()
    {
        var user = new FakeCurrentUserService();
        user.Roles.Add("EditorialBoard");
        return user;
    }
}
