FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY MangaSystemPlatform.Server.sln ./
COPY services/editorial-service/Manga.Editorial.Api/Manga.Editorial.Api.csproj services/editorial-service/Manga.Editorial.Api/
COPY services/editorial-service/Manga.Editorial.Application/Manga.Editorial.Application.csproj services/editorial-service/Manga.Editorial.Application/
COPY services/editorial-service/Manga.Editorial.Domain/Manga.Editorial.Domain.csproj services/editorial-service/Manga.Editorial.Domain/
COPY services/editorial-service/Manga.Editorial.Infrastructure/Manga.Editorial.Infrastructure.csproj services/editorial-service/Manga.Editorial.Infrastructure/
RUN dotnet restore services/editorial-service/Manga.Editorial.Api/Manga.Editorial.Api.csproj

COPY . .
RUN dotnet publish services/editorial-service/Manga.Editorial.Api/Manga.Editorial.Api.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Manga.Editorial.Api.dll"]
