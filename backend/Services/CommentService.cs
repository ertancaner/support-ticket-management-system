using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Comments;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Repositories.Interfaces;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly ITicketRepository _ticketRepository;
    private readonly IAuditService _auditService;
    private readonly AppDbContext _context;

    public CommentService(
        ICommentRepository commentRepository,
        ITicketRepository ticketRepository,
        IAuditService auditService,
        AppDbContext context)
    {
        _commentRepository = commentRepository;
        _ticketRepository = ticketRepository;
        _auditService = auditService;
        _context = context;
    }

    public async Task<IReadOnlyList<CommentDto>> GetCommentsByTicketIdAsync(
        Guid currentUserId,
        string currentUserRole,
        Guid ticketId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, includeDetails: false, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Ticket not found.");
        }

        var isAdmin = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

        // Security check: non-admins can only view comments on tickets they own
        if (!isAdmin && ticket.CreatedByUserId != currentUserId)
        {
            throw new ForbiddenException("You do not have permission to view comments for this ticket.");
        }

        var comments = await _commentRepository.GetByTicketIdAsync(ticketId, cancellationToken);

        return comments.Select(c => new CommentDto
        {
            Id = c.Id,
            TicketId = c.TicketId,
            UserId = c.UserId,
            Username = c.User?.Username ?? string.Empty,
            UserRole = c.User?.Role.ToString() ?? string.Empty,
            Content = c.Content,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<CommentDto> CreateCommentAsync(
        Guid currentUserId,
        string currentUserRole,
        Guid ticketId,
        CreateCommentRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, includeDetails: false, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Ticket not found.");
        }

        var isAdmin = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

        // Security check: non-admins can only comment on tickets they own
        if (!isAdmin && ticket.CreatedByUserId != currentUserId)
        {
            throw new ForbiddenException("You do not have permission to add comments to this ticket.");
        }

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            throw new BusinessRuleException("Comment content cannot be empty or whitespace.");
        }

        var comment = new Comment
        {
            TicketId = ticketId,
            UserId = currentUserId, // Always set by server from validated token claim
            Content = dto.Content.Trim(),
            CreatedAt = DateTime.UtcNow // Always set by server
        };

        await _commentRepository.AddAsync(comment, cancellationToken);

        // Retrieve user details for response
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId, cancellationToken);

        return new CommentDto
        {
            Id = comment.Id,
            TicketId = comment.TicketId,
            UserId = comment.UserId,
            Username = user?.Username ?? string.Empty,
            UserRole = user?.Role.ToString() ?? string.Empty,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        };
    }

    public async Task SoftDeleteCommentAsync(
        Guid currentUserId,
        Guid ticketId,
        Guid commentId,
        CancellationToken cancellationToken = default)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, includeDetails: false, cancellationToken);
        if (comment == null || comment.TicketId != ticketId)
        {
            throw new NotFoundException("Comment not found.");
        }

        await _commentRepository.SoftDeleteAsync(comment, cancellationToken);

        await _auditService.LogAsync(
            currentUserId,
            AuditActionType.CommentSoftDeleted,
            nameof(Comment),
            comment.Id.ToString(),
            $"Comment on ticket '{ticketId}' soft-deleted by administrator.",
            cancellationToken);
    }
}
