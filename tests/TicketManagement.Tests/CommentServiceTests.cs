using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Comments;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Repositories;
using TicketManagement.Api.Services;
using TicketManagement.Api.Services.Interfaces;
using Xunit;

namespace TicketManagement.Tests;

public class CommentServiceTests
{
    private class FakeAuditService : IAuditService
    {
        public Task LogAsync(Guid? userId, AuditActionType actionType, string entityName, string entityId, string? details = null, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task LogSecurityEventAsync(string action, string ipAddress, string userAgent, string? details = null, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<(Ticket ticket, User owner, User otherUser, User admin)> SeedTicketAsync(AppDbContext context)
    {
        var owner = new User
        {
            Id = Guid.NewGuid(),
            Username = "ticketowner",
            Role = UserRole.User,
            PasswordHash = "hash",
            PasswordSalt = "salt",
            IsActive = true
        };

        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "otheruser",
            Role = UserRole.User,
            PasswordHash = "hash",
            PasswordSalt = "salt",
            IsActive = true
        };

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Username = "adminuser",
            Role = UserRole.Admin,
            PasswordHash = "hash",
            PasswordSalt = "salt",
            IsActive = true
        };

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Technical Support",
            IsActive = true
        };

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Title = "Cannot connect to VPN",
            Description = "VPN connection drops every few minutes.",
            CategoryId = category.Id,
            Priority = TicketPriority.High,
            Status = TicketStatus.Open,
            CreatedByUserId = owner.Id,
            CreatedAt = DateTime.UtcNow
        };

        await context.Users.AddRangeAsync(owner, otherUser, admin);
        await context.Categories.AddAsync(category);
        await context.Tickets.AddAsync(ticket);
        await context.SaveChangesAsync();

        return (ticket, owner, otherUser, admin);
    }

    [Fact]
    public async Task GetCommentsByTicketIdAsync_OwnerUser_CanViewComments()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, owner, _, _) = await SeedTicketAsync(context);

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            UserId = owner.Id,
            Content = "Investigating connection logs.",
            CreatedAt = DateTime.UtcNow
        };
        await context.Comments.AddAsync(comment);
        await context.SaveChangesAsync();

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        // Act
        var comments = await service.GetCommentsByTicketIdAsync(owner.Id, "User", ticket.Id);

        // Assert
        Assert.Single(comments);
        Assert.Equal("Investigating connection logs.", comments[0].Content);
    }

    [Fact]
    public async Task GetCommentsByTicketIdAsync_OtherUser_ThrowsForbiddenException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, _, otherUser, _) = await SeedTicketAsync(context);

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.GetCommentsByTicketIdAsync(otherUser.Id, "User", ticket.Id));
    }

    [Fact]
    public async Task GetCommentsByTicketIdAsync_AdminUser_CanViewAnyTicketComments()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, _, _, admin) = await SeedTicketAsync(context);

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        // Act
        var comments = await service.GetCommentsByTicketIdAsync(admin.Id, "Admin", ticket.Id);

        // Assert
        Assert.NotNull(comments);
    }

    [Fact]
    public async Task CreateCommentAsync_OwnerUser_CanCreateComment()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, owner, _, _) = await SeedTicketAsync(context);

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        var request = new CreateCommentRequestDto { Content = "I uploaded the diagnostic log." };

        // Act
        var result = await service.CreateCommentAsync(owner.Id, "User", ticket.Id, request);

        // Assert
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(owner.Id, result.UserId);
        Assert.Equal("I uploaded the diagnostic log.", result.Content);
    }

    [Fact]
    public async Task CreateCommentAsync_OtherUser_ThrowsForbiddenException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, _, otherUser, _) = await SeedTicketAsync(context);

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        var request = new CreateCommentRequestDto { Content = "Trying to intrude on another ticket." };

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.CreateCommentAsync(otherUser.Id, "User", ticket.Id, request));
    }

    [Fact]
    public async Task CreateCommentAsync_AdminUser_CanCommentOnAnyTicket()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, _, _, admin) = await SeedTicketAsync(context);

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        var request = new CreateCommentRequestDto { Content = "Support team is investigating this issue." };

        // Act
        var result = await service.CreateCommentAsync(admin.Id, "Admin", ticket.Id, request);

        // Assert
        Assert.Equal(admin.Id, result.UserId);
        Assert.Equal("Support team is investigating this issue.", result.Content);
    }

    [Fact]
    public async Task CreateCommentAsync_EmptyOrWhitespaceContent_ThrowsBusinessRuleException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, owner, _, _) = await SeedTicketAsync(context);

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        var request = new CreateCommentRequestDto { Content = "   \n\t   " };

        // Act & Assert
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateCommentAsync(owner.Id, "User", ticket.Id, request));
    }

    [Fact]
    public async Task SoftDeleteCommentAsync_Admin_SoftDeletesCommentSuccessfully()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var (ticket, owner, _, admin) = await SeedTicketAsync(context);

        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            TicketId = ticket.Id,
            UserId = owner.Id,
            Content = "Comment containing sensitive information.",
            CreatedAt = DateTime.UtcNow
        };
        await context.Comments.AddAsync(comment);
        await context.SaveChangesAsync();

        var commentRepo = new CommentRepository(context);
        var ticketRepo = new TicketRepository(context);
        var audit = new FakeAuditService();
        var service = new CommentService(commentRepo, ticketRepo, audit, context);

        // Act
        await service.SoftDeleteCommentAsync(admin.Id, ticket.Id, commentId);

        // Assert
        var deletedComment = await context.Comments.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == commentId);
        Assert.NotNull(deletedComment);
        Assert.True(deletedComment.IsDeleted);
        Assert.NotNull(deletedComment.DeletedAt);

        // Verify it no longer appears in normal query
        var remainingComments = await commentRepo.GetByTicketIdAsync(ticket.Id);
        Assert.Empty(remainingComments);
    }
}
