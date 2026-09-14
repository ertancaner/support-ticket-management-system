# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview-noble AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["TicketManagement.Api.csproj", "./"]
RUN dotnet restore "TicketManagement.Api.csproj"

# Copy remaining source code and publish
COPY . .
RUN dotnet publish "TicketManagement.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview-noble AS final
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "TicketManagement.Api.dll"]
