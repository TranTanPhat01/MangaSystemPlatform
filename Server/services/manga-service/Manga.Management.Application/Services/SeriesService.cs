using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;
using Manga.Management.Domain.Enums;

namespace Manga.Management.Application.Services;

public sealed class SeriesService : ISeriesService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;
    private readonly IManagementAccessService _access;

    public SeriesService(IManagementRepository repository, IManagementUnitOfWork unitOfWork, IManagementAccessService access)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _access = access;
    }

    public async Task<Result<SeriesResponse>> CreateAsync(CreateSeriesRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Studio>(request.StudioId, cancellationToken) is null)
            return Result<SeriesResponse>.Failure("Studio not found.");
        if (!await _access.CanManageStudioAsync(request.StudioId, cancellationToken))
            return Result<SeriesResponse>.Failure("You do not have access to this studio.");

        var series = new Series { StudioId = request.StudioId, Title = request.Title.Trim(), Description = request.Description, Genre = request.Genre, CreatedBy = currentUserId, CreatedAt = DateTime.UtcNow };
        await _repository.AddAsync(series, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<SeriesResponse>.Success(ToResponse(series));
    }

    public async Task<Result<IReadOnlyList<SeriesResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var results = new List<SeriesResponse>();
        foreach (var series in await _repository.ListAsync<Series>(cancellationToken: cancellationToken))
            if (await _access.CanAccessSeriesAsync(series.Id, cancellationToken)) results.Add(ToResponse(series));
        return Result<IReadOnlyList<SeriesResponse>>.Success(results);
    }

    public async Task<Result<SeriesResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var series = await _repository.GetByIdAsync<Series>(id, cancellationToken);
        return series is null || !await _access.CanAccessSeriesAsync(id, cancellationToken)
            ? Result<SeriesResponse>.Failure("Series not found.")
            : Result<SeriesResponse>.Success(ToResponse(series));
    }

    public async Task<Result<SeriesResponse>> UpdateAsync(Guid id, UpdateSeriesRequest request, CancellationToken cancellationToken = default)
    {
        var series = await _repository.GetByIdAsync<Series>(id, cancellationToken);
        if (series is null) return Result<SeriesResponse>.Failure("Series not found.");
        if (!await _access.CanManageSeriesAsync(id, cancellationToken)) return Result<SeriesResponse>.Failure("You do not have permission to update this series.");

        series.Title = string.IsNullOrWhiteSpace(request.Title) ? series.Title : request.Title.Trim();
        series.Description = request.Description ?? series.Description;
        series.Genre = request.Genre ?? series.Genre;
        series.Status = request.Status ?? series.Status;
        series.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<SeriesResponse>.Success(ToResponse(series));
    }

    public async Task<Result<SeriesResponse>> SubmitProposalAsync(Guid id, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var series = await _repository.GetByIdAsync<Series>(id, cancellationToken);
        if (series is null) return Result<SeriesResponse>.Failure("Series not found.");
        if (!await _access.CanManageSeriesAsync(id, cancellationToken)) return Result<SeriesResponse>.Failure("Only the series owner can submit this proposal.");
        if (series.Status is not (SeriesStatus.Draft or SeriesStatus.RevisionRequested)) return Result<SeriesResponse>.Failure("Only draft or revision-requested series can be submitted as proposals.");

        series.Status = SeriesStatus.Submitted;
        series.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<SeriesResponse>.Success(ToResponse(series));
    }

    public Task<Result<SeriesResponse>> ApproveProposalAsync(Guid id, SeriesDecisionRequest request, Guid currentUserId, CancellationToken cancellationToken = default) => DecideProposalAsync(id, SeriesStatus.Approved, cancellationToken);
    public Task<Result<SeriesResponse>> RejectProposalAsync(Guid id, SeriesDecisionRequest request, Guid currentUserId, CancellationToken cancellationToken = default) => DecideProposalAsync(id, SeriesStatus.Rejected, cancellationToken);

    private async Task<Result<SeriesResponse>> DecideProposalAsync(Guid id, SeriesStatus targetStatus, CancellationToken cancellationToken)
    {
        if (!_access.CanViewBoardData) return Result<SeriesResponse>.Failure("Only Editorial Board members can decide proposals.");
        var series = await _repository.GetByIdAsync<Series>(id, cancellationToken);
        if (series is null) return Result<SeriesResponse>.Failure("Series not found.");
        if (series.Status != SeriesStatus.Submitted) return Result<SeriesResponse>.Failure("Only submitted series proposals can be decided.");
        series.Status = targetStatus;
        series.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<SeriesResponse>.Success(ToResponse(series));
    }

    private static SeriesResponse ToResponse(Series series) => new() { Id = series.Id, StudioId = series.StudioId, Title = series.Title, Description = series.Description, Genre = series.Genre, Status = series.Status, CreatedBy = series.CreatedBy, CreatedAt = series.CreatedAt, UpdatedAt = series.UpdatedAt };
}
