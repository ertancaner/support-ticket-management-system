namespace TicketManagement.Api.Entities.Enums;

public enum AuditActionType
{
    UserCreated = 1,
    UserStatusChanged = 2,
    PasswordReset = 3,
    TicketStatusChanged = 4,
    TicketSoftDeleted = 5,
    CommentSoftDeleted = 6,
    RefreshTokenReuseDetected = 7,
    CategoryCreated = 8,
    CategoryUpdated = 9,
    CategorySoftDeleted = 10
}
