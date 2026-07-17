FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore services/file-service/Manga.File.Api/Manga.File.Api.csproj
RUN dotnet publish services/file-service/Manga.File.Api/Manga.File.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080 8081
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Manga.File.Api.dll"]
