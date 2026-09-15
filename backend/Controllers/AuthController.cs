using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketManagement.Api.DTOs.Auth;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly IAntiforgery _antiforgery;
    private readonly IHostEnvironment _env;

    public AuthController(
        IAuthService authService,
        IAntiforgery antiforgery,
        IHostEnvironment env)
    {
        _authService = authService;
        _antiforgery = antiforgery;
        _env = env;
    }

    [HttpGet("csrf-token")]
    public ActionResult<CsrfTokenResponseDto> GetCsrfToken()
    {
        var tokens = GenerateAntiforgeryTokens();
        return Ok(new CsrfTokenResponseDto { CsrfToken = tokens.RequestToken! });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginRequestDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(dto, Response, cancellationToken);
        GenerateAntiforgeryTokens();
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(Request, Response, cancellationToken);
        GenerateAntiforgeryTokens();
        return Ok(result);
    }

    private AntiforgeryTokenSet GenerateAntiforgeryTokens()
    {
        var originalUser = HttpContext.User;
        try
        {
            HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
            var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            var isSecure = Request.IsHttps || string.Equals(Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);

            Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
            {
                HttpOnly = false,
                SameSite = SameSiteMode.Lax,
                Secure = isSecure,
                Path = "/"
            });

            return tokens;
        }
        finally
        {
            HttpContext.User = originalUser;
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(Request, Response, cancellationToken);

        var cookieOptions = new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = _env.IsProduction(),
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        };

        Response.Cookies.Delete(".AspNetCore.Antiforgery", cookieOptions);
        Response.Cookies.Delete("XSRF-TOKEN", new CookieOptions { Path = "/", HttpOnly = false, SameSite = SameSiteMode.Lax, Expires = DateTimeOffset.UtcNow.AddDays(-1) });

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
