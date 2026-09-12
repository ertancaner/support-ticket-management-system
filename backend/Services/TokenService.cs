using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TicketManagement.Api.Configuration;
using TicketManagement.Api.Entities;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Services;

public class TokenService : ITokenService
{
    public const string AccessTokenCookieName = "access_token";
    public const string RefreshTokenCookieName = "refresh_token";

    private readonly JwtSettings _jwtSettings;
    private readonly IHostEnvironment _env;

    public TokenService(IOptions<JwtSettings> jwtOptions, IHostEnvironment env)
    {
        _jwtSettings = jwtOptions.Value;
        _env = env;
    }

    public string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("session_version", user.SessionVersion.ToString()),
            new("must_change_password", user.MustChangePassword.ToString().ToLower())
        };

        var tokenDescriptor = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }

    public (string PlainToken, string TokenHash) GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        var plainToken = Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var tokenHash = HashToken(plainToken);
        return (plainToken, tokenHash);
    }

    public string HashToken(string plainToken)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(plainToken));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public void AppendAuthCookies(HttpResponse response, string accessToken, string refreshToken)
    {
        var isProduction = _env.IsProduction();

        var accessCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            Path = "/"
        };

        var refreshCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            Path = "/"
        };

        response.Cookies.Append(AccessTokenCookieName, accessToken, accessCookieOptions);
        response.Cookies.Append(RefreshTokenCookieName, refreshToken, refreshCookieOptions);
    }

    public void ClearAuthCookies(HttpResponse response)
    {
        var isProduction = _env.IsProduction();

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(-1),
            Path = "/"
        };

        response.Cookies.Delete(AccessTokenCookieName, cookieOptions);
        response.Cookies.Delete(RefreshTokenCookieName, cookieOptions);
    }
}
