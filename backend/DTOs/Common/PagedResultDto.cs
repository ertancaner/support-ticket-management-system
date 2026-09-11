namespace TicketManagement.Api.DTOs.Common;

public class PagedResultDto<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int PageNumber { get; init; }
    public int PageSize { get; init; }
    public int TotalRecords { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalRecords / (PageSize > 0 ? PageSize : 1));
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public PagedResultDto(IReadOnlyList<T> items, int totalRecords, int pageNumber, int pageSize)
    {
        Items = items;
        TotalRecords = totalRecords;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }
}
