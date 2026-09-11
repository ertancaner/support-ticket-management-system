using TicketManagement.Api.Entities.Enums;

namespace TicketManagement.Api.Entities;

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public AuditActionType ActionType { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Sanitized description; passwords and tokens are strictly prohibited
    public string? Details { get; set; }
}
