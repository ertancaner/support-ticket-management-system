using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketManagement.Api.DTOs.Categories;
using TicketManagement.Api.Exceptions;
using TicketManagement.Api.Services.Interfaces;

namespace TicketManagement.Api.Controllers;

[Authorize]
public class CategoriesController : BaseApiController
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetCategories(
        [FromQuery] bool? onlyActive,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(CurrentUserRole))
        {
            throw new UnauthorizedException();
        }

        var categories = await _categoryService.GetCategoriesAsync(CurrentUserRole, onlyActive, cancellationToken);
        return Ok(categories);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id, cancellationToken);
        return Ok(category);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory(
        [FromBody] CreateCategoryRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        var created = await _categoryService.CreateCategoryAsync(CurrentUserId.Value, dto, cancellationToken);
        return CreatedAtAction(nameof(GetCategoryById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(
        Guid id,
        [FromBody] UpdateCategoryRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        var updated = await _categoryService.UpdateCategoryAsync(CurrentUserId.Value, id, dto, cancellationToken);
        return Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategory(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!CurrentUserId.HasValue)
        {
            throw new UnauthorizedException();
        }

        await _categoryService.SoftDeleteCategoryAsync(CurrentUserId.Value, id, cancellationToken);
        return NoContent();
    }
}
