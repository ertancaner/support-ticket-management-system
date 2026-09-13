using System.ComponentModel.DataAnnotations;
using TicketManagement.Api.Entities.Enums;

namespace TicketManagement.Api.DTOs.Tickets;

public class UpdateTicketStatusRequestDto
{
    [Required(ErrorMessage = "Status is required.")]
    [EnumDataType(typeof(TicketStatus), ErrorMessage = "Invalid ticket status.")]
    public TicketStatus Status { get; set; }
}
