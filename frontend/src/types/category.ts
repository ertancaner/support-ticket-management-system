export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  ticketCount: number;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
  isActive: boolean;
}
