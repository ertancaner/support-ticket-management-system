using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketManagement.Api.DTOs.Auth;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(dto, Response, cancellationToken);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(Request, Response, cancellationToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(Request, Response, cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponseDto>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var result = await _authService.GetCurrentUserAsync(User, cancellationToken);
        return Ok(result);
    }
}
