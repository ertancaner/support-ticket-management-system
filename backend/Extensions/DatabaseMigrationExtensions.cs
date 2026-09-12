using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;

namespace TicketManagement.Api.Extensions;

public static class DatabaseMigrationExtensions
{
    public static async Task ApplyMigrationsAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            var dbContext = services.GetRequiredService<AppDbContext>();
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();

            if (pendingMigrations.Any())
            {
                logger.LogInformation("Applying {Count} pending database migrations...", pendingMigrations.Count());
                await dbContext.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully.");
            }
            else
            {
                logger.LogInformation("Database is up to date. No pending migrations.");
            }

            // Seed initial administrator and default categories
            var seeder = services.GetRequiredService<IDataSeeder>();
            await seeder.SeedAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not apply database migrations or seed data at startup. Ensure PostgreSQL container is running.");
        }
    }
}
