param(
    [string]$Address = "localhost:6078",
    [string]$ApiKey = "dev-internal-grpc-key",
    [string]$SeriesId = "00000000-0000-0000-0000-000000000000",
    [string]$ChapterId = "00000000-0000-0000-0000-000000000000"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command grpcurl -ErrorAction SilentlyContinue)) {
    Write-Host "grpcurl is not installed. Install grpcurl or run the .NET integration tests instead."
    Write-Host "Sample command:"
    Write-Host "grpcurl -plaintext -H `"x-internal-api-key: $ApiKey`" -d '{`"chapter_id`":`"$ChapterId`"}' $Address manga.management.v1.MangaManagementGrpcService/GetChapterById"
    exit 1
}

Write-Host "GetSeriesById"
grpcurl -plaintext -H "x-internal-api-key: $ApiKey" -d "{`"series_id`":`"$SeriesId`"}" $Address manga.management.v1.MangaManagementGrpcService/GetSeriesById

Write-Host "GetChapterById"
grpcurl -plaintext -H "x-internal-api-key: $ApiKey" -d "{`"chapter_id`":`"$ChapterId`"}" $Address manga.management.v1.MangaManagementGrpcService/GetChapterById

Write-Host "Wrong API key should fail with Unauthenticated"
grpcurl -plaintext -H "x-internal-api-key: wrong-key" -d "{`"chapter_id`":`"$ChapterId`"}" $Address manga.management.v1.MangaManagementGrpcService/GetChapterById
