using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Repositories.Interfaces;

namespace TicketManagement.Api.Repositories;

public class CommentRepository : ICommentRepository
{
    private readonly AppDbContext _context;

    public CommentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Comment>> GetByTicketIdAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        return await _context.Comments
            .AsNoTracking()
            .Where(c => c.TicketId == ticketId)
            .Include(c => c.User)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Comment?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Comments.AsQueryable();

        if (includeDetails)
        {
            query = query.Include(c => c.User).Include(c => c.Ticket);
        }

        return await query.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task AddAsync(Comment comment, CancellationToken cancellationToken = default)
    {
        await _context.Comments.AddAsync(comment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SoftDeleteAsync(Comment comment, CancellationToken cancellationToken = default)
    {
        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        _context.Comments.Update(comment);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
