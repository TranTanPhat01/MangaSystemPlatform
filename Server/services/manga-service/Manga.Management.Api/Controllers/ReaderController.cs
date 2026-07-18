using Manga.Management.Application.DTOs;
using Manga.Management.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Manga.Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("manga/reader")]
public sealed class ReaderController(IReaderService reader) : ApiControllerBase
{
    [HttpPost("favorites/{seriesId:guid}")] public async Task<IActionResult> Favorite(Guid seriesId, CancellationToken ct) => ToActionResult(await reader.AddFavoriteAsync(seriesId, ct));
    [HttpDelete("favorites/{seriesId:guid}")] public async Task<IActionResult> Unfavorite(Guid seriesId, CancellationToken ct) => ToActionResult(await reader.RemoveFavoriteAsync(seriesId, ct));
    [HttpGet("favorites")] public async Task<IActionResult> Favorites(int page = 1, int pageSize = 20, CancellationToken ct = default) => ToActionResult(await reader.GetFavoritesAsync(Math.Max(1,page), Math.Clamp(pageSize,1,100), ct));
    [HttpPost("bookmarks")] public async Task<IActionResult> Bookmark(CreateBookmarkRequest request, CancellationToken ct) => ToActionResult(await reader.AddBookmarkAsync(request, ct));
    [HttpDelete("bookmarks/{id:guid}")] public async Task<IActionResult> RemoveBookmark(Guid id, CancellationToken ct) => ToActionResult(await reader.RemoveBookmarkAsync(id, ct));
    [HttpGet("bookmarks")] public async Task<IActionResult> Bookmarks(int page = 1, int pageSize = 20, CancellationToken ct = default) => ToActionResult(await reader.GetBookmarksAsync(Math.Max(1,page), Math.Clamp(pageSize,1,100), ct));
    [HttpPut("progress")] public async Task<IActionResult> Progress(SaveReadingProgressRequest request, CancellationToken ct) => ToActionResult(await reader.SaveProgressAsync(request, ct));
    [HttpGet("continue-reading")] public async Task<IActionResult> ContinueReading(CancellationToken ct) => ToActionResult(await reader.ContinueReadingAsync(ct));
    [HttpGet("history")] public async Task<IActionResult> History(int page = 1, int pageSize = 20, CancellationToken ct = default) => ToActionResult(await reader.GetHistoryAsync(Math.Max(1,page), Math.Clamp(pageSize,1,100), ct));
    [HttpDelete("history")] public async Task<IActionResult> ClearHistory(CancellationToken ct) => ToActionResult(await reader.ClearHistoryAsync(ct));
    [HttpGet("activity-summary")] public async Task<IActionResult> Activity(CancellationToken ct) => ToActionResult(await reader.GetActivitySummaryAsync(ct));
    [HttpPut("ratings/{seriesId:guid}")] public async Task<IActionResult> Rate(Guid seriesId, UpsertRatingRequest request, CancellationToken ct) => ToActionResult(await reader.RateAsync(seriesId, request, ct));
    [HttpDelete("ratings/{seriesId:guid}")] public async Task<IActionResult> RemoveRating(Guid seriesId, CancellationToken ct) => ToActionResult(await reader.RemoveRatingAsync(seriesId, ct));
}

[ApiController]
[Route("manga")]
public sealed class ReaderContentController(IReaderService reader) : ApiControllerBase
{
    [AllowAnonymous, HttpGet("series/{seriesId:guid}/ratings/summary")] public async Task<IActionResult> Rating(Guid seriesId, CancellationToken ct) => ToActionResult(await reader.GetRatingSummaryAsync(seriesId, ct));
    [Authorize, HttpPost("series/{seriesId:guid}/comments")] public async Task<IActionResult> AddSeriesComment(Guid seriesId, CreateCommentRequest request, CancellationToken ct) => ToActionResult(await reader.AddCommentAsync(seriesId, null, request, ct));
    [Authorize, HttpPost("chapters/{chapterId:guid}/comments")] public async Task<IActionResult> AddChapterComment(Guid chapterId, CreateCommentRequest request, CancellationToken ct) => ToActionResult(await reader.AddCommentAsync(null, chapterId, request, ct));
    [Authorize, HttpPut("comments/{id:guid}")] public async Task<IActionResult> UpdateComment(Guid id, UpdateCommentRequest request, CancellationToken ct) => ToActionResult(await reader.UpdateCommentAsync(id, request, ct));
    [Authorize, HttpDelete("comments/{id:guid}")] public async Task<IActionResult> DeleteComment(Guid id, CancellationToken ct) => ToActionResult(await reader.DeleteCommentAsync(id, ct));
    [AllowAnonymous, HttpGet("series/{seriesId:guid}/comments")] public async Task<IActionResult> SeriesComments(Guid seriesId,int page=1,int pageSize=20,CancellationToken ct=default)=>ToActionResult(await reader.GetCommentsAsync(seriesId,null,Math.Max(1,page),Math.Clamp(pageSize,1,100),ct));
    [AllowAnonymous, HttpGet("chapters/{chapterId:guid}/comments")] public async Task<IActionResult> ChapterComments(Guid chapterId,int page=1,int pageSize=20,CancellationToken ct=default)=>ToActionResult(await reader.GetCommentsAsync(null,chapterId,Math.Max(1,page),Math.Clamp(pageSize,1,100),ct));
}
