using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class SeriesService : ISeriesService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;

    public SeriesService(IManagementRepository repository, IManagementUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<SeriesResponse>> CreateAsync(CreateSeriesRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        if (await _repository.GetByIdAsync<Studio>(request.StudioId, cancellationToken) is null)
        {
            return Result<SeriesResponse>.Failure("Studio not found.");
        }

        var series = new Series
        {
            StudioId = request.StudioId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Genre = request.Genre,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(series, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<SeriesResponse>.Success(ToResponse(series));
    }

    public async Task<Result<IReadOnlyList<SeriesResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var series = await _repository.ListAsync<Series>(cancellationToken: cancellationToken);
        return Result<IReadOnlyList<SeriesResponse>>.Success(series.Select(ToResponse).ToArray());
    }

    public async Task<Result<SeriesResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var series = await _repository.GetByIdAsync<Series>(id, cancellationToken);
        return series is null
            ? Result<SeriesResponse>.Failure("Series not found.")
            : Result<SeriesResponse>.Success(ToResponse(series));
    }

    public async Task<Result<SeriesResponse>> UpdateAsync(Guid id, UpdateSeriesRequest request, CancellationToken cancellationToken = default)
    {
        var series = await _repository.GetByIdAsync<Series>(id, cancellationToken);
        if (series is null)
        {
            return Result<SeriesResponse>.Failure("Series not found.");
        }

        series.Title = string.IsNullOrWhiteSpace(request.Title) ? series.Title : request.Title.Trim();
        series.Description = request.Description ?? series.Description;
        series.Genre = request.Genre ?? series.Genre;
        series.Status = request.Status ?? series.Status;
        series.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<SeriesResponse>.Success(ToResponse(series));
    }

    private static SeriesResponse ToResponse(Series series) => new()
    {
        Id = series.Id,
        StudioId = series.StudioId,
        Title = series.Title,
        Description = series.Description,
        Genre = series.Genre,
        Status = series.Status,
        CreatedBy = series.CreatedBy,
        CreatedAt = series.CreatedAt,
        UpdatedAt = series.UpdatedAt
    };
}
