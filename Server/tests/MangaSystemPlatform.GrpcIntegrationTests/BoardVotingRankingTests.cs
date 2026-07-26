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
    public async Task BoardCanVote_AndCanChangeVote_AndRejectOrRevisionRequireReason()
    {
        var repository = new FakeEditorialRepository();
        var user = BoardUser();
        var seriesId = Guid.NewGuid();
        var manga = new FakeMangaLookupClient { Series = new SeriesSummaryDto { SeriesId = seriesId, Status = "Submitted" } };
        var service = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), user, manga, new FakeEventBus());

        // First vote Approve
        (await service.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve })).IsSuccess.Should().BeTrue();
        
        // Second vote Approve (Change Vote) - should succeed and update
        (await service.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve })).IsSuccess.Should().BeTrue();
        
        var secondBoard = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, new FakeEventBus());
        // Reject without note should fail
        (await secondBoard.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Reject })).IsSuccess.Should().BeFalse();
        // RequestRevision with note should succeed
        (await secondBoard.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.RequestRevision, Note = "Clarify target audience" })).IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task NonBoardCannotVote_AndProposalCannotFinalizeBeforeQuorum()
    {
        var repository = new FakeEditorialRepository();
        var seriesId = Guid.NewGuid();
        var manga = new FakeMangaLookupClient { Series = new SeriesSummaryDto { SeriesId = seriesId, Status = "Submitted" } };
        var nonBoard = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), new FakeCurrentUserService(), manga, new FakeEventBus());
        (await nonBoard.VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve })).IsSuccess.Should().BeFalse();

        var board = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, new FakeEventBus());
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
    public async Task VoteProposal_WithAbstain_CountsAsBlankAndExcludesFromQuorum()
    {
        var repository = new FakeEditorialRepository();
        var seriesId = Guid.NewGuid();
        var manga = new FakeMangaLookupClient { Series = new SeriesSummaryDto { SeriesId = seriesId, AuthorUserId = Guid.NewGuid(), Status = "Submitted" } };
        var events = new FakeEventBus();

        // 2 Approve, 1 Abstain. Total votes = 3, but active votes (Approve + Reject + Revision) = 2. Quorum minimum is 3 active votes.
        var user1 = BoardUser();
        var user2 = BoardUser();
        var user3 = BoardUser();

        await new BoardVoteService(repository, new FakeEditorialUnitOfWork(), user1, manga, events).VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve });
        await new BoardVoteService(repository, new FakeEditorialUnitOfWork(), user2, manga, events).VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve });
        await new BoardVoteService(repository, new FakeEditorialUnitOfWork(), user3, manga, events).VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Abstain });

        var finalizer = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, events);
        var result = await finalizer.FinalizeProposalAsync(seriesId, new FinalizeProposalRequest());

        // Should fail because active votes (2) < Quorum (3)
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("quorum has not been reached");
    }

    [Fact]
    public async Task FinalizeProposal_WithTie_RecommendationIsPending()
    {
        var repository = new FakeEditorialRepository();
        var seriesId = Guid.NewGuid();
        var manga = new FakeMangaLookupClient { Series = new SeriesSummaryDto { SeriesId = seriesId, AuthorUserId = Guid.NewGuid(), Status = "Submitted" } };
        var events = new FakeEventBus();

        // 1 Approve, 1 Reject (with note), 1 Revision (with note). Active votes = 3 (Quorum met), but tie exists.
        await new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, events).VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Approve });
        await new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, events).VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.Reject, Note = "Too violent" });
        await new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, events).VoteAsync(seriesId, new BoardVoteRequest { VoteValue = BoardVoteValue.RequestRevision, Note = "Redraw covers" });

        var finalizer = new BoardVoteService(repository, new FakeEditorialUnitOfWork(), BoardUser(), manga, events);
        var result = await finalizer.FinalizeProposalAsync(seriesId, new FinalizeProposalRequest());

        // Recommendation is tied, so FinalRecommendation is Pending, finalize fails without Admin Override
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("has no final recommendation");
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
        
        // Cannot schedule if series not approved
        (await publication.CreateScheduleAsync(new CreatePublicationScheduleRequest { SeriesId = seriesId, ChapterId = chapterId, PublicationType = PublicationType.Weekly, ScheduledDate = DateTime.UtcNow.AddDays(1) })).IsSuccess.Should().BeFalse();
        
        manga.Series.Status = "Approved";
        
        // Past date scheduled by non-admin should fail
        (await publication.CreateScheduleAsync(new CreatePublicationScheduleRequest { SeriesId = seriesId, ChapterId = chapterId, PublicationType = PublicationType.Weekly, ScheduledDate = DateTime.UtcNow.AddDays(-2) })).IsSuccess.Should().BeFalse();

        // Valid future date succeeds
        (await publication.CreateScheduleAsync(new CreatePublicationScheduleRequest { SeriesId = seriesId, ChapterId = chapterId, PublicationType = PublicationType.Weekly, ScheduledDate = DateTime.UtcNow.AddDays(2) })).IsSuccess.Should().BeTrue();

        // Duplicate active schedule fails
        (await publication.CreateScheduleAsync(new CreatePublicationScheduleRequest { SeriesId = seriesId, ChapterId = chapterId, PublicationType = PublicationType.Weekly, ScheduledDate = DateTime.UtcNow.AddDays(3) })).IsSuccess.Should().BeFalse();

        var events = new FakeEventBus();
        var ranking = new RankingService(repository, new FakeEditorialUnitOfWork(), board, events, manga);
        var issueId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, IssueNumber = "Vol-1", Title = "Issue 1", Status = IssueStatus.Released });
        (await ranking.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 2 })).IsSuccess.Should().BeTrue();
        (await ranking.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 3 })).IsSuccess.Should().BeTrue();
        var votesList = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId && v.SeriesId == seriesId);
        votesList[0].VoteCount.Should().Be(3);
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

    [Fact]
    public async Task ReaderVote_WithEmptyReaderId_Fails()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });

        var board = BoardUser();
        var service = new RankingService(repository, new FakeEditorialUnitOfWork(), board, new FakeEventBus(), new FakeMangaLookupClient());

        var result = await service.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, ReaderId = Guid.Empty, VoteCount = 1 });

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("ReaderId is required");
        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId);
        votes.Should().BeEmpty();
    }

    [Fact]
    public async Task ReaderVote_CurrentUserGuidEmpty_Fails()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });

        var reader = new FakeCurrentUserService { UserId = Guid.Empty };
        var service = new RankingService(repository, new FakeEditorialUnitOfWork(), reader, new FakeEventBus(), new FakeMangaLookupClient());

        var result = await service.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("ReaderId is required");
        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId);
        votes.Should().BeEmpty();
    }

    [Fact]
    public async Task ReaderA_Vote_DoesNotOverwriteReaderBVote()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });
        
        var readerA = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var readerB = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        
        var serviceA = new RankingService(repository, new FakeEditorialUnitOfWork(), readerA, new FakeEventBus(), new FakeMangaLookupClient());
        var serviceB = new RankingService(repository, new FakeEditorialUnitOfWork(), readerB, new FakeEventBus(), new FakeMangaLookupClient());
        
        await serviceA.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        await serviceB.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        
        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId && v.SeriesId == seriesId);
        votes.Should().HaveCount(2);
    }

    [Fact]
    public async Task TwoReadersVoting_CreateTwoDistinctRecords()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });
        
        var readerA = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var readerB = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        
        var serviceA = new RankingService(repository, new FakeEditorialUnitOfWork(), readerA, new FakeEventBus(), new FakeMangaLookupClient());
        var serviceB = new RankingService(repository, new FakeEditorialUnitOfWork(), readerB, new FakeEventBus(), new FakeMangaLookupClient());
        
        await serviceA.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        await serviceB.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        
        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId);
        votes.Should().HaveCount(2);
        votes.Select(v => v.ReaderId).Distinct().Should().HaveCount(2);
    }

    [Fact]
    public async Task ReaderCanOnlyUpdateOwnVote()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });
        
        var reader = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var service = new RankingService(repository, new FakeEditorialUnitOfWork(), reader, new FakeEventBus(), new FakeMangaLookupClient());
        
        await service.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        await service.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 5 });
        
        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId && v.SeriesId == seriesId);
        votes.Should().HaveCount(1);
        votes[0].VoteCount.Should().Be(5);
    }

    [Fact]
    public async Task ReaderCannotUpdateAnotherReadersVote()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });
        
        var readerA = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var readerB = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        
        var serviceA = new RankingService(repository, new FakeEditorialUnitOfWork(), readerA, new FakeEventBus(), new FakeMangaLookupClient());
        var serviceB = new RankingService(repository, new FakeEditorialUnitOfWork(), readerB, new FakeEventBus(), new FakeMangaLookupClient());
        
        await serviceA.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        
        var result = await serviceB.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 5, ReaderId = readerA.UserId });
        
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("cannot submit votes for another user");

        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId && v.SeriesId == seriesId);
        votes.Should().HaveCount(1);
        votes[0].VoteCount.Should().Be(1);
    }

    [Fact]
    public async Task ConcurrentVotesFromDifferentReaders_BothPersist()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });
        
        var readerA = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var readerB = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        
        var serviceA = new RankingService(repository, new FakeEditorialUnitOfWork(), readerA, new FakeEventBus(), new FakeMangaLookupClient());
        var serviceB = new RankingService(repository, new FakeEditorialUnitOfWork(), readerB, new FakeEventBus(), new FakeMangaLookupClient());
        
        var task1 = serviceA.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        var task2 = serviceB.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        
        await Task.WhenAll(task1, task2);
        
        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId && v.SeriesId == seriesId);
        votes.Should().HaveCount(2);
    }

    [Fact]
    public async Task ConcurrentVotesFromSameReader_CreateOneRecord()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });
        
        var reader = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var service = new RankingService(repository, new FakeEditorialUnitOfWork(), reader, new FakeEventBus(), new FakeMangaLookupClient());
        
        var task1 = service.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 1 });
        var task2 = service.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 2 });
        
        await Task.WhenAll(task1, task2);
        
        var votes = await repository.ListAsync<ReaderVote>(v => v.IssueId == issueId && v.SeriesId == seriesId);
        votes.Should().HaveCount(1);
    }

    [Fact]
    public async Task VoteCount_EqualsDistinctReaderCount()
    {
        var repository = new FakeEditorialRepository();
        var issueId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        var board = BoardUser();
        repository.Seed(issueId, new Issue { Id = issueId, Status = IssueStatus.Released });
        
        var readerA = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        var readerB = new FakeCurrentUserService { UserId = Guid.NewGuid() };
        
        var serviceA = new RankingService(repository, new FakeEditorialUnitOfWork(), readerA, new FakeEventBus(), new FakeMangaLookupClient());
        var serviceB = new RankingService(repository, new FakeEditorialUnitOfWork(), readerB, new FakeEventBus(), new FakeMangaLookupClient());
        
        await serviceA.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 10 });
        await serviceB.AddReaderVoteAsync(issueId, new ReaderVoteRequest { SeriesId = seriesId, VoteCount = 20 });
        
        var ranking = new RankingService(repository, new FakeEditorialUnitOfWork(), board, new FakeEventBus(), new FakeMangaLookupClient());
        var snapshot = await ranking.CalculateRankingAsync(issueId);
        
        snapshot.IsSuccess.Should().BeTrue();
        snapshot.Value!.Items.First().VoteCount.Should().Be(2);
    }
}
