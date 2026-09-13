using TicketManagement.Api.DTOs.Common;
using TicketManagement.Api.DTOs.Tickets;

namespace TicketManagement.Api.Services.Interfaces;

public interface ITicketService
{
    Task<TicketDetailDto> CreateTicketAsync(Guid currentUserId, CreateTicketRequestDto dto, CancellationToken cancellationToken = default);
    Task<PagedResultDto<TicketListDto>> GetTicketsAsync(Guid currentUserId, string currentUserRole, TicketFilterParametersDto parameters, CancellationToken cancellationToken = default);
    Task<TicketDetailDto> GetTicketByIdAsync(Guid currentUserId, string currentUserRole, Guid ticketId, CancellationToken cancellationToken = default);
    Task<TicketDetailDto> UpdateTicketAsync(Guid currentUserId, Guid ticketId, UpdateTicketRequestDto dto, CancellationToken cancellationToken = default);
    Task<TicketDetailDto> UpdateTicketStatusAsync(Guid currentUserId, Guid ticketId, UpdateTicketStatusRequestDto dto, CancellationToken cancellationToken = default);
    Task SoftDeleteTicketAsync(Guid currentUserId, Guid ticketId, CancellationToken cancellationToken = default);
}
