using Microsoft.EntityFrameworkCore;
using Manga.Editorial.Application.Abstractions;
using Manga.Editorial.Domain.Entities;

namespace Manga.Editorial.Infrastructure.Persistence;

public sealed class EditorialDbContext : DbContext, IEditorialUnitOfWork
{
    public EditorialDbContext(DbContextOptions<EditorialDbContext> options) : base(options) { }
    public DbSet<EditorialReview> EditorialReviews => Set<EditorialReview>();
    public DbSet<EditorialComment> EditorialComments => Set<EditorialComment>();
    public DbSet<BoardVote> BoardVotes => Set<BoardVote>();
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<PublicationSchedule> PublicationSchedules => Set<PublicationSchedule>();
    public DbSet<ReaderVote> ReaderVotes => Set<ReaderVote>();
    public DbSet<RankingSnapshot> RankingSnapshots => Set<RankingSnapshot>();
    public DbSet<RankingItem> RankingItems => Set<RankingItem>();
    public DbSet<CancellationWarning> CancellationWarnings => Set<CancellationWarning>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EditorialDbContext).Assembly);
    }
}
