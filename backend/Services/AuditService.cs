using TicketManagement.Api.Data;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(AppDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(
        Guid? actorUserId,
        AuditActionType actionType,
        string entityName,
        string entityId,
        string? details = null,
        CancellationToken cancellationToken = default)
    {
        var log = new AuditLog
        {
            UserId = actorUserId,
            ActionType = actionType,
            EntityName = entityName,
            EntityId = entityId,
            Timestamp = DateTime.UtcNow,
            Details = details
        };

        await _context.AuditLogs.AddAsync(log, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Audit recorded: {ActionType} on {EntityName}:{EntityId} by Actor {ActorUserId}",
            actionType, entityName, entityId, actorUserId);
    }
}
