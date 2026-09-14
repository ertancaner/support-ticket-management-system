import { apiClient } from './client';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';

export const categoriesApi = {
  getCategories: async (onlyActive?: boolean): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories', {
      params: onlyActive !== undefined ? { onlyActive } : undefined
    });
    return response.data;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (dto: CreateCategoryRequest): Promise<Category> => {
    const response = await apiClient.post<Category>('/categories', dto);
    return response.data;
  },

  updateCategory: async (id: string, dto: UpdateCategoryRequest): Promise<Category> => {
    const response = await apiClient.put<Category>(`/categories/${id}`, dto);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};
