param(
    [string]$Address = "localhost:6154",
    [string]$ApiKey = "dev-internal-grpc-key",
    [string]$FileId = "00000000-0000-0000-0000-000000000000"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command grpcurl -ErrorAction SilentlyContinue)) {
    Write-Host "grpcurl is not installed. Install grpcurl or run the .NET integration tests instead."
    Write-Host "Sample command:"
    Write-Host "grpcurl -plaintext -H `"x-internal-api-key: $ApiKey`" -d '{`"file_id`":`"$FileId`"}' $Address manga.file.v1.FileGrpcService/FileExists"
    exit 1
}

Write-Host "FileExists"
grpcurl -plaintext -H "x-internal-api-key: $ApiKey" -d "{`"file_id`":`"$FileId`"}" $Address manga.file.v1.FileGrpcService/FileExists

Write-Host "GetFileMetadata"
grpcurl -plaintext -H "x-internal-api-key: $ApiKey" -d "{`"file_id`":`"$FileId`"}" $Address manga.file.v1.FileGrpcService/GetFileMetadata

Write-Host "Wrong API key should fail with Unauthenticated"
grpcurl -plaintext -H "x-internal-api-key: wrong-key" -d "{`"file_id`":`"$FileId`"}" $Address manga.file.v1.FileGrpcService/FileExists
