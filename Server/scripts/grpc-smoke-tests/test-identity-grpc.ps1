param(
    [string]$Address = "localhost:6207",
    [string]$ApiKey = "dev-internal-grpc-key",
    [string]$UserId = "00000000-0000-0000-0000-000000000000"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command grpcurl -ErrorAction SilentlyContinue)) {
    Write-Host "grpcurl is not installed. Install grpcurl or run the .NET integration tests instead."
    Write-Host "Sample command:"
    Write-Host "grpcurl -plaintext -H `"x-internal-api-key: $ApiKey`" -d '{`"user_id`":`"$UserId`"}' $Address manga.identity.v1.IdentityGrpcService/CheckUserExists"
    exit 1
}

Write-Host "Identity CheckUserExists"
grpcurl -plaintext -H "x-internal-api-key: $ApiKey" -d "{`"user_id`":`"$UserId`"}" $Address manga.identity.v1.IdentityGrpcService/CheckUserExists

Write-Host "Identity GetUserSummary"
grpcurl -plaintext -H "x-internal-api-key: $ApiKey" -d "{`"user_id`":`"$UserId`"}" $Address manga.identity.v1.IdentityGrpcService/GetUserSummary

Write-Host "Identity CheckUserRole Assistant"
grpcurl -plaintext -H "x-internal-api-key: $ApiKey" -d "{`"user_id`":`"$UserId`",`"role`":`"Assistant`"}" $Address manga.identity.v1.IdentityGrpcService/CheckUserRole

Write-Host "Wrong API key should fail with Unauthenticated"
grpcurl -plaintext -H "x-internal-api-key: wrong-key" -d "{`"user_id`":`"$UserId`"}" $Address manga.identity.v1.IdentityGrpcService/CheckUserExists
