using TicketManagement.Api.Services;
using Xunit;

namespace TicketManagement.Tests;

public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void HashPassword_GeneratesSaltAndHash()
    {
        // Arrange
        var password = "SecurePassword123!";

        // Act
        var (hash, salt) = _hasher.HashPassword(password);

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(hash));
        Assert.False(string.IsNullOrWhiteSpace(salt));
    }

    [Fact]
    public void VerifyPassword_CorrectPassword_ReturnsTrue()
    {
        // Arrange
        var password = "CorrectPassword456$";
        var (hash, salt) = _hasher.HashPassword(password);

        // Act
        var isValid = _hasher.VerifyPassword(password, hash, salt);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public void VerifyPassword_WrongPassword_ReturnsFalse()
    {
        // Arrange
        var password = "CorrectPassword456$";
        var wrongPassword = "WrongPassword789#";
        var (hash, salt) = _hasher.HashPassword(password);

        // Act
        var isValid = _hasher.VerifyPassword(wrongPassword, hash, salt);

        // Assert
        Assert.False(isValid);
    }
}
