using TicketManagement.Api.DTOs.Tickets;
using TicketManagement.Api.Entities;

namespace TicketManagement.Api.Repositories.Interfaces;

public interface ITicketRepository
{
    Task<Ticket?> GetByIdAsync(Guid id, bool includeDetails = true, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Ticket> Items, int TotalCount)> GetPagedAsync(Guid? userIdFilter, TicketFilterParametersDto parameters, CancellationToken cancellationToken = default);
    Task AddAsync(Ticket ticket, CancellationToken cancellationToken = default);
    Task UpdateAsync(Ticket ticket, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Ticket ticket, CancellationToken cancellationToken = default);
}
