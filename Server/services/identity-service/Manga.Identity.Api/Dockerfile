FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY MangaSystemPlatform.Server.sln ./
COPY services/identity-service/Manga.Identity.Api/Manga.Identity.Api.csproj services/identity-service/Manga.Identity.Api/
COPY services/identity-service/Manga.Identity.Application/Manga.Identity.Application.csproj services/identity-service/Manga.Identity.Application/
COPY services/identity-service/Manga.Identity.Domain/Manga.Identity.Domain.csproj services/identity-service/Manga.Identity.Domain/
COPY services/identity-service/Manga.Identity.Infrastructure/Manga.Identity.Infrastructure.csproj services/identity-service/Manga.Identity.Infrastructure/
RUN dotnet restore services/identity-service/Manga.Identity.Api/Manga.Identity.Api.csproj

COPY . .
RUN dotnet publish services/identity-service/Manga.Identity.Api/Manga.Identity.Api.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Manga.Identity.Api.dll"]
