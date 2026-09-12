using System.Security.Claims;
using TicketManagement.Api.Entities;

namespace TicketManagement.Api.Services.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    (string PlainToken, string TokenHash) GenerateRefreshToken();
    string HashToken(string plainToken);
    void AppendAuthCookies(HttpResponse response, string accessToken, string refreshToken);
    void ClearAuthCookies(HttpResponse response);
}
