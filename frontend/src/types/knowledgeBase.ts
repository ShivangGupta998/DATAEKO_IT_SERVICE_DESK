export interface KnowledgeArticle {
  id: number;
  title: string;
  content: string;
  category?: string;
  tags?: string[] | string;
  author_id?: number;
  author_name?: string;
  author?: {
    id: number;
    username: string;
    full_name?: string;
  };
  views_count?: number;
  is_published?: boolean;
  created_at: string;
  updated_at?: string;
}

export type KBArticle = KnowledgeArticle;

export interface KnowledgeArticleCreate {
  title: string;
  content: string;
  category?: string;
  tags?: string[] | string;
  is_published?: boolean;
}

export type KBArticleCreate = KnowledgeArticleCreate;

export interface KnowledgeArticleUpdate {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[] | string;
  is_published?: boolean;
}

export type KBArticleUpdate = KnowledgeArticleUpdate;
