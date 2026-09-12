using System.ComponentModel.DataAnnotations;

namespace TicketManagement.Api.DTOs.Users;

public class UpdateUserStatusRequestDto
{
    [Required]
    public bool IsActive { get; set; }
}
