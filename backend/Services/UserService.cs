using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Users;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Repositories.Interfaces;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditService _auditService;
    private readonly AppDbContext _context;

    public UserService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAuditService auditService,
        AppDbContext context)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _auditService = auditService;
        _context = context;
    }

    public async Task<UserDto> CreateUserAsync(Guid? adminId, CreateUserRequestDto dto, CancellationToken cancellationToken = default)
    {
        var exists = await _userRepository.ExistsByUsernameAsync(dto.Username.Trim(), cancellationToken);
        if (exists)
        {
            throw new BusinessRuleException("A user with this username already exists.");
        }

        var (hash, salt) = _passwordHasher.HashPassword(dto.TemporaryPassword);

        var user = new User
        {
            Username = dto.Username.Trim(),
            PasswordHash = hash,
            PasswordSalt = salt,
            Role = dto.Role,
            IsActive = true,
            MustChangePassword = true,
            SessionVersion = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user, cancellationToken);

        await _auditService.LogAsync(
            adminId,
            AuditActionType.UserCreated,
            nameof(User),
            user.Id.ToString(),
            $"User '{user.Username}' created with role '{user.Role}' and temporary password.",
            cancellationToken);

        return MapToDto(user);
    }

    public async Task<IReadOnlyList<UserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        return MapToDto(user);
    }

    public async Task<UserDto> UpdateUserStatusAsync(Guid? adminId, Guid targetUserId, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        if (adminId.HasValue && adminId.Value == targetUserId && !isActive)
        {
            throw new BusinessRuleException("You cannot deactivate your own administrator account.");
        }

        user.IsActive = isActive;

        // Invalidate active JWT tokens immediately by updating session version
        user.SessionVersion = Guid.NewGuid();

        if (!isActive)
        {
            // Invalidate all active refresh tokens for the deactivated user
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == targetUserId && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in activeTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
            }
        }

        await _userRepository.UpdateAsync(user, cancellationToken);

        await _auditService.LogAsync(
            adminId,
            AuditActionType.UserStatusChanged,
            nameof(User),
            user.Id.ToString(),
            $"User '{user.Username}' status changed to {(isActive ? "Active" : "Inactive")}.",
            cancellationToken);

        return MapToDto(user);
    }

    public async Task ResetPasswordAsync(Guid? adminId, Guid targetUserId, ResetPasswordRequestDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        var (hash, salt) = _passwordHasher.HashPassword(dto.NewTemporaryPassword);

        user.PasswordHash = hash;
        user.PasswordSalt = salt;
        user.MustChangePassword = true;

        // Invalidate all active JWT tokens across all devices
        user.SessionVersion = Guid.NewGuid();

        // Revoke all existing refresh tokens
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == targetUserId && !rt.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _userRepository.UpdateAsync(user, cancellationToken);

        // Record audit without exposing the password
        await _auditService.LogAsync(
            adminId,
            AuditActionType.PasswordReset,
            nameof(User),
            user.Id.ToString(),
            $"Administrator reset temporary password for user '{user.Username}'. All active sessions were invalidated.",
            cancellationToken);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        var isCurrentValid = _passwordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash, user.PasswordSalt);
        if (!isCurrentValid)
        {
            throw new BusinessRuleException("The current password provided is incorrect.");
        }

        if (dto.CurrentPassword == dto.NewPassword)
        {
            throw new BusinessRuleException("The new password cannot be identical to the current password.");
        }

        var (newHash, newSalt) = _passwordHasher.HashPassword(dto.NewPassword);

        user.PasswordHash = newHash;
        user.PasswordSalt = newSalt;
        user.MustChangePassword = false;

        // Invalidate previous sessions upon voluntary password change
        user.SessionVersion = Guid.NewGuid();

        await _userRepository.UpdateAsync(user, cancellationToken);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            MustChangePassword = user.MustChangePassword,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
