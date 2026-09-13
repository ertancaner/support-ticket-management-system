using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketManagement.Api.DTOs.Common;
using TicketManagement.Api.DTOs.Tickets;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Controllers;

[Authorize]
public class TicketsController : BaseApiController
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpPost]
    public async Task<ActionResult<TicketDetailDto>> CreateTicket(
        [FromBody] CreateTicketRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        var createdTicket = await _ticketService.CreateTicketAsync(CurrentUserId.Value, dto, cancellationToken);
        return CreatedAtAction(nameof(GetTicketById), new { id = createdTicket.Id }, createdTicket);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<TicketListDto>>> GetTickets(
        [FromQuery] TicketFilterParametersDto parameters,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue || string.IsNullOrEmpty(CurrentUserRole))
        {
            throw new UnauthorizedException();
        }

        var result = await _ticketService.GetTicketsAsync(CurrentUserId.Value, CurrentUserRole, parameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDetailDto>> GetTicketById(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue || string.IsNullOrEmpty(CurrentUserRole))
        {
            throw new UnauthorizedException();
        }

        var ticket = await _ticketService.GetTicketByIdAsync(CurrentUserId.Value, CurrentUserRole, id, cancellationToken);
        return Ok(ticket);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TicketDetailDto>> UpdateTicket(
        Guid id,
        [FromBody] UpdateTicketRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        var updated = await _ticketService.UpdateTicketAsync(CurrentUserId.Value, id, dto, cancellationToken);
        return Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TicketDetailDto>> UpdateTicketStatus(
        Guid id,
        [FromBody] UpdateTicketStatusRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        var updated = await _ticketService.UpdateTicketStatusAsync(CurrentUserId.Value, id, dto, cancellationToken);
        return Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTicket(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        await _ticketService.SoftDeleteTicketAsync(CurrentUserId.Value, id, cancellationToken);
        return NoContent();
    }
}
