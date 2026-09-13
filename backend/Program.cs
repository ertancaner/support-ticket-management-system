using Microsoft.EntityFrameworkCore;
using TicketManagement.Api.Configuration;
using TicketManagement.Api.Data;
using TicketManagement.Api.Extensions;
using TicketManagement.Api.Middleware;
using TicketManagement.Api.Repositories;
using TicketManagement.Api.Repositories.Interfaces;
using TicketManagement.Api.Services;
using TicketManagement.Api.Services.Interfaces;

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

// Security & Token Services
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Repositories & Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IDataSeeder, DataSeeder>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICommentService, CommentService>();

// JWT Authentication & Authorization
builder.Services.AddJwtAuthentication(builder.Configuration);

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

// CSRF / Anti-Forgery Configuration
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.HttpOnly = false;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
});

var app = builder.Build();

// Global Exception Handling & RFC 7807 ProblemDetails
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger UI
app.UseSwaggerDocumentation();

app.UseRouting();
app.UseCors("DefaultCorsPolicy");

// CSRF Protection on state-changing requests (POST, PUT, PATCH, DELETE)
app.UseMiddleware<CsrfProtectionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply pending database migrations on startup
await app.ApplyMigrationsAsync();

app.Run();
