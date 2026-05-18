FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY MangaSystemPlatform.Server.sln ./
COPY services/file-service/Manga.File.Api/Manga.File.Api.csproj services/file-service/Manga.File.Api/
COPY services/file-service/Manga.File.Application/Manga.File.Application.csproj services/file-service/Manga.File.Application/
COPY services/file-service/Manga.File.Domain/Manga.File.Domain.csproj services/file-service/Manga.File.Domain/
COPY services/file-service/Manga.File.Infrastructure/Manga.File.Infrastructure.csproj services/file-service/Manga.File.Infrastructure/
RUN dotnet restore services/file-service/Manga.File.Api/Manga.File.Api.csproj

COPY . .
RUN dotnet publish services/file-service/Manga.File.Api/Manga.File.Api.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Manga.File.Api.dll"]
