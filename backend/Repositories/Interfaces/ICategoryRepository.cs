using TicketManagement.Api.Entities;

namespace TicketManagement.Api.Repositories.Interfaces;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(bool? onlyActive = null, CancellationToken cancellationToken = default);
    Task<Category?> GetByIdAsync(Guid id, bool includeTickets = false, CancellationToken cancellationToken = default);
    Task<Category?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task AddAsync(Category category, CancellationToken cancellationToken = default);
    Task UpdateAsync(Category category, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Category category, CancellationToken cancellationToken = default);
}
