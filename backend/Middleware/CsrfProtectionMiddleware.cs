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

        // Skip CSRF validation for Swagger documentation UI
        if (path.StartsWithSegments("/swagger"))
        {
            await _next(context);
            return;
        }

        if (StateChangingMethods.Contains(context.Request.Method))
        {
            try
            {
                await _antiforgery.ValidateRequestAsync(context);
            }
            catch (AntiforgeryValidationException ex)
            {
                _logger.LogWarning(ex, "CSRF validation failed for {Method} {Path}", context.Request.Method, context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/problem+json";

                var problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Forbidden",
                    Detail = "A valid anti-forgery CSRF token must be provided in the 'X-XSRF-TOKEN' header.",
                    Instance = context.Request.Path
                };

                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = true
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, jsonOptions));
                return;
            }
        }

        await _next(context);
    }
}
