param(
    [string]$Solution = "MangaSystemPlatform.Server.sln",
    [string]$Filter = "FullyQualifiedName~BusinessFlowTests"
)

$ErrorActionPreference = "Stop"

Write-Host "Running business-flow integration smoke tests"
dotnet test $Solution --filter $Filter

Write-Host "Manual REST smoke checklist:"
Write-Host "1. Create task with active Assistant user -> success and TaskAssignedEvent published."
Write-Host "2. Create task with missing/inactive/non-Assistant user -> validation error and no TaskAssignedEvent."
Write-Host "3. Create page with active fileId -> success."
Write-Host "4. Create page with missing fileId -> validation error."
Write-Host "5. Submit task with active fileId -> success and TaskSubmittedEvent published."
Write-Host "6. Submit task with missing fileId -> validation error and no TaskSubmittedEvent."
Write-Host "7. Create editorial review with valid chapter/series -> success."
Write-Host "8. Create editorial review with invalid/mismatched chapter/series -> validation error."
