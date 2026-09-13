using TicketManagement.Api.Entities;

namespace TicketManagement.Api.Repositories.Interfaces;

public interface ICommentRepository
{
    Task<IReadOnlyList<Comment>> GetByTicketIdAsync(Guid ticketId, CancellationToken cancellationToken = default);
    Task<Comment?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default);
    Task AddAsync(Comment comment, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Comment comment, CancellationToken cancellationToken = default);
}
