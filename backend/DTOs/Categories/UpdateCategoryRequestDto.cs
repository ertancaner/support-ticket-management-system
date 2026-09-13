using System.ComponentModel.DataAnnotations;

namespace TicketManagement.Api.DTOs.Categories;

public class UpdateCategoryRequestDto
{
    [Required(ErrorMessage = "Category name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "IsActive is required.")]
    public bool IsActive { get; set; }
}
