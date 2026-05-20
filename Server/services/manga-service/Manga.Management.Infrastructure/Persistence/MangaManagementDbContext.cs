using Microsoft.EntityFrameworkCore;
using Manga.Management.Application.Abstractions;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Infrastructure.Persistence;

public sealed class MangaManagementDbContext : DbContext, IManagementUnitOfWork
{
    public MangaManagementDbContext(DbContextOptions<MangaManagementDbContext> options)
        : base(options)
    {
    }

    public DbSet<Studio> Studios => Set<Studio>();
    public DbSet<StudioMember> StudioMembers => Set<StudioMember>();
    public DbSet<Series> Series => Set<Series>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<Annotation> Annotations => Set<Annotation>();
    public DbSet<MangaTask> Tasks => Set<MangaTask>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<Revision> Revisions => Set<Revision>();
    public DbSet<InboxMessage> InboxMessages => Set<InboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MangaManagementDbContext).Assembly);
    }
}
