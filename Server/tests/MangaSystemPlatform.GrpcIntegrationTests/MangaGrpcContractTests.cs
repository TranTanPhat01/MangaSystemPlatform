using FluentAssertions;
using Grpc.Core;
using Manga.BuildingBlocks.Messaging;
using Manga.Contracts.Management.V1;
using Manga.Management.Api.GrpcServices;
using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Services;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;
using MangaSystemPlatform.GrpcIntegrationTests.TestSupport;
using Microsoft.Extensions.DependencyInjection;

namespace MangaSystemPlatform.GrpcIntegrationTests;

public sealed class MangaGrpcContractTests
{
    [Fact]
    public async Task GetSeriesById_WithExistingSeries_ReturnsSummary()
    {
        var series = CreateSeries();
        using var host = CreateHost(series: series);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var response = await client.GetSeriesByIdAsync(
            new GetSeriesByIdRequest { SeriesId = series.Id.ToString() },
            GrpcTestHost.ValidMetadata());

        response.SeriesId.Should().Be(series.Id.ToString());
        response.Title.Should().Be(series.Title);
        response.Status.Should().Be(series.Status.ToString());
        response.AuthorUserId.Should().Be(series.CreatedBy.ToString());
    }

    [Fact]
    public async Task GetSeriesById_WithMissingSeries_ReturnsEmptyResponse()
    {
        using var host = CreateHost();
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var response = await client.GetSeriesByIdAsync(
            new GetSeriesByIdRequest { SeriesId = Guid.NewGuid().ToString() },
            GrpcTestHost.ValidMetadata());

        response.SeriesId.Should().BeEmpty();
    }

    [Fact]
    public async Task GetChapterById_WithExistingChapter_ReturnsSummary()
    {
        var chapter = CreateChapter();
        using var host = CreateHost(chapter: chapter);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var response = await client.GetChapterByIdAsync(
            new GetChapterByIdRequest { ChapterId = chapter.Id.ToString() },
            GrpcTestHost.ValidMetadata());

        response.ChapterId.Should().Be(chapter.Id.ToString());
        response.SeriesId.Should().Be(chapter.SeriesId.ToString());
        response.Title.Should().Be(chapter.Title);
        response.Number.Should().Be(chapter.ChapterNumber);
        response.Status.Should().Be(chapter.Status.ToString());
    }

    [Fact]
    public async Task GetChapterById_WithMissingChapter_ReturnsEmptyResponse()
    {
        using var host = CreateHost();
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var response = await client.GetChapterByIdAsync(
            new GetChapterByIdRequest { ChapterId = Guid.NewGuid().ToString() },
            GrpcTestHost.ValidMetadata());

        response.ChapterId.Should().BeEmpty();
    }

    [Fact]
    public async Task ApplyProposalDecision_UpdatesSubmittedSeriesStatus()
    {
        var series = CreateSeries();
        series.Status = SeriesStatus.Submitted;
        using var host = CreateHost(series: series);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var response = await client.ApplyProposalDecisionAsync(
            new ApplyProposalDecisionRequest { SeriesId = series.Id.ToString(), Decision = "Approve", Reason = "Quorum reached" },
            GrpcTestHost.ValidMetadata());

        response.Applied.Should().BeTrue();
        series.Status.Should().Be(SeriesStatus.Approved);
    }

    [Fact]
    public async Task PublishChapter_UpdatesChapterAndReturnsSuccess()
    {
        var chapter = CreateChapter();
        chapter.Status = ChapterStatus.Approved;
        using var host = CreateHost(chapter: chapter);
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var response = await client.PublishChapterAsync(
            new PublishChapterRequest { ChapterId = chapter.Id.ToString() },
            GrpcTestHost.ValidMetadata());

        response.Published.Should().BeTrue();
        chapter.Status.Should().Be(ChapterStatus.Published);
    }

    [Fact]
    public async Task Request_WithWrongApiKey_ReturnsUnauthenticated()
    {
        using var host = CreateHost();
        var client = host.CreateClient(channel => new MangaManagementGrpcService.MangaManagementGrpcServiceClient(channel));

        var act = async () => await client.GetChapterByIdAsync(
            new GetChapterByIdRequest { ChapterId = Guid.NewGuid().ToString() },
            GrpcTestHost.WrongMetadata());

        (await act.Should().ThrowAsync<RpcException>()).Which.StatusCode.Should().Be(StatusCode.Unauthenticated);
    }

    private static GrpcTestHost CreateHost(Series? series = null, Chapter? chapter = null)
    {
        var repository = new FakeManagementRepository();
        var unitOfWork = new FakeManagementUnitOfWork();
        var eventBus = new FakeEventBus();
        if (series is not null)
        {
            repository.Seed(series.Id, series);
        }

        if (chapter is not null)
        {
            repository.Seed(chapter.Id, chapter);
        }

        return new GrpcTestHost(
            services =>
            {
                services.AddSingleton<IManagementRepository>(repository);
                services.AddSingleton<IManagementUnitOfWork>(unitOfWork);
                services.AddSingleton<IEventBus>(eventBus);
                services.AddSingleton<IChapterService>(new ChapterService(repository, unitOfWork, eventBus, new FakeManagementAccessService()));
            },
            endpoints => endpoints.MapGrpcService<MangaManagementGrpcServiceImpl>());
    }

    private static Series CreateSeries() => new()
    {
        Id = Guid.NewGuid(),
        Title = "Blue Ink",
        Status = SeriesStatus.Ongoing,
        CreatedBy = Guid.NewGuid()
    };

    private static Chapter CreateChapter() => new()
    {
        Id = Guid.NewGuid(),
        SeriesId = Guid.NewGuid(),
        Title = "Chapter One",
        ChapterNumber = 1,
        Status = ChapterStatus.Draft
    };
}
