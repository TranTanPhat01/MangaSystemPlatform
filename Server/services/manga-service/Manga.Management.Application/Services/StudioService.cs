using Manga.Management.Application.Abstractions;
using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Services;

public sealed class StudioService : IStudioService
{
    private readonly IManagementRepository _repository;
    private readonly IManagementUnitOfWork _unitOfWork;

    public StudioService(IManagementRepository repository, IManagementUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<StudioResponse>> CreateAsync(CreateStudioRequest request, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var studio = new Studio
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            OwnerId = currentUserId,
            CreatedAt = DateTime.UtcNow,
            Members = new List<StudioMember>
            {
                new() { UserId = currentUserId, Role = "Owner", JoinedAt = DateTime.UtcNow }
            }
        };

        await _repository.AddAsync(studio, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<StudioResponse>.Success(ToResponse(studio));
    }

    public async Task<Result<IReadOnlyList<StudioResponse>>> GetMineAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var studios = await _repository.ListAsync<Studio>(
            studio => studio.OwnerId == currentUserId || studio.Members.Any(member => member.UserId == currentUserId),
            cancellationToken);

        return Result<IReadOnlyList<StudioResponse>>.Success(studios.Select(ToResponse).ToArray());
    }

    public async Task<Result<StudioResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var studio = await _repository.GetByIdAsync<Studio>(id, cancellationToken);
        return studio is null
            ? Result<StudioResponse>.Failure("Studio not found.")
            : Result<StudioResponse>.Success(ToResponse(studio));
    }

    public async Task<Result<StudioResponse>> AddMemberAsync(Guid studioId, AddStudioMemberRequest request, CancellationToken cancellationToken = default)
    {
        var studio = await _repository.GetByIdAsync<Studio>(studioId, cancellationToken);
        if (studio is null)
        {
            return Result<StudioResponse>.Failure("Studio not found.");
        }

        var existingMembers = await _repository.ListAsync<StudioMember>(
            member => member.StudioId == studioId && member.UserId == request.UserId,
            cancellationToken);
        if (existingMembers.Count > 0)
        {
            return Result<StudioResponse>.Failure("User is already a studio member.");
        }

        await _repository.AddAsync(new StudioMember
        {
            StudioId = studioId,
            UserId = request.UserId,
            Role = request.Role.Trim(),
            JoinedAt = DateTime.UtcNow
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<StudioResponse>.Success(ToResponse(studio));
    }

    private static StudioResponse ToResponse(Studio studio) => new()
    {
        Id = studio.Id,
        Name = studio.Name,
        Description = studio.Description,
        OwnerId = studio.OwnerId,
        CreatedAt = studio.CreatedAt,
        UpdatedAt = studio.UpdatedAt
    };
}
