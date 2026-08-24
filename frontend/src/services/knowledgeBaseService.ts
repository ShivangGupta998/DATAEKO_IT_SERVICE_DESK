import { apiClient } from '../api/client';
import { KnowledgeArticle, KnowledgeArticleCreate, KnowledgeArticleUpdate } from '../types/knowledgeBase';

export const knowledgeBaseService = {
  /**
   * Get all published KB articles
   */
  async getAllArticles(): Promise<KnowledgeArticle[]> {
    const response = await apiClient.get<KnowledgeArticle[]>('/knowledge-base');
    // If apiClient extracts data directly, return response. If Axios AxiosResponse, fallback to response.data
    return Array.isArray(response) ? response : (response as any)?.data || [];
  },

  /**
   * Get user's authored KB articles
   */
  async getMyArticles(): Promise<KnowledgeArticle[]> {
    const response = await apiClient.get<KnowledgeArticle[]>('/knowledge-base/my');
    return Array.isArray(response) ? response : (response as any)?.data || [];
  },

  /**
   * Search knowledge base by keyword query
   */
  async searchArticles(query: string): Promise<KnowledgeArticle[]> {
    const response = await apiClient.get<KnowledgeArticle[]>('/knowledge-base/search', {
      params: { q: query },
    });
    return Array.isArray(response) ? response : (response as any)?.data || [];
  },

  /**
   * Get single article by ID
   */
  async getArticleById(articleId: number | string): Promise<KnowledgeArticle> {
    const response = await apiClient.get<KnowledgeArticle>(`/knowledge-base/${articleId}`);
    return (response as any)?.data || response;
  },

  /**
   * Create new article
   */
  async createArticle(data: KnowledgeArticleCreate): Promise<KnowledgeArticle> {
    const response = await apiClient.post<KnowledgeArticle>('/knowledge-base', data);
    return (response as any)?.data || response;
  },

  /**
   * Update existing article
   */
  async updateArticle(articleId: number | string, data: KnowledgeArticleUpdate): Promise<KnowledgeArticle> {
    const response = await apiClient.patch<KnowledgeArticle>(`/knowledge-base/${articleId}`, data);
    return (response as any)?.data || response;
  },

  /**
   * Delete article
   */
  async deleteArticle(articleId: number | string): Promise<void> {
    await apiClient.delete(`/knowledge-base/${articleId}`);
  },
};