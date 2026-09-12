namespace TicketManagement.Api.DTOs.Auth;

public class AuthResponseDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; }
}
