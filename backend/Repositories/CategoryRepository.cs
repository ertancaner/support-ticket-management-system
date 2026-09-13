using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Repositories.Interfaces;

namespace TicketManagement.Api.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _context;

    public CategoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Category>> GetAllAsync(bool? onlyActive = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories.AsNoTracking().AsQueryable();

        if (onlyActive == true)
        {
            query = query.Where(c => c.IsActive);
        }

        return await query
            .Include(c => c.Tickets)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByIdAsync(Guid id, bool includeTickets = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories.AsQueryable();

        if (includeTickets)
        {
            query = query.Include(c => c.Tickets);
        }

        return await query.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Category?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        var normalizedName = name.Trim().ToLower();
        return await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == normalizedName, cancellationToken);
    }

    public async Task AddAsync(Category category, CancellationToken cancellationToken = default)
    {
        await _context.Categories.AddAsync(category, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Category category, CancellationToken cancellationToken = default)
    {
        _context.Categories.Update(category);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SoftDeleteAsync(Category category, CancellationToken cancellationToken = default)
    {
        category.IsDeleted = true;
        category.IsActive = false;
        category.DeletedAt = DateTime.UtcNow;
        _context.Categories.Update(category);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
