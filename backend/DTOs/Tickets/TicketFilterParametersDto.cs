using TicketManagement.Api.Entities.Enums;

namespace TicketManagement.Api.DTOs.Tickets;

public class TicketFilterParametersDto
{
    public string? Search { get; set; }
    public TicketStatus? Status { get; set; }
    public Guid? CategoryId { get; set; }
    public TicketPriority? Priority { get; set; }

    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortOrder { get; set; } = "desc";

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
