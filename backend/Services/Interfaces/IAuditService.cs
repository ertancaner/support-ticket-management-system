using TicketManagement.Api.Entities.Enums;

namespace TicketManagement.Api.Services.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        Guid? actorUserId,
        AuditActionType actionType,
        string entityName,
        string entityId,
        string? details = null,
        CancellationToken cancellationToken = default);
}
