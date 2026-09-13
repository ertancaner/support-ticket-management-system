using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Categories;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Repositories.Interfaces;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IAuditService _auditService;
    private readonly AppDbContext _context;

    public CategoryService(
        ICategoryRepository categoryRepository,
        IAuditService auditService,
        AppDbContext context)
    {
        _categoryRepository = categoryRepository;
        _auditService = auditService;
        _context = context;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(
        string currentUserRole,
        bool? onlyActive = null,
        CancellationToken cancellationToken = default)
    {
        var isAdmin = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

        // Non-admin users are strictly restricted to active categories only
        var filterActive = !isAdmin || (onlyActive ?? false);

        var categories = await _categoryRepository.GetAllAsync(filterActive ? true : null, cancellationToken);

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            TicketCount = c.Tickets?.Count(t => !t.IsDeleted) ?? 0
        }).ToList();
    }

    public async Task<CategoryDto> GetCategoryByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, includeTickets: true, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Category not found.");
        }

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt,
            TicketCount = category.Tickets?.Count(t => !t.IsDeleted) ?? 0
        };
    }

    public async Task<CategoryDto> CreateCategoryAsync(
        Guid currentUserId,
        CreateCategoryRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new BusinessRuleException("Category name cannot be empty or whitespace.");
        }

        var trimmedName = dto.Name.Trim();

        // Enforce uniqueness (case-insensitive)
        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == trimmedName.ToLower(), cancellationToken);

        if (exists)
        {
            throw new BusinessRuleException($"A category named '{trimmedName}' already exists.");
        }

        var category = new Category
        {
            Name = trimmedName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _categoryRepository.AddAsync(category, cancellationToken);

        await _auditService.LogAsync(
            currentUserId,
            AuditActionType.CategoryCreated,
            nameof(Category),
            category.Id.ToString(),
            $"Category '{category.Name}' created.",
            cancellationToken);

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt,
            TicketCount = 0
        };
    }

    public async Task<CategoryDto> UpdateCategoryAsync(
        Guid currentUserId,
        Guid id,
        UpdateCategoryRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, includeTickets: true, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Category not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new BusinessRuleException("Category name cannot be empty or whitespace.");
        }

        var trimmedName = dto.Name.Trim();

        // Enforce uniqueness when changing name
        if (!string.Equals(category.Name, trimmedName, StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _context.Categories
                .AnyAsync(c => c.Id != id && c.Name.ToLower() == trimmedName.ToLower(), cancellationToken);

            if (exists)
            {
                throw new BusinessRuleException($"A category named '{trimmedName}' already exists.");
            }
        }

        var oldName = category.Name;
        var oldStatus = category.IsActive;

        category.Name = trimmedName;
        category.IsActive = dto.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _categoryRepository.UpdateAsync(category, cancellationToken);

        await _auditService.LogAsync(
            currentUserId,
            AuditActionType.CategoryUpdated,
            nameof(Category),
            category.Id.ToString(),
            $"Category updated: Name ('{oldName}' -> '{category.Name}'), IsActive ({oldStatus} -> {category.IsActive}).",
            cancellationToken);

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt,
            TicketCount = category.Tickets?.Count(t => !t.IsDeleted) ?? 0
        };
    }

    public async Task SoftDeleteCategoryAsync(
        Guid currentUserId,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, includeTickets: false, cancellationToken);
        if (category == null)
        {
            throw new NotFoundException("Category not found.");
        }

        await _categoryRepository.SoftDeleteAsync(category, cancellationToken);

        await _auditService.LogAsync(
            currentUserId,
            AuditActionType.CategorySoftDeleted,
            nameof(Category),
            category.Id.ToString(),
            $"Category '{category.Name}' soft-deleted by administrator.",
            cancellationToken);
    }
}
