export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CommentItem {
  id: string;
  ticketId: string;
  userId: string;
  username: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export interface TicketListItem {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdByUserId: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt?: string | null;
  commentCount: number;
}

export interface TicketDetail {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdByUserId: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt?: string | null;
  comments: CommentItem[];
}

export interface PagedResult<T> {
  items: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface TicketFilterParameters {
  search?: string;
  status?: TicketStatus;
  categoryId?: string;
  priority?: TicketPriority;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  categoryId: string;
  priority: TicketPriority;
}

export interface UpdateTicketRequest {
  title: string;
  description: string;
  categoryId: string;
  priority: TicketPriority;
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

export interface CreateCommentRequest {
  content: string;
}
