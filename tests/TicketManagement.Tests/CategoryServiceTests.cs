using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Categories;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Repositories;
using TicketManagement.Api.Services;
using TicketManagement.Api.Services.Interfaces;
using Xunit;

namespace TicketManagement.Tests;

public class CategoryServiceTests
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

    [Fact]
    public async Task GetCategoriesAsync_NonAdminUser_ReturnsOnlyActiveCategories()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        await context.Categories.AddRangeAsync(
            new Category { Id = Guid.NewGuid(), Name = "Hardware", IsActive = true },
            new Category { Id = Guid.NewGuid(), Name = "Software", IsActive = true },
            new Category { Id = Guid.NewGuid(), Name = "Deprecated", IsActive = false }
        );
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetCategoriesAsync(currentUserRole: "User");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, c => Assert.True(c.IsActive));
    }

    [Fact]
    public async Task GetCategoriesAsync_AdminUser_ReturnsAllCategories()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        await context.Categories.AddRangeAsync(
            new Category { Id = Guid.NewGuid(), Name = "Hardware", IsActive = true },
            new Category { Id = Guid.NewGuid(), Name = "Software", IsActive = true },
            new Category { Id = Guid.NewGuid(), Name = "Deprecated", IsActive = false }
        );
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetCategoriesAsync(currentUserRole: "Admin", onlyActive: false);

        // Assert
        Assert.Equal(3, result.Count);
    }

    [Fact]
    public async Task CreateCategoryAsync_ValidName_CreatesSuccessfully()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        var adminId = Guid.NewGuid();
        var request = new CreateCategoryRequestDto { Name = "Network Support" };

        // Act
        var created = await service.CreateCategoryAsync(adminId, request);

        // Assert
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Network Support", created.Name);
        Assert.True(created.IsActive);
    }

    [Fact]
    public async Task CreateCategoryAsync_DuplicateName_ThrowsBusinessRuleException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        await context.Categories.AddAsync(new Category { Id = Guid.NewGuid(), Name = "Security", IsActive = true });
        await context.SaveChangesAsync();

        var adminId = Guid.NewGuid();
        var request = new CreateCategoryRequestDto { Name = "security" }; // Case-insensitive duplicate

        // Act & Assert
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateCategoryAsync(adminId, request));

        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task CreateCategoryAsync_EmptyOrWhitespaceName_ThrowsBusinessRuleException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        var adminId = Guid.NewGuid();
        var request = new CreateCategoryRequestDto { Name = "   " };

        // Act & Assert
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateCategoryAsync(adminId, request));
    }

    [Fact]
    public async Task UpdateCategoryAsync_ValidUpdate_UpdatesSuccessfully()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        var categoryId = Guid.NewGuid();
        await context.Categories.AddAsync(new Category { Id = categoryId, Name = "Billing", IsActive = true });
        await context.SaveChangesAsync();

        var adminId = Guid.NewGuid();
        var request = new UpdateCategoryRequestDto { Name = "Accounting & Billing", IsActive = false };

        // Act
        var updated = await service.UpdateCategoryAsync(adminId, categoryId, request);

        // Assert
        Assert.Equal("Accounting & Billing", updated.Name);
        Assert.False(updated.IsActive);
    }

    [Fact]
    public async Task UpdateCategoryAsync_DuplicateNameOfAnotherCategory_ThrowsBusinessRuleException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        var cat1 = new Category { Id = Guid.NewGuid(), Name = "Category A", IsActive = true };
        var cat2 = new Category { Id = Guid.NewGuid(), Name = "Category B", IsActive = true };
        await context.Categories.AddRangeAsync(cat1, cat2);
        await context.SaveChangesAsync();

        var adminId = Guid.NewGuid();
        var request = new UpdateCategoryRequestDto { Name = "category a", IsActive = true };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.UpdateCategoryAsync(adminId, cat2.Id, request));

        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task SoftDeleteCategoryAsync_SoftDeletesCategory()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var repo = new CategoryRepository(context);
        var audit = new FakeAuditService();
        var service = new CategoryService(repo, audit, context);

        var categoryId = Guid.NewGuid();
        await context.Categories.AddAsync(new Category { Id = categoryId, Name = "To Be Deleted", IsActive = true });
        await context.SaveChangesAsync();

        var adminId = Guid.NewGuid();

        // Act
        await service.SoftDeleteCategoryAsync(adminId, categoryId);

        // Assert
        var deletedCategory = await context.Categories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == categoryId);
        Assert.NotNull(deletedCategory);
        Assert.True(deletedCategory.IsDeleted);
        Assert.False(deletedCategory.IsActive);
        Assert.NotNull(deletedCategory.DeletedAt);
    }
}
