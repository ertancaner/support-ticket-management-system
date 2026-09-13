using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Comments;
using TicketManagement.Api.DTOs.Tickets;
using TicketManagement.Api.DTOs.Users;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Repositories;
using TicketManagement.Api.Services;
using Xunit;

namespace TicketManagement.Tests;

public class AuditLoggingTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task AuditService_LogAsync_PersistsAllRequiredAuditFieldsInDatabase()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var auditService = new AuditService(context, NullLogger<AuditService>.Instance);
        var actorId = Guid.NewGuid();
        var targetEntityId = Guid.NewGuid().ToString();

        // Act
        await auditService.LogAsync(
            actorId,
            AuditActionType.TicketStatusChanged,
            nameof(Ticket),
            targetEntityId,
            "Ticket moved from Open to InProgress");

        // Assert
        var log = await context.AuditLogs.FirstOrDefaultAsync();
        Assert.NotNull(log);
        Assert.Equal(actorId, log.UserId);
        Assert.Equal(AuditActionType.TicketStatusChanged, log.ActionType);
        Assert.Equal(nameof(Ticket), log.EntityName);
        Assert.Equal(targetEntityId, log.EntityId);
        Assert.Equal("Ticket moved from Open to InProgress", log.Details);
        Assert.True(log.Timestamp <= DateTime.UtcNow && log.Timestamp > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task UserLifecycle_AuditsRecorded_AndNeverExposesPasswords()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var auditService = new AuditService(context, NullLogger<AuditService>.Instance);
        var userRepo = new UserRepository(context);
        var passwordHasher = new PasswordHasher();
        var userService = new UserService(userRepo, passwordHasher, auditService, context);

        var adminId = Guid.NewGuid();
        var rawPassword = "TopSecretTempPassword123!";

        // 1. Create User
        var created = await userService.CreateUserAsync(adminId, new CreateUserRequestDto
        {
            Username = "johndoe",
            TemporaryPassword = rawPassword,
            Role = UserRole.User
        });

        // 2. Deactivate User
        await userService.UpdateUserStatusAsync(adminId, created.Id, isActive: false);

        // 3. Activate User
        await userService.UpdateUserStatusAsync(adminId, created.Id, isActive: true);

        // 4. Reset Password
        var newTempPassword = "AnotherSecretPassword456$";
        await userService.ResetPasswordAsync(adminId, created.Id, new ResetPasswordRequestDto
        {
            NewTemporaryPassword = newTempPassword
        });

        // 5. Voluntary Password Change
        await userService.ChangePasswordAsync(created.Id, new ChangePasswordRequestDto
        {
            CurrentPassword = newTempPassword,
            NewPassword = "UserChosenNewPassword789!"
        });

        // Assert - Verify audit log records in DB
        var logs = await context.AuditLogs.OrderBy(l => l.Timestamp).ToListAsync();
        Assert.Equal(5, logs.Count);

        // Check Action Types
        Assert.Equal(AuditActionType.UserCreated, logs[0].ActionType);
        Assert.Equal(AuditActionType.UserDeactivated, logs[1].ActionType);
        Assert.Equal(AuditActionType.UserActivated, logs[2].ActionType);
        Assert.Equal(AuditActionType.PasswordReset, logs[3].ActionType);
        Assert.Equal(AuditActionType.PasswordReset, logs[4].ActionType);

        // Check Security: NO passwords or hashes ever leaked in Details
        foreach (var log in logs)
        {
            Assert.NotNull(log.Details);
            Assert.DoesNotContain(rawPassword, log.Details);
            Assert.DoesNotContain(newTempPassword, log.Details);
            Assert.DoesNotContain("UserChosenNewPassword789!", log.Details);
        }
    }

    [Fact]
    public async Task TicketAndCommentLifecycle_AuditsRecordedSuccessfully()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var auditService = new AuditService(context, NullLogger<AuditService>.Instance);
        var ticketRepo = new TicketRepository(context);
        var commentRepo = new CommentRepository(context);
        var ticketService = new TicketService(ticketRepo, auditService, context);
        var commentService = new CommentService(commentRepo, ticketRepo, auditService, context);

        var adminId = Guid.NewGuid();
        var category = new Category { Id = Guid.NewGuid(), Name = "General", IsActive = true };
        var adminUser = new User { Id = adminId, Username = "admin", Role = UserRole.Admin, PasswordHash = "h", PasswordSalt = "s", IsActive = true };
        await context.Categories.AddAsync(category);
        await context.Users.AddAsync(adminUser);
        await context.SaveChangesAsync();

        // 1. Create Ticket
        var ticket = await ticketService.CreateTicketAsync(adminId, new CreateTicketRequestDto
        {
            Title = "Server Memory Leak",
            Description = "Memory utilization reaches 98% daily.",
            CategoryId = category.Id,
            Priority = TicketPriority.High
        });

        // 2. Update Status (Open -> InProgress)
        await ticketService.UpdateTicketStatusAsync(adminId, ticket.Id, new UpdateTicketStatusRequestDto
        {
            Status = TicketStatus.InProgress
        });

        // 3. Add Comment and Soft Delete it
        var comment = await commentService.CreateCommentAsync(adminId, "Admin", ticket.Id, new CreateCommentRequestDto
        {
            Content = "Root cause identified as cache leakage."
        });
        await commentService.SoftDeleteCommentAsync(adminId, ticket.Id, comment.Id);

        // 4. Soft Delete Ticket
        await ticketService.SoftDeleteTicketAsync(adminId, ticket.Id);

        // Assert - Verify audit log records in DB
        var logs = await context.AuditLogs.OrderBy(l => l.Timestamp).ToListAsync();

        Assert.Contains(logs, l => l.ActionType == AuditActionType.TicketStatusChanged);
        Assert.Contains(logs, l => l.ActionType == AuditActionType.CommentSoftDeleted);
        Assert.Contains(logs, l => l.ActionType == AuditActionType.TicketSoftDeleted);

        var statusLog = logs.First(l => l.ActionType == AuditActionType.TicketStatusChanged);
        Assert.Equal(ticket.Id.ToString(), statusLog.EntityId);
        Assert.Contains("InProgress", statusLog.Details);

        var commentLog = logs.First(l => l.ActionType == AuditActionType.CommentSoftDeleted);
        Assert.Equal(comment.Id.ToString(), commentLog.EntityId);

        var ticketDeleteLog = logs.First(l => l.ActionType == AuditActionType.TicketSoftDeleted);
        Assert.Equal(ticket.Id.ToString(), ticketDeleteLog.EntityId);
        Assert.Contains("Server Memory Leak", ticketDeleteLog.Details);
    }
}
