using TicketManagement.Api.DTOs.Users;

namespace TicketManagement.Api.Services.Interfaces;

public interface IUserService
{
    Task<UserDto> CreateUserAsync(Guid? adminId, CreateUserRequestDto dto, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserDto>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<UserDto> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateUserStatusAsync(Guid? adminId, Guid targetUserId, bool isActive, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(Guid? adminId, Guid targetUserId, ResetPasswordRequestDto dto, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDto dto, CancellationToken cancellationToken = default);
}
