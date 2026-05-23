FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY MangaSystemPlatform.Server.sln ./
COPY services/manga-service/Manga.Management.Api/Manga.Management.Api.csproj services/manga-service/Manga.Management.Api/
COPY services/manga-service/Manga.Management.Application/Manga.Management.Application.csproj services/manga-service/Manga.Management.Application/
COPY services/manga-service/Manga.Management.Domain/Manga.Management.Domain.csproj services/manga-service/Manga.Management.Domain/
COPY services/manga-service/Manga.Management.Infrastructure/Manga.Management.Infrastructure.csproj services/manga-service/Manga.Management.Infrastructure/
RUN dotnet restore services/manga-service/Manga.Management.Api/Manga.Management.Api.csproj

COPY . .
RUN dotnet publish services/manga-service/Manga.Management.Api/Manga.Management.Api.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Manga.Management.Api.dll"]
