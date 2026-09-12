namespace TicketManagement.Api.Data;

public interface IDataSeeder
{
    Task SeedAsync(CancellationToken cancellationToken = default);
}
