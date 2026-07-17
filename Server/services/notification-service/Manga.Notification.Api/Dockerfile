FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore services/notification-service/Manga.Notification.Api/Manga.Notification.Api.csproj
RUN dotnet publish services/notification-service/Manga.Notification.Api/Manga.Notification.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Manga.Notification.Api.dll"]
