namespace Manga.Identity.Application.Common;

public sealed class IdentityConcurrencyException : Exception
{
    public IdentityConcurrencyException() : base("Identity state changed concurrently. Retry the operation.") { }
}
