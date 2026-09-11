using Microsoft.OpenApi;

namespace TicketManagement.Api.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Support Ticket Management System API",
                Version = "v1",
                Description = "Secure REST API for Support Ticket Management System. Authentication uses HttpOnly cookies for Access and Refresh tokens with CSRF protection."
            });
        });

        return services;
    }

    public static IApplicationBuilder UseSwaggerDocumentation(this IApplicationBuilder app)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Support Ticket Management System API v1");
            c.RoutePrefix = "swagger";
        });

        return app;
    }
}
