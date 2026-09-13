using TicketManagement.Api.DTOs.Comments;

namespace TicketManagement.Api.Services.Interfaces;

public interface ICommentService
{
    Task<IReadOnlyList<CommentDto>> GetCommentsByTicketIdAsync(
        Guid currentUserId,
        string currentUserRole,
        Guid ticketId,
        CancellationToken cancellationToken = default);

    Task<CommentDto> CreateCommentAsync(
        Guid currentUserId,
        string currentUserRole,
        Guid ticketId,
        CreateCommentRequestDto dto,
        CancellationToken cancellationToken = default);

    Task SoftDeleteCommentAsync(
        Guid currentUserId,
        Guid ticketId,
        Guid commentId,
        CancellationToken cancellationToken = default);
}
