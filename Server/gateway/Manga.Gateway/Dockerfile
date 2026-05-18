FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY MangaSystemPlatform.Server.sln ./
COPY gateway/Manga.Gateway/Manga.Gateway.csproj gateway/Manga.Gateway/
RUN dotnet restore gateway/Manga.Gateway/Manga.Gateway.csproj

COPY . .
RUN dotnet publish gateway/Manga.Gateway/Manga.Gateway.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Manga.Gateway.dll"]
