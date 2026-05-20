using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Manga.Editorial.Domain.Entities;
using Manga.Editorial.Domain.Enums;

namespace Manga.Editorial.Infrastructure.Persistence.Configurations;

internal sealed class EditorialReviewConfiguration : IEntityTypeConfiguration<EditorialReview>
{
    public void Configure(EntityTypeBuilder<EditorialReview> b)
    {
        b.ToTable("editorial_reviews"); b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id"); b.Property(x => x.ChapterId).HasColumnName("chapter_id");
        b.Property(x => x.SeriesId).HasColumnName("series_id"); b.Property(x => x.RequestedByUserId).HasColumnName("requested_by_user_id");
        b.Property(x => x.ReviewerUserId).HasColumnName("reviewer_user_id"); b.Property(x => x.Status).HasColumnName("status").HasConversion(v => v.ToString(), v => Enum.Parse<EditorialReviewStatus>(v)).HasMaxLength(64);
        b.Property(x => x.DecisionNote).HasColumnName("decision_note").HasMaxLength(2000); b.Property(x => x.CreatedAt).HasColumnName("created_at"); b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
    }
}
internal sealed class EditorialCommentConfiguration : IEntityTypeConfiguration<EditorialComment>
{
    public void Configure(EntityTypeBuilder<EditorialComment> b)
    {
        b.ToTable("editorial_comments"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ReviewId).HasColumnName("review_id"); b.Property(x => x.PageId).HasColumnName("page_id"); b.Property(x => x.AnnotationId).HasColumnName("annotation_id");
        b.Property(x => x.CommentText).HasColumnName("comment_text").HasMaxLength(4000).IsRequired(); b.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        b.Property(x => x.IsResolved).HasColumnName("is_resolved"); b.Property(x => x.CreatedAt).HasColumnName("created_at"); b.Property(x => x.ResolvedAt).HasColumnName("resolved_at");
        b.HasOne(x => x.Review).WithMany(x => x.Comments).HasForeignKey(x => x.ReviewId).OnDelete(DeleteBehavior.Cascade);
    }
}
internal sealed class BoardVoteConfiguration : IEntityTypeConfiguration<BoardVote>
{
    public void Configure(EntityTypeBuilder<BoardVote> b)
    {
        b.ToTable("board_votes"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.SeriesId).HasColumnName("series_id"); b.Property(x => x.ProposalId).HasColumnName("proposal_id"); b.Property(x => x.VoterUserId).HasColumnName("voter_user_id");
        b.Property(x => x.VoteValue).HasColumnName("vote_value").HasConversion(v => v.ToString(), v => Enum.Parse<BoardVoteValue>(v)).HasMaxLength(64);
        b.Property(x => x.Note).HasColumnName("note").HasMaxLength(2000); b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasIndex(x => new { x.SeriesId, x.ProposalId, x.VoterUserId }).IsUnique();
    }
}
internal sealed class IssueConfiguration : IEntityTypeConfiguration<Issue>
{
    public void Configure(EntityTypeBuilder<Issue> b)
    {
        b.ToTable("issues"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.IssueNumber).HasColumnName("issue_number").HasMaxLength(100).IsRequired(); b.Property(x => x.Title).HasColumnName("title").HasMaxLength(300).IsRequired();
        b.Property(x => x.ReleaseDate).HasColumnName("release_date"); b.Property(x => x.Status).HasColumnName("status").HasConversion(v => v.ToString(), v => Enum.Parse<IssueStatus>(v)).HasMaxLength(64);
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
    }
}
internal sealed class PublicationScheduleConfiguration : IEntityTypeConfiguration<PublicationSchedule>
{
    public void Configure(EntityTypeBuilder<PublicationSchedule> b)
    {
        b.ToTable("publication_schedules"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.SeriesId).HasColumnName("series_id"); b.Property(x => x.ChapterId).HasColumnName("chapter_id"); b.Property(x => x.IssueId).HasColumnName("issue_id");
        b.Property(x => x.PublicationType).HasColumnName("publication_type").HasConversion(v => v.ToString(), v => Enum.Parse<PublicationType>(v)).HasMaxLength(64);
        b.Property(x => x.ScheduledDate).HasColumnName("scheduled_date"); b.Property(x => x.Status).HasColumnName("status").HasConversion(v => v.ToString(), v => Enum.Parse<PublicationStatus>(v)).HasMaxLength(64);
        b.Property(x => x.CreatedAt).HasColumnName("created_at"); b.Property(x => x.PublishedAt).HasColumnName("published_at");
        b.HasOne(x => x.Issue).WithMany(x => x.PublicationSchedules).HasForeignKey(x => x.IssueId).OnDelete(DeleteBehavior.SetNull);
    }
}
internal sealed class ReaderVoteConfiguration : IEntityTypeConfiguration<ReaderVote>
{
    public void Configure(EntityTypeBuilder<ReaderVote> b) { b.ToTable("reader_votes"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id"); b.Property(x => x.IssueId).HasColumnName("issue_id"); b.Property(x => x.SeriesId).HasColumnName("series_id"); b.Property(x => x.VoteCount).HasColumnName("vote_count"); b.Property(x => x.RankPosition).HasColumnName("rank_position"); b.Property(x => x.ImportedByUserId).HasColumnName("imported_by_user_id"); b.Property(x => x.CreatedAt).HasColumnName("created_at"); }
}
internal sealed class RankingSnapshotConfiguration : IEntityTypeConfiguration<RankingSnapshot>
{
    public void Configure(EntityTypeBuilder<RankingSnapshot> b) { b.ToTable("ranking_snapshots"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id"); b.Property(x => x.IssueId).HasColumnName("issue_id"); b.Property(x => x.GeneratedAt).HasColumnName("generated_at"); b.Property(x => x.GeneratedByUserId).HasColumnName("generated_by_user_id"); }
}
internal sealed class RankingItemConfiguration : IEntityTypeConfiguration<RankingItem>
{
    public void Configure(EntityTypeBuilder<RankingItem> b) { b.ToTable("ranking_items"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id"); b.Property(x => x.RankingSnapshotId).HasColumnName("ranking_snapshot_id"); b.Property(x => x.SeriesId).HasColumnName("series_id"); b.Property(x => x.VoteCount).HasColumnName("vote_count"); b.Property(x => x.RankPosition).HasColumnName("rank_position"); b.Property(x => x.Score).HasColumnName("score").HasPrecision(18, 2); b.HasOne(x => x.RankingSnapshot).WithMany(x => x.Items).HasForeignKey(x => x.RankingSnapshotId).OnDelete(DeleteBehavior.Cascade); }
}
internal sealed class CancellationWarningConfiguration : IEntityTypeConfiguration<CancellationWarning>
{
    public void Configure(EntityTypeBuilder<CancellationWarning> b) { b.ToTable("cancellation_warnings"); b.HasKey(x => x.Id); b.Property(x => x.Id).HasColumnName("id"); b.Property(x => x.SeriesId).HasColumnName("series_id"); b.Property(x => x.Reason).HasColumnName("reason").HasMaxLength(2000).IsRequired(); b.Property(x => x.RiskLevel).HasColumnName("risk_level").HasConversion(v => v.ToString(), v => Enum.Parse<CancellationRiskLevel>(v)).HasMaxLength(64); b.Property(x => x.CreatedAt).HasColumnName("created_at"); b.Property(x => x.IsResolved).HasColumnName("is_resolved"); b.Property(x => x.ResolvedAt).HasColumnName("resolved_at"); }
}
