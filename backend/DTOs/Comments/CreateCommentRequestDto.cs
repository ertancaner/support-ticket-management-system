using System.ComponentModel.DataAnnotations;

namespace TicketManagement.Api.DTOs.Comments;

public class CreateCommentRequestDto
{
    [Required(ErrorMessage = "Comment content is required.")]
    [StringLength(2000, MinimumLength = 1, ErrorMessage = "Comment content must be between 1 and 2000 characters.")]
    public string Content { get; set; } = string.Empty;
}
