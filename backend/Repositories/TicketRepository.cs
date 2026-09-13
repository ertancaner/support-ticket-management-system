using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Tickets;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Repositories.Interfaces;

namespace TicketManagement.Api.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly AppDbContext _context;

    public TicketRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Ticket?> GetByIdAsync(Guid id, bool includeDetails = true, CancellationToken cancellationToken = default)
    {
        var query = _context.Tickets.AsQueryable();

        if (includeDetails)
        {
            query = query
                .Include(t => t.Category)
                .Include(t => t.CreatedByUser)
                .Include(t => t.Comments.OrderBy(c => c.CreatedAt))
                    .ThenInclude(c => c.User);
        }

        return await query.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<(IReadOnlyList<Ticket> Items, int TotalCount)> GetPagedAsync(
        Guid? userIdFilter,
        TicketFilterParametersDto parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Tickets.AsNoTracking().AsQueryable();

        // Role-based boundary: Regular users are strictly restricted to their own tickets
        if (userIdFilter.HasValue)
        {
            query = query.Where(t => t.CreatedByUserId == userIdFilter.Value);
        }

        // Title text search (case-insensitive)
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim();
            query = query.Where(t => EF.Functions.ILike(t.Title, $"%{search}%"));
        }

        // Status filter
        if (parameters.Status.HasValue)
        {
            query = query.Where(t => t.Status == parameters.Status.Value);
        }

        // Category filter
        if (parameters.CategoryId.HasValue)
        {
            query = query.Where(t => t.CategoryId == parameters.CategoryId.Value);
        }

        // Priority filter
        if (parameters.Priority.HasValue)
        {
            query = query.Where(t => t.Priority == parameters.Priority.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Sorting by CreatedAt descending (newest first)
        query = query.OrderByDescending(t => t.CreatedAt);

        // Safe pagination boundaries
        var pageNumber = parameters.PageNumber < 1 ? 1 : parameters.PageNumber;
        var pageSize = parameters.PageSize is < 1 or > 100 ? 10 : parameters.PageSize;

        var items = await query
            .Include(t => t.Category)
            .Include(t => t.CreatedByUser)
            .Include(t => t.Comments)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task AddAsync(Ticket ticket, CancellationToken cancellationToken = default)
    {
        await _context.Tickets.AddAsync(ticket, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Ticket ticket, CancellationToken cancellationToken = default)
    {
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SoftDeleteAsync(Ticket ticket, CancellationToken cancellationToken = default)
    {
        ticket.IsDeleted = true;
        ticket.DeletedAt = DateTime.UtcNow;
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
