using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TicketManagement.Api.Configuration;
using TicketManagement.Api.Data;
using TicketManagement.Api.DTOs.Auth;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Repositories.Interfaces;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly AppDbContext _context;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        AppDbContext context,
        IOptions<JwtSettings> jwtOptions)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _context = context;
        _jwtSettings = jwtOptions.Value;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, HttpResponse response, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByUsernameAsync(dto.Username.Trim(), cancellationToken);
        if (user == null)
        {
            // Generic message prevents username enumeration
            throw new UnauthorizedException("Invalid username or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("Your account is deactivated. Please contact an administrator.");
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt);
        if (!isPasswordValid)
        {
            throw new UnauthorizedException("Invalid username or password.");
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var (plainRefreshToken, refreshTokenHash) = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            FamilyId = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Store tokens securely in separate HttpOnly cookies
        _tokenService.AppendAuthCookies(response, accessToken, plainRefreshToken);

        return new AuthResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role.ToString(),
            MustChangePassword = user.MustChangePassword
        };
    }

    public async Task LogoutAsync(HttpRequest request, HttpResponse response, CancellationToken cancellationToken = default)
    {
        if (request.Cookies.TryGetValue(TokenService.RefreshTokenCookieName, out var plainRefreshToken) &&
            !string.IsNullOrWhiteSpace(plainRefreshToken))
        {
            var tokenHash = _tokenService.HashToken(plainRefreshToken);
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash && !rt.IsRevoked, cancellationToken);

            if (token != null)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        _tokenService.ClearAuthCookies(response);
    }

    public async Task<AuthResponseDto> GetCurrentUserAsync(ClaimsPrincipal userPrincipal, CancellationToken cancellationToken = default)
    {
        var userIdClaim = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("Authentication token is missing or invalid.");
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedException("User does not exist or has been deactivated.");
        }

        return new AuthResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role.ToString(),
            MustChangePassword = user.MustChangePassword
        };
    }
}
