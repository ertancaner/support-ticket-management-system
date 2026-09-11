using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Configuration;
using TicketManagement.Api.Data;
using TicketManagement.Api.Extensions;
using TicketManagement.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configuration & Environment Variables
builder.Configuration.AddEnvironmentVariables();

// Database Context (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? throw new InvalidOperationException("DefaultConnection string was not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Strongly-typed Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));

// Controller & API Pipeline
builder.Services.AddControllers();
builder.Services.AddProblemDetails();

// Swagger Documentation
builder.Services.AddSwaggerDocumentation();

// CORS Configuration
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                     ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Global Exception Handling & RFC 7807 ProblemDetails
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger UI
app.UseSwaggerDocumentation();

app.UseRouting();
app.UseCors("DefaultCorsPolicy");

// Authentication & Authorization (will be populated in Auth phases)
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

// Apply pending database migrations on startup
await app.ApplyMigrationsAsync();

app.Run();
