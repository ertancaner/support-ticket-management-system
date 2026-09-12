using System.Security.Claims;
using TicketManagement.Api.DTOs.Auth;

namespace TicketManagement.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, HttpResponse response, CancellationToken cancellationToken = default);
    Task LogoutAsync(HttpRequest request, HttpResponse response, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> GetCurrentUserAsync(ClaimsPrincipal userPrincipal, CancellationToken cancellationToken = default);
}
