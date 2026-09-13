using TicketManagement.Api.DTOs.Categories;

namespace TicketManagement.Api.Services.Interfaces;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(
        string currentUserRole,
        bool? onlyActive = null,
        CancellationToken cancellationToken = default);

    Task<CategoryDto> GetCategoryByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<CategoryDto> CreateCategoryAsync(
        Guid currentUserId,
        CreateCategoryRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<CategoryDto> UpdateCategoryAsync(
        Guid currentUserId,
        Guid id,
        UpdateCategoryRequestDto dto,
        CancellationToken cancellationToken = default);

    Task SoftDeleteCategoryAsync(
        Guid currentUserId,
        Guid id,
        CancellationToken cancellationToken = default);
}
