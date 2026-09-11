using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace TicketManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected Guid? CurrentUserId
    {
        get
        {
            var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claimValue, out var id) ? id : null;
        }
    }

    protected string? CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value;

    protected string? CurrentUsername => User.FindFirst(ClaimTypes.Name)?.Value;
}
