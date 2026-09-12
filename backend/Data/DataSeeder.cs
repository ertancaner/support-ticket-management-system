using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Data;

public class DataSeeder : IDataSeeder
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(
        AppDbContext context,
        IConfiguration configuration,
        IPasswordHasher passwordHasher,
        ILogger<DataSeeder> logger)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedAdminUserAsync(cancellationToken);
        await SeedDefaultCategoriesAsync(cancellationToken);
    }

    private async Task SeedAdminUserAsync(CancellationToken cancellationToken)
    {
        var hasAdmin = await _context.Users.AnyAsync(u => u.Role == UserRole.Admin, cancellationToken);
        if (hasAdmin)
        {
            return;
        }

        var adminUsername = _configuration["ADMIN_USERNAME"] 
                            ?? _configuration["Admin:Username"] 
                            ?? "admin";

        var adminTempPassword = _configuration["ADMIN_TEMP_PASSWORD"] 
                                ?? _configuration["Admin:TempPassword"]
                                ?? "AdminTempPassword123!";

        var (hash, salt) = _passwordHasher.HashPassword(adminTempPassword);

        var adminUser = new User
        {
            Username = adminUsername,
            PasswordHash = hash,
            PasswordSalt = salt,
            Role = UserRole.Admin,
            IsActive = true,
            MustChangePassword = true,
            SessionVersion = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(adminUser, cancellationToken);

        var auditLog = new AuditLog
        {
            UserId = adminUser.Id,
            ActionType = AuditActionType.UserCreated,
            EntityName = nameof(User),
            EntityId = adminUser.Id.ToString(),
            Timestamp = DateTime.UtcNow,
            Details = "Initial administrator account automatically seeded from environment configuration."
        };

        await _context.AuditLogs.AddAsync(auditLog, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Initial administrator account '{Username}' seeded successfully with mandatory password change flag.", adminUsername);
    }

    private async Task SeedDefaultCategoriesAsync(CancellationToken cancellationToken)
    {
        var hasCategories = await _context.Categories.AnyAsync(cancellationToken);
        if (hasCategories)
        {
            return;
        }

        var defaultCategories = new[]
        {
            new Category { Name = "Teknik Destek", IsActive = true, CreatedAt = DateTime.UtcNow },
            new Category { Name = "Yazılım Hatası (Bug)", IsActive = true, CreatedAt = DateTime.UtcNow },
            new Category { Name = "Donanım Problemi", IsActive = true, CreatedAt = DateTime.UtcNow },
            new Category { Name = "Hesap ve Yetkilendirme", IsActive = true, CreatedAt = DateTime.UtcNow },
            new Category { Name = "Genel Talepler", IsActive = true, CreatedAt = DateTime.UtcNow }
        };

        await _context.Categories.AddRangeAsync(defaultCategories, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Default categories seeded successfully.");
    }
}
