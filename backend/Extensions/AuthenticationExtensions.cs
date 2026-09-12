using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TicketManagement.Api.Configuration;
using TicketManagement.Api.Data;
using TicketManagement.Api.Services;

namespace TicketManagement.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
                          ?? throw new InvalidOperationException("Jwt configuration section is missing.");

        var key = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Controlled via reverse proxy/Docker
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero // Strict expiry without default 5-minute skew
            };

            // Read token from HttpOnly cookie, while gracefully falling back to Bearer header
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (context.Request.Cookies.TryGetValue(TokenService.AccessTokenCookieName, out var token) &&
                        !string.IsNullOrWhiteSpace(token))
                    {
                        context.Token = token;
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    var userIdClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    var tokenSessionVersion = context.Principal?.FindFirst("session_version")?.Value;

                    if (!Guid.TryParse(userIdClaim, out var userId) || string.IsNullOrWhiteSpace(tokenSessionVersion))
                    {
                        context.Fail("Invalid authentication claims.");
                        return;
                    }

                    // Enforce real-time session invalidation and active status check on protected requests
                    var user = await dbContext.Users
                        .AsNoTracking()
                        .Select(u => new { u.Id, u.IsActive, u.SessionVersion })
                        .FirstOrDefaultAsync(u => u.Id == userId);

                    if (user == null || !user.IsActive)
                    {
                        context.Fail("User account does not exist or has been deactivated.");
                        return;
                    }

                    if (user.SessionVersion.ToString() != tokenSessionVersion)
                    {
                        context.Fail("Session has been invalidated due to a security update or password change.");
                    }
                }
            };
        });

        services.AddAuthorization();

        return services;
    }
}
