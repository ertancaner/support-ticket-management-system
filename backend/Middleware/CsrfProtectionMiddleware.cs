using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;

namespace TicketManagement.Api.Middleware;

public class CsrfProtectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IAntiforgery _antiforgery;
    private readonly ILogger<CsrfProtectionMiddleware> _logger;

    private static readonly HashSet<string> StateChangingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete
    };

    public CsrfProtectionMiddleware(
        RequestDelegate next,
        IAntiforgery antiforgery,
        ILogger<CsrfProtectionMiddleware> logger)
    {
        _next = next;
        _antiforgery = antiforgery;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path;

        // Skip CSRF validation for Swagger documentation UI and public/session auth endpoints
        if (path.StartsWithSegments("/swagger") ||
            path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/auth/logout", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/auth/refresh", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        if (StateChangingMethods.Contains(context.Request.Method))
        {
            if (!context.Request.Headers.TryGetValue("X-XSRF-TOKEN", out var headerToken) || string.IsNullOrWhiteSpace(headerToken))
            {
                _logger.LogWarning("CSRF validation failed: Missing X-XSRF-TOKEN header on {Method} {Path}", context.Request.Method, context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/problem+json";

                var problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Forbidden",
                    Detail = "Anti-forgery token validation failed: The required antiforgery header value \"X-XSRF-TOKEN\" is not present.",
                    Instance = context.Request.Path
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true }));
                return;
            }

            var originalUser = context.User;
            try
            {
                // In Double-Submit Cookie pattern for SPAs, validate the cryptographic cookie-to-header token match
                // using an unauthenticated principal clone so changes in auth state (login/logout/refresh) never cause claim mismatches.
                context.User = new ClaimsPrincipal(new ClaimsIdentity());
                await _antiforgery.ValidateRequestAsync(context);
            }
            catch (AntiforgeryValidationException ex)
            {
                _logger.LogWarning(ex, "CSRF validation failed for {Method} {Path}: {Message}", context.Request.Method, context.Request.Path, ex.Message);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/problem+json";

                var problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Forbidden",
                    Detail = $"Anti-forgery token validation failed: {ex.Message}",
                    Instance = context.Request.Path
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true }));
                return;
            }
            finally
            {
                context.User = originalUser;
            }
        }

        await _next(context);
    }
}
