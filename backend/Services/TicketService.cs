using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Comments;
using TicketManagement.Api.DTOs.Common;
using TicketManagement.Api.DTOs.Tickets;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Repositories.Interfaces;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IAuditService _auditService;
    private readonly AppDbContext _context;

    public TicketService(
        ITicketRepository ticketRepository,
        IAuditService auditService,
        AppDbContext context)
    {
        _ticketRepository = ticketRepository;
        _auditService = auditService;
        _context = context;
    }

    public async Task<TicketDetailDto> CreateTicketAsync(
        Guid currentUserId,
        CreateTicketRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new BusinessRuleException("Title cannot be empty or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            throw new BusinessRuleException("Description cannot be empty or whitespace.");
        }

        // Enforce valid, active, non-deleted category
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.IsActive && !c.IsDeleted, cancellationToken);

        if (category == null)
        {
            throw new BusinessRuleException("The selected category does not exist or is inactive.");
        }

        var ticket = new Ticket
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            CategoryId = dto.CategoryId,
            Priority = dto.Priority,
            Status = TicketStatus.Open, // New tickets always start in Open status
            CreatedByUserId = currentUserId, // Always set by server from token
            CreatedAt = DateTime.UtcNow
        };

        await _ticketRepository.AddAsync(ticket, cancellationToken);

        var created = await _ticketRepository.GetByIdAsync(ticket.Id, includeDetails: true, cancellationToken);
        return MapToDetailDto(created!);
    }

    public async Task<PagedResultDto<TicketListDto>> GetTicketsAsync(
        Guid currentUserId,
        string currentUserRole,
        TicketFilterParametersDto parameters,
        CancellationToken cancellationToken = default)
    {
        var isAdmin = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);
        // Regular users only see their own tickets; Admins see all tickets
        Guid? userIdFilter = isAdmin ? null : currentUserId;

        var (items, totalCount) = await _ticketRepository.GetPagedAsync(userIdFilter, parameters, cancellationToken);

        var dtoList = items.Select(t => new TicketListDto
        {
            Id = t.Id,
            Title = t.Title,
            CategoryId = t.CategoryId,
            CategoryName = t.Category?.Name ?? string.Empty,
            Priority = t.Priority.ToString(),
            Status = t.Status.ToString(),
            CreatedByUserId = t.CreatedByUserId,
            CreatedByUsername = t.CreatedByUser?.Username ?? string.Empty,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            CommentCount = t.Comments?.Count ?? 0
        }).ToList();

        var pageNumber = parameters.PageNumber < 1 ? 1 : parameters.PageNumber;
        var pageSize = parameters.PageSize is < 1 or > 100 ? 10 : parameters.PageSize;

        return new PagedResultDto<TicketListDto>(dtoList, totalCount, pageNumber, pageSize);
    }

    public async Task<TicketDetailDto> GetTicketByIdAsync(
        Guid currentUserId,
        string currentUserRole,
        Guid ticketId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, includeDetails: true, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Ticket not found.");
        }

        var isAdmin = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);

        // Security check: non-admins cannot access other users' tickets
        if (!isAdmin && ticket.CreatedByUserId != currentUserId)
        {
            throw new ForbiddenException("You do not have permission to view this ticket.");
        }

        return MapToDetailDto(ticket);
    }

    public async Task<TicketDetailDto> UpdateTicketAsync(
        Guid currentUserId,
        Guid ticketId,
        UpdateTicketRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, includeDetails: true, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Ticket not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new BusinessRuleException("Title cannot be empty or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            throw new BusinessRuleException("Description cannot be empty or whitespace.");
        }

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.IsActive && !c.IsDeleted, cancellationToken);

        if (category == null)
        {
            throw new BusinessRuleException("The selected category does not exist or is inactive.");
        }

        ticket.Title = dto.Title.Trim();
        ticket.Description = dto.Description.Trim();
        ticket.CategoryId = dto.CategoryId;
        ticket.Priority = dto.Priority;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _ticketRepository.UpdateAsync(ticket, cancellationToken);

        var updated = await _ticketRepository.GetByIdAsync(ticketId, includeDetails: true, cancellationToken);
        return MapToDetailDto(updated!);
    }

    public async Task<TicketDetailDto> UpdateTicketStatusAsync(
        Guid currentUserId,
        Guid ticketId,
        UpdateTicketStatusRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, includeDetails: true, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Ticket not found.");
        }

        if (ticket.Status != dto.Status)
        {
            ValidateStatusTransition(ticket.Status, dto.Status);

            var oldStatus = ticket.Status;
            ticket.Status = dto.Status;
            ticket.UpdatedAt = DateTime.UtcNow;

            await _ticketRepository.UpdateAsync(ticket, cancellationToken);

            await _auditService.LogAsync(
                currentUserId,
                AuditActionType.TicketStatusChanged,
                nameof(Ticket),
                ticket.Id.ToString(),
                $"Ticket status updated from '{oldStatus}' to '{dto.Status}'.",
                cancellationToken);
        }

        return MapToDetailDto(ticket);
    }

    public async Task SoftDeleteTicketAsync(
        Guid currentUserId,
        Guid ticketId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, includeDetails: false, cancellationToken);
        if (ticket == null)
        {
            throw new NotFoundException("Ticket not found.");
        }

        await _ticketRepository.SoftDeleteAsync(ticket, cancellationToken);

        await _auditService.LogAsync(
            currentUserId,
            AuditActionType.TicketSoftDeleted,
            nameof(Ticket),
            ticket.Id.ToString(),
            $"Ticket '{ticket.Title}' soft-deleted by administrator.",
            cancellationToken);
    }

    private static TicketDetailDto MapToDetailDto(Ticket ticket)
    {
        return new TicketDetailDto
        {
            Id = ticket.Id,
            Title = ticket.Title,
            Description = ticket.Description,
            CategoryId = ticket.CategoryId,
            CategoryName = ticket.Category?.Name ?? string.Empty,
            Priority = ticket.Priority.ToString(),
            Status = ticket.Status.ToString(),
            CreatedByUserId = ticket.CreatedByUserId,
            CreatedByUsername = ticket.CreatedByUser?.Username ?? string.Empty,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            Comments = ticket.Comments?
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    TicketId = c.TicketId,
                    UserId = c.UserId,
                    Username = c.User?.Username ?? string.Empty,
                    UserRole = c.User?.Role.ToString() ?? string.Empty,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt
                }).ToList() ?? new List<CommentDto>()
        };
    }

    public static void ValidateStatusTransition(TicketStatus currentStatus, TicketStatus newStatus)
    {
        if (currentStatus == newStatus)
        {
            return;
        }

        var isValid = (currentStatus, newStatus) switch
        {
            // Standard forward progression
            (TicketStatus.Open, TicketStatus.InProgress) => true,
            (TicketStatus.InProgress, TicketStatus.Resolved) => true,
            (TicketStatus.Resolved, TicketStatus.Closed) => true,

            // Admin reopen capabilities
            (TicketStatus.InProgress, TicketStatus.Open) => true,
            (TicketStatus.Resolved, TicketStatus.Open) => true,
            (TicketStatus.Closed, TicketStatus.Open) => true,

            _ => false
        };

        if (!isValid)
        {
            throw new BusinessRuleException($"Invalid status transition from '{currentStatus}' to '{newStatus}'.");
        }
    }
}
