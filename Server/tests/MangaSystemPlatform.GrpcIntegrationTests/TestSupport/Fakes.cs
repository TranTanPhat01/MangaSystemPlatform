using System.Linq.Expressions;
using Manga.BuildingBlocks.Messaging;
using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Application.Services;
using Manga.File.Application.Abstractions;
using Manga.File.Domain.Entities;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Domain.Entities;
using Manga.Management.Application.Abstractions;

namespace MangaSystemPlatform.GrpcIntegrationTests.TestSupport;

internal sealed class FakeUserRepository : IUserRepository
{
    private readonly Dictionary<Guid, User> _users = new();

    public void Add(User user) => _users[user.Id] = user;

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        Task.FromResult(_users.Values.Any(user => user.Email == email));

    public Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<User>>(_users.Values.ToArray());

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        Task.FromResult(_users.Values.FirstOrDefault(user => user.Email == email));

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult(_users.GetValueOrDefault(id));

    public Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        Add(user);
        return Task.CompletedTask;
    }
}

internal sealed class FakeFileAssetRepository : IFileAssetRepository
{
    private readonly Dictionary<Guid, FileAsset> _files = new();
    private readonly Dictionary<Guid, List<FileVersion>> _versions = new();

    public void Add(FileAsset fileAsset) => _files[fileAsset.Id] = fileAsset;

    public Task<FileAsset?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult(_files.GetValueOrDefault(id));

    public Task<IReadOnlyList<FileAsset>> GetByUploaderAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<FileAsset>>(_files.Values.Where(file => file.UploadedByUserId == userId).ToArray());

    public Task<IReadOnlyList<FileVersion>> GetVersionsAsync(Guid fileAssetId, CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<FileVersion>>(_versions.GetValueOrDefault(fileAssetId) ?? new List<FileVersion>());

    public Task<int> GetNextVersionNumberAsync(Guid fileAssetId, CancellationToken cancellationToken = default) =>
        Task.FromResult((_versions.GetValueOrDefault(fileAssetId)?.Count ?? 0) + 1);

    public Task AddAsync(FileAsset fileAsset, CancellationToken cancellationToken = default)
    {
        Add(fileAsset);
        return Task.CompletedTask;
    }

    public Task AddVersionAsync(FileVersion fileVersion, CancellationToken cancellationToken = default)
    {
        if (!_versions.TryGetValue(fileVersion.FileAssetId, out var versions))
        {
            versions = new List<FileVersion>();
            _versions[fileVersion.FileAssetId] = versions;
        }

        versions.Add(fileVersion);
        return Task.CompletedTask;
    }
}

internal sealed class FakeManagementRepository : IManagementRepository
{
    private readonly Dictionary<Type, Dictionary<Guid, object>> _sets = new();

    public IReadOnlyList<object> AddedEntities { get; private set; } = Array.Empty<object>();

    public void Seed<T>(Guid id, T entity)
        where T : class
    {
        GetSet(typeof(T))[id] = entity;
    }

    public Task<T?> GetByIdAsync<T>(Guid id, CancellationToken cancellationToken = default)
        where T : class =>
        Task.FromResult(GetSet(typeof(T)).GetValueOrDefault(id) as T);

    public Task<IReadOnlyList<T>> ListAsync<T>(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
        where T : class
    {
        var values = GetSet(typeof(T)).Values.Cast<T>();
        if (predicate is not null)
        {
            values = values.Where(predicate.Compile());
        }

        return Task.FromResult<IReadOnlyList<T>>(values.ToArray());
    }

    public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default)
        where T : class
    {
        var idProperty = typeof(T).GetProperty("Id");
        if (idProperty?.GetValue(entity) is Guid id)
        {
            GetSet(typeof(T))[id] = entity;
        }

        AddedEntities = AddedEntities.Concat(new object[] { entity }).ToArray();
        return Task.CompletedTask;
    }

    public void Remove<T>(T entity)
        where T : class
    {
    }

    private Dictionary<Guid, object> GetSet(Type type)
    {
        if (!_sets.TryGetValue(type, out var set))
        {
            set = new Dictionary<Guid, object>();
            _sets[type] = set;
        }

        return set;
    }
}

internal sealed class FakeManagementUnitOfWork : IManagementUnitOfWork
{
    public int SaveChangesCalls { get; private set; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCalls++;
        return Task.FromResult(1);
    }
}

internal sealed class FakeEditorialRepository : IEditorialRepository
{
    public List<object> AddedEntities { get; } = new();

    public Task<T?> GetByIdAsync<T>(Guid id, CancellationToken cancellationToken = default)
        where T : class =>
        Task.FromResult<T?>(null);

    public Task<IReadOnlyList<T>> ListAsync<T>(
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
        where T : class =>
        Task.FromResult<IReadOnlyList<T>>(Array.Empty<T>());

    public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default)
        where T : class
    {
        AddedEntities.Add(entity);
        return Task.CompletedTask;
    }
}

internal sealed class FakeEditorialUnitOfWork : IEditorialUnitOfWork
{
    public int SaveChangesCalls { get; private set; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCalls++;
        return Task.FromResult(1);
    }
}

internal sealed class FakeEventBus : IEventBus
{
    public List<object> PublishedEvents { get; } = new();

    public Task PublishAsync<TEvent>(TEvent eventMessage, CancellationToken cancellationToken = default)
    {
        if (eventMessage is not null)
        {
            PublishedEvents.Add(eventMessage);
        }

        return Task.CompletedTask;
    }
}

internal sealed class FakeCurrentUserService : ICurrentUserService
{
    public Guid UserId { get; set; } = Guid.NewGuid();
}

internal sealed class FakeIdentityLookupClient : IIdentityLookupClient
{
    public bool Exists { get; set; } = true;
    public bool HasRole { get; set; } = true;

    public Task<bool> CheckUserExistsAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Exists);

    public Task<Manga.Management.Application.DTOs.UserSummaryDto?> GetUserSummaryAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult<Manga.Management.Application.DTOs.UserSummaryDto?>(null);

    public Task<bool> CheckUserRoleAsync(Guid userId, string role, CancellationToken cancellationToken = default) =>
        Task.FromResult(HasRole);
}

internal sealed class FakeFileLookupClient : IFileLookupClient
{
    public bool Exists { get; set; } = true;

    public Task<bool> FileExistsAsync(Guid fileId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Exists);

    public Task<Manga.Management.Application.DTOs.FileMetadataDto?> GetFileMetadataAsync(Guid fileId, CancellationToken cancellationToken = default) =>
        Task.FromResult<Manga.Management.Application.DTOs.FileMetadataDto?>(null);
}

internal sealed class FakeMangaLookupClient : IMangaLookupClient
{
    public Manga.Editorial.Application.DTOs.SeriesSummaryDto? Series { get; set; }
    public Manga.Editorial.Application.DTOs.ChapterSummaryDto? Chapter { get; set; }

    public Task<Manga.Editorial.Application.DTOs.SeriesSummaryDto?> GetSeriesByIdAsync(Guid seriesId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Series);

    public Task<Manga.Editorial.Application.DTOs.ChapterSummaryDto?> GetChapterByIdAsync(Guid chapterId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Chapter);
}
