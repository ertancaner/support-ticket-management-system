using System.ComponentModel.DataAnnotations;

namespace TicketManagement.Api.DTOs.Users;

public class ResetPasswordRequestDto
{
    [Required(ErrorMessage = "New temporary password is required.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "New temporary password must be at least 6 characters long.")]
    public string NewTemporaryPassword { get; set; } = string.Empty;
}
