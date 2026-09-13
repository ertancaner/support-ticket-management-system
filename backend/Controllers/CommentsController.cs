using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketManagement.Api.DTOs.Comments;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Controllers;

[Authorize]
[Route("api/tickets/{ticketId:guid}/comments")]
public class CommentsController : BaseApiController
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CommentDto>>> GetComments(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue || string.IsNullOrEmpty(CurrentUserRole))
        {
            throw new UnauthorizedException();
        }

        var comments = await _commentService.GetCommentsByTicketIdAsync(
            CurrentUserId.Value,
            CurrentUserRole,
            ticketId,
            cancellationToken);

        return Ok(comments);
    }

    [HttpPost]
    public async Task<ActionResult<CommentDto>> CreateComment(
        Guid ticketId,
        [FromBody] CreateCommentRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue || string.IsNullOrEmpty(CurrentUserRole))
        {
            throw new UnauthorizedException();
        }

        var created = await _commentService.CreateCommentAsync(
            CurrentUserId.Value,
            CurrentUserRole,
            ticketId,
            dto,
            cancellationToken);

        return CreatedAtAction(nameof(GetComments), new { ticketId }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(
        Guid ticketId,
        Guid commentId,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        await _commentService.SoftDeleteCommentAsync(
            CurrentUserId.Value,
            ticketId,
            commentId,
            cancellationToken);

        return NoContent();
    }
}
