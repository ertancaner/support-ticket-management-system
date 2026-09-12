using Microsoft.AspNetCore.Mvc;
using TicketManagement.Api.DTOs.Users;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Controllers;

public class UsersController : BaseApiController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetUsers(CancellationToken cancellationToken)
    {
        var users = await _userService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetUserById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _userService.GetUserByIdAsync(id, cancellationToken);
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(
        [FromBody] CreateUserRequestDto dto,
        CancellationToken cancellationToken)
    {
        var createdUser = await _userService.CreateUserAsync(CurrentUserId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, createdUser);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<UserDto>> UpdateStatus(
        Guid id,
        [FromBody] UpdateUserStatusRequestDto dto,
        CancellationToken cancellationToken)
    {
        var updatedUser = await _userService.UpdateUserStatusAsync(CurrentUserId, id, dto.IsActive, cancellationToken);
        return Ok(updatedUser);
    }

    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(
        Guid id,
        [FromBody] ResetPasswordRequestDto dto,
        CancellationToken cancellationToken)
    {
        await _userService.ResetPasswordAsync(CurrentUserId, id, dto, cancellationToken);
        return NoContent();
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequestDto dto,
        CancellationToken cancellationToken)
    {
        // When auth is wired up in Faz 5, CurrentUserId comes from JWT claim.
        // For unauthenticated/initial call, verify user ID presence
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException("You must be authenticated to change your password.");
        }

        await _userService.ChangePasswordAsync(CurrentUserId.Value, dto, cancellationToken);
        return NoContent();
    }
}
