using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Tickets;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Repositories;
using TicketManagement.Api.Services;
using TicketManagement.Api.Services.Interfaces;
using Xunit;

namespace TicketManagement.Tests;

public class TicketSearchPaginationTests
{
    private class FakeAuditService : IAuditService
    {
        public Task LogAsync(Guid? userId, AuditActionType actionType, string entityName, string entityId, string? details = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task LogSecurityEventAsync(string action, string ipAddress, string userAgent, string? details = null, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<(Guid userAId, Guid userBId, Guid categoryId)> SeedTicketsAsync(AppDbContext context)
    {
        var userAId = Guid.NewGuid();
        var userBId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        var userA = new User { Id = userAId, Username = "usera", Role = UserRole.User, PasswordHash = "h", PasswordSalt = "s", IsActive = true };
        var userB = new User { Id = userBId, Username = "userb", Role = UserRole.User, PasswordHash = "h", PasswordSalt = "s", IsActive = true };
        await context.Users.AddRangeAsync(userA, userB);

        var category = new Category { Id = categoryId, Name = "Infrastructure", IsActive = true };
        await context.Categories.AddAsync(category);

        // Seed 15 tickets for User A
        for (int i = 1; i <= 15; i++)
        {
            await context.Tickets.AddAsync(new Ticket
            {
                Id = Guid.NewGuid(),
                Title = $"Server Issue #{i:D2}",
                Description = $"Detailed description for server issue {i}",
                CategoryId = categoryId,
                CreatedByUserId = userAId,
                Priority = i % 2 == 0 ? TicketPriority.High : TicketPriority.Low,
                Status = i <= 5 ? TicketStatus.Open : (i <= 10 ? TicketStatus.InProgress : TicketStatus.Resolved),
                CreatedAt = DateTime.UtcNow.AddMinutes(i)
            });
        }

        // Seed 5 tickets for User B
        for (int i = 1; i <= 5; i++)
        {
            await context.Tickets.AddAsync(new Ticket
            {
                Id = Guid.NewGuid(),
                Title = $"Database Failure #{i:D2}",
                Description = $"Detailed description for database failure {i}",
                CategoryId = categoryId,
                CreatedByUserId = userBId,
                Priority = TicketPriority.Critical,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.UtcNow.AddMinutes(i + 20)
            });
        }

        await context.SaveChangesAsync();
        return (userAId, userBId, categoryId);
    }

    [Fact]
    public async Task GetTicketsAsync_ServerSidePagination_ReturnsCorrectPageAndPageSize()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (userAId, _, _) = await SeedTicketsAsync(context);
        var repo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new TicketService(repo, audit, context);

        var filter = new TicketFilterParametersDto { PageNumber = 2, PageSize = 5 };

        // Act
        var result = await service.GetTicketsAsync(userAId, "User", filter);

        // Assert
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(15, result.TotalRecords);
        Assert.Equal(3, result.TotalPages);
        Assert.Equal(2, result.PageNumber);
        Assert.Equal(5, result.PageSize);
        Assert.True(result.HasPreviousPage);
        Assert.True(result.HasNextPage);
    }

    [Fact]
    public async Task GetTicketsAsync_UserRole_RestrictedToOwnTicketsOnly()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (userAId, userBId, _) = await SeedTicketsAsync(context);
        var repo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new TicketService(repo, audit, context);

        // Act - User A searches with empty filter (page size large enough)
        var resultUserA = await service.GetTicketsAsync(userAId, "User", new TicketFilterParametersDto { PageSize = 50 });
        // Act - User B searches with empty filter
        var resultUserB = await service.GetTicketsAsync(userBId, "User", new TicketFilterParametersDto { PageSize = 50 });

        // Assert
        Assert.Equal(15, resultUserA.TotalRecords);
        Assert.All(resultUserA.Items, t => Assert.Equal(userAId, t.CreatedByUserId));

        Assert.Equal(5, resultUserB.TotalRecords);
        Assert.All(resultUserB.Items, t => Assert.Equal(userBId, t.CreatedByUserId));
    }

    [Fact]
    public async Task GetTicketsAsync_AdminRole_ViewsAllTicketsAcrossAllUsers()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (userAId, userBId, _) = await SeedTicketsAsync(context);
        var adminId = Guid.NewGuid();
        var repo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new TicketService(repo, audit, context);

        // Act - Admin queries tickets
        var result = await service.GetTicketsAsync(adminId, "Admin", new TicketFilterParametersDto { PageSize = 50 });

        // Assert
        Assert.Equal(20, result.TotalRecords); // 15 from User A + 5 from User B
    }

    [Fact]
    public async Task GetTicketsAsync_TitleSearch_FiltersCorrectly()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (_, _, _) = await SeedTicketsAsync(context);
        var adminId = Guid.NewGuid();
        var repo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new TicketService(repo, audit, context);

        // Act - Search for "database"
        var result = await service.GetTicketsAsync(adminId, "Admin", new TicketFilterParametersDto
        {
            Search = "database",
            PageSize = 50
        });

        // Assert
        Assert.Equal(5, result.TotalRecords);
        Assert.All(result.Items, t => Assert.Contains("Database", t.Title));
    }

    [Fact]
    public async Task GetTicketsAsync_StatusFilter_FiltersCorrectly()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (userAId, _, _) = await SeedTicketsAsync(context);
        var repo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new TicketService(repo, audit, context);

        // Act - Filter User A's tickets by InProgress
        var result = await service.GetTicketsAsync(userAId, "User", new TicketFilterParametersDto
        {
            Status = TicketStatus.InProgress,
            PageSize = 50
        });

        // Assert
        Assert.Equal(5, result.TotalRecords);
        Assert.All(result.Items, t => Assert.Equal(TicketStatus.InProgress.ToString(), t.Status));
    }

    [Fact]
    public async Task GetTicketsAsync_SearchAndFilterAndPagination_Combined()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (userAId, _, categoryId) = await SeedTicketsAsync(context);
        var repo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new TicketService(repo, audit, context);

        // User A has 15 "Server Issue" tickets:
        // Status: 1-5 Open, 6-10 InProgress, 11-15 Resolved
        // Priority: even High, odd Low
        // Query: Search = "Server", Status = Open, Priority = High
        // Among 1..5: #02, #04 are High Priority -> Exactly 2 tickets
        var result = await service.GetTicketsAsync(userAId, "User", new TicketFilterParametersDto
        {
            Search = "server",
            Status = TicketStatus.Open,
            Priority = TicketPriority.High,
            CategoryId = categoryId,
            PageNumber = 1,
            PageSize = 10
        });

        // Assert
        Assert.Equal(2, result.TotalRecords);
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, t =>
        {
            Assert.Contains("Server", t.Title);
            Assert.Equal(TicketStatus.Open.ToString(), t.Status);
            Assert.Equal(TicketPriority.High.ToString(), t.Priority);
            Assert.Equal(categoryId, t.CategoryId);
        });
    }

    [Fact]
    public async Task GetTicketsAsync_CreatedAtSorting_AscendingAndDescending()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (userAId, _, _) = await SeedTicketsAsync(context);
        var repo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new TicketService(repo, audit, context);

        // Act - Sort descending (default)
        var descResult = await service.GetTicketsAsync(userAId, "User", new TicketFilterParametersDto
        {
            SortBy = "CreatedAt",
            SortOrder = "desc",
            PageSize = 5
        });

        // Act - Sort ascending
        var ascResult = await service.GetTicketsAsync(userAId, "User", new TicketFilterParametersDto
        {
            SortBy = "CreatedAt",
            SortOrder = "asc",
            PageSize = 5
        });

        // Assert
        Assert.True(descResult.Items[0].CreatedAt >= descResult.Items[1].CreatedAt);
        Assert.True(ascResult.Items[0].CreatedAt <= ascResult.Items[1].CreatedAt);
    }
}
