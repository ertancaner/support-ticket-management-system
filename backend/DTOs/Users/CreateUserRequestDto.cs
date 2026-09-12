using System.ComponentModel.DataAnnotations;
using TicketManagement.Api.Entities.Enums;

namespace TicketManagement.Api.DTOs.Users;

public class CreateUserRequestDto
{
    [Required(ErrorMessage = "Username is required.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 100 characters.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Temporary password is required.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Temporary password must be at least 6 characters long.")]
    public string TemporaryPassword { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.User;
}
