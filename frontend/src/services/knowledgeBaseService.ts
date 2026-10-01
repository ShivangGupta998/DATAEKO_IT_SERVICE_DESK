import { apiClient } from '../api/client';
import { KnowledgeArticle, KnowledgeArticleCreate, KnowledgeArticleUpdate } from '../types/knowledgeBase';

export const DEFAULT_KB_ARTICLES: KnowledgeArticle[] = [
  {
    id: 1,
    title: 'VPN Connection Issue',
    category: 'VPN',
    content: 'If VPN is not connecting, restart the VPN client and login again. Verify your network connection and ensure your multi-factor authentication (MFA) credentials have not expired.',
    tags: ['vpn', 'network', 'client'],
    is_published: true,
    created_at: '2026-08-07T07:38:01.978Z',
    updated_at: '2026-08-07T07:38:01.978Z',
    author: { full_name: 'IT Support' } as any,
  },
  {
    id: 3,
    title: 'Persistent Test Article',
    category: 'General',
    content: 'Testing persistent storage directly in PostgreSQL. Standard operating procedures (SOPs) and general self-help resources for IT staff and employees.',
    tags: ['storage', 'postgresql', 'testing'],
    is_published: true,
    created_at: '2026-08-26T12:48:23.413Z',
    updated_at: '2026-08-26T12:48:23.413Z',
    author: { full_name: 'IT Specialist' } as any,
  },
];

export const knowledgeBaseService = {
  /**
   * Get all published KB articles
   */
  async getAllArticles(): Promise<KnowledgeArticle[]> {
    try {
      const response = await apiClient.get<KnowledgeArticle[]>('/knowledge-base/');
      const list = Array.isArray(response) ? response : (response as any)?.data || [];
      if (list && list.length > 0) {
        // Guarantee default articles are preserved even if database only has some records
        const existingIds = new Set(list.map((a: KnowledgeArticle) => Number(a.id)));
        const missingDefaults = DEFAULT_KB_ARTICLES.filter((def) => !existingIds.has(Number(def.id)));
        return [...list, ...missingDefaults];
      }
      return DEFAULT_KB_ARTICLES;
    } catch {
      return DEFAULT_KB_ARTICLES;
    }
  },

  /**
   * Get user's authored KB articles
   */
  async getMyArticles(): Promise<KnowledgeArticle[]> {
    try {
      const response = await apiClient.get<KnowledgeArticle[]>('/knowledge-base/my');
      return Array.isArray(response) ? response : (response as any)?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Search knowledge base by keyword query
   */
  async searchArticles(query: string): Promise<KnowledgeArticle[]> {
    try {
      const response = await apiClient.get<KnowledgeArticle[]>('/knowledge-base/search', {
        params: { q: query },
      });
      const list = Array.isArray(response) ? response : (response as any)?.data || [];
      if (list && list.length > 0) {
        return list;
      }
    } catch {
      // Fallback to client-side filtering of default articles
    }
    const q = query.toLowerCase();
    return DEFAULT_KB_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
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