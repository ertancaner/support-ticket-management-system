using System.Net;

namespace TicketManagement.Api.Exceptions;

public class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }

    public AppException(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        : base(message)
    {
        StatusCode = statusCode;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message)
        : base(message, HttpStatusCode.NotFound)
    {
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to access this resource.")
        : base(message, HttpStatusCode.Forbidden)
    {
    }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Authentication is required.")
        : base(message, HttpStatusCode.Unauthorized)
    {
    }
}

public class BusinessRuleException : AppException
{
    public BusinessRuleException(string message)
        : base(message, HttpStatusCode.BadRequest)
    {
    }
}
