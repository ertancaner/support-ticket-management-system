using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using TicketManagement.Api.Exceptions;

namespace TicketManagement.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var title = "An unexpected error occurred.";
        var detail = _env.IsDevelopment() ? exception.Message : "An internal server error occurred. Please try again later.";

        if (exception is AppException appException)
        {
            statusCode = appException.StatusCode;
            title = GetTitleForStatusCode(statusCode);
            detail = appException.Message;
            _logger.LogWarning("Application error occurred: {Message} with Status {StatusCode}", detail, (int)statusCode);
        }
        else
        {
            _logger.LogError(exception, "Unhandled system exception occurred on path: {Path}", context.Request.Path);
        }

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, jsonOptions));
    }

    private static string GetTitleForStatusCode(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.BadRequest => "Bad Request",
        HttpStatusCode.Unauthorized => "Unauthorized",
        HttpStatusCode.Forbidden => "Forbidden",
        HttpStatusCode.NotFound => "Not Found",
        HttpStatusCode.Conflict => "Conflict",
        _ => "An error occurred"
    };
}
