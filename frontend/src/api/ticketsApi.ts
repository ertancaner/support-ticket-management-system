import { apiClient } from './client';
import type {
  TicketListItem,
  TicketDetail,
  PagedResult,
  TicketFilterParameters,
  CreateTicketRequest,
  UpdateTicketRequest,
  UpdateTicketStatusRequest,
  CreateCommentRequest,
  CommentItem
} from '@/types/ticket';

export const ticketsApi = {
  getTickets: async (params?: TicketFilterParameters): Promise<PagedResult<TicketListItem>> => {
    const response = await apiClient.get<PagedResult<TicketListItem>>('/tickets', { params });
    return response.data;
  },

  getTicketById: async (id: string): Promise<TicketDetail> => {
    const response = await apiClient.get<TicketDetail>(`/tickets/${id}`);
    return response.data;
  },

  createTicket: async (dto: CreateTicketRequest): Promise<TicketDetail> => {
    const response = await apiClient.post<TicketDetail>('/tickets', dto);
    return response.data;
  },

  updateTicket: async (id: string, dto: UpdateTicketRequest): Promise<TicketDetail> => {
    const response = await apiClient.put<TicketDetail>(`/tickets/${id}`, dto);
    return response.data;
  },

  updateStatus: async (id: string, dto: UpdateTicketStatusRequest): Promise<TicketDetail> => {
    const response = await apiClient.patch<TicketDetail>(`/tickets/${id}/status`, dto);
    return response.data;
  },

  deleteTicket: async (id: string): Promise<void> => {
    await apiClient.delete(`/tickets/${id}`);
  },

  getComments: async (ticketId: string): Promise<CommentItem[]> => {
    const response = await apiClient.get<CommentItem[]>(`/tickets/${ticketId}/comments`);
    return response.data;
  },

  createComment: async (ticketId: string, dto: CreateCommentRequest): Promise<CommentItem> => {
    const response = await apiClient.post<CommentItem>(`/tickets/${ticketId}/comments`, dto);
    return response.data;
  },

  deleteComment: async (ticketId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/tickets/${ticketId}/comments/${commentId}`);
  }
};
