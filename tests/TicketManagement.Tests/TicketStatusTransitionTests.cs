using TicketManagement.Api.Entities.Enums;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Services;
using Xunit;

namespace TicketManagement.Tests;

public class TicketStatusTransitionTests
{
    [Theory]
    [InlineData(TicketStatus.Open, TicketStatus.InProgress)]
    [InlineData(TicketStatus.InProgress, TicketStatus.Resolved)]
    [InlineData(TicketStatus.Resolved, TicketStatus.Closed)]
    public void ValidateStatusTransition_ValidForwardProgression_DoesNotThrow(TicketStatus current, TicketStatus next)
    {
        // Act & Assert (should not throw any exception)
        TicketService.ValidateStatusTransition(current, next);
    }

    [Theory]
    [InlineData(TicketStatus.InProgress, TicketStatus.Open)]
    [InlineData(TicketStatus.Resolved, TicketStatus.Open)]
    [InlineData(TicketStatus.Closed, TicketStatus.Open)]
    public void ValidateStatusTransition_ValidAdminReopen_DoesNotThrow(TicketStatus current, TicketStatus next)
    {
        // Act & Assert
        TicketService.ValidateStatusTransition(current, next);
    }

    [Theory]
    [InlineData(TicketStatus.Open, TicketStatus.Open)]
    [InlineData(TicketStatus.InProgress, TicketStatus.InProgress)]
    [InlineData(TicketStatus.Resolved, TicketStatus.Resolved)]
    [InlineData(TicketStatus.Closed, TicketStatus.Closed)]
    public void ValidateStatusTransition_SameStatus_DoesNotThrow(TicketStatus current, TicketStatus next)
    {
        // Act & Assert
        TicketService.ValidateStatusTransition(current, next);
    }

    [Theory]
    [InlineData(TicketStatus.Open, TicketStatus.Resolved)]
    [InlineData(TicketStatus.Open, TicketStatus.Closed)]
    [InlineData(TicketStatus.InProgress, TicketStatus.Closed)]
    [InlineData(TicketStatus.Resolved, TicketStatus.InProgress)]
    [InlineData(TicketStatus.Closed, TicketStatus.InProgress)]
    [InlineData(TicketStatus.Closed, TicketStatus.Resolved)]
    public void ValidateStatusTransition_InvalidTransition_ThrowsBusinessRuleException(TicketStatus current, TicketStatus next)
    {
        // Act & Assert
        var exception = Assert.Throws<BusinessRuleException>(() =>
            TicketService.ValidateStatusTransition(current, next));

        Assert.Contains($"Invalid status transition from '{current}' to '{next}'", exception.Message);
    }
}
