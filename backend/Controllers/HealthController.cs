using Microsoft.AspNetCore.Mvc;

namespace TicketManagement.Api.Controllers;

public class HealthController : BaseApiController
{
    [HttpGet]
    public IActionResult Check()
    {
        return Ok(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            service = "Support Ticket Management System API"
        });
    }
}
