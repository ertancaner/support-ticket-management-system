namespace TicketManagement.Api.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Stored as a cryptographically secure hash, never in plain text
    public string TokenHash { get; set; } = string.Empty;

    // Token family identifier for rotation tracking across sessions
    public Guid FamilyId { get; set; } = Guid.NewGuid();

    public bool IsRevoked { get; set; } = false;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}
