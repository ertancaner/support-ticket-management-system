using System.ComponentModel.DataAnnotations;
using TicketManagement.Api.Entities.Enums;

namespace TicketManagement.Api.DTOs.Tickets;

public class UpdateTicketRequestDto
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(200, MinimumLength = 5, ErrorMessage = "Title must be between 5 and 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    [StringLength(5000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 5000 characters.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Category is required.")]
    public Guid CategoryId { get; set; }

    [Required(ErrorMessage = "Priority is required.")]
    [EnumDataType(typeof(TicketPriority), ErrorMessage = "Invalid ticket priority.")]
    public TicketPriority Priority { get; set; }
}
