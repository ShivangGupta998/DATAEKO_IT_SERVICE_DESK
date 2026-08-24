import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';
import { KnowledgeArticle as KBArticle } from '../../types/knowledgeBase';
import { CardSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { parseApiError } from '../../api/client';

export const KnowledgeBasePage: React.FC = () => {
  const { isAdmin, isManager, isTechnician } = useAuth();
  const { success, error: toastError } = useToast();

  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal States
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeArticle, setActiveArticle] = useState<KBArticle | null>(null);

  // Create/Edit Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchArticles = async (query?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let rawData: any;
      if (query && query.trim()) {
        rawData = await knowledgeBaseService.searchArticles(query.trim());
      } else {
        rawData = await knowledgeBaseService.getAllArticles();
      }

      // Safely extract array regardless of backend wrapper structure
      const resolvedList = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.articles || [];

      setArticles(resolvedList);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles(searchQuery);
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (activeArticle && showCreateModal) {
        await knowledgeBaseService.updateArticle(activeArticle.id, {
          title: title.trim(),
          category,
          content: content.trim(),
          tags,
        });
        success('Article Updated', `${title} saved.`);
      } else {
        await knowledgeBaseService.createArticle({
          title: title.trim(),
          category,
          content: content.trim(),
          tags,
        });
        success('Article Published', `${title} published to Knowledge Base.`);
      }

      setShowCreateModal(false);
      setActiveArticle(null);
      setTitle('');
      setContent('');
      setTagsInput('');
      setSearchQuery('');
      setSelectedCategory('ALL');
      
      // Refresh articles list immediately
      await fetchArticles();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Save Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activeArticle) return;
    setIsSubmitting(true);
    try {
      await knowledgeBaseService.deleteArticle(activeArticle.id);
      success('Article Deleted', `${activeArticle.title} removed.`);
      setShowDeleteConfirm(false);
      setActiveArticle(null);
      fetchArticles();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Deletion Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setActiveArticle(null);
    setTitle('');
    setCategory('Hardware');
    setContent('');
    setTagsInput('');
    setShowCreateModal(true);
  };

  const openEditModal = (article: KBArticle) => {
    setActiveArticle(article);
    setTitle(article.title);
    setCategory(article.category || 'General');
    setContent(article.content || '');
    
    if (Array.isArray(article.tags)) {
      setTagsInput(article.tags.join(', '));
    } else if (typeof article.tags === 'string') {
      setTagsInput(article.tags);
    } else {
      setTagsInput('');
    }
    
    setShowCreateModal(true);
  };

  // Case-insensitive filtering fix
  const filteredArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    
    return articles.filter((a) => {
      if (!selectedCategory || selectedCategory.toUpperCase() === 'ALL') {
        return true;
      }
      const articleCat = (a.category || 'General').trim().toLowerCase();
      const targetCat = selectedCategory.trim().toLowerCase();
      return articleCat === targetCat;
    });
  }, [articles, selectedCategory]);

  const categories = ['ALL', 'Hardware', 'Software', 'Network', 'Security', 'General'];

  const getTagsArray = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags.map(String);
    if (typeof tags === 'string' && tags.trim()) return tags.split(',').map((t) => t.trim());
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>IT Knowledge Base</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Troubleshooting guides, standard operating procedures (SOPs), and self-help articles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              fetchArticles();
            }}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Filters & Reload"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {(isAdmin || isManager || isTechnician) && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Article</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => fetchArticles(searchQuery)} />}

      {/* Search and Category Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base articles, solutions, error messages..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'ALL' ? 'All Topics' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : filteredArticles.length === 0 ? (
        <EmptyState
          title="No articles found"
          description="Try modifying your search keywords or browsing other categories."
          actionLabel={isAdmin || isManager || isTechnician ? 'Write First Article' : undefined}
          onAction={isAdmin || isManager || isTechnician ? openCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((art) => {
            const articleTags = getTagsArray(art.tags);
            return (
              <div
                key={art.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      {art.category || 'General'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{art.created_at ? new Date(art.created_at).toLocaleDateString() : 'Recently'}</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => {
                      setActiveArticle(art);
                      setShowArticleModal(true);
                    }}
                    className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer transition-colors line-clamp-2"
                  >
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {art.content}
                  </p>

                  {articleTags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {articleTags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveArticle(art);
                      setShowArticleModal(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Read Article</span>
                  </button>

                  {(isAdmin || isManager || isTechnician) && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(art)}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600"
                        title="Edit Article"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveArticle(art);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Article Modal */}
      <Modal
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        title={activeArticle?.title || 'Knowledge Base Article'}
        subtitle={`Category: ${activeArticle?.category || 'General'}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>{(activeArticle as any)?.author?.full_name || (activeArticle as any)?.author?.username || 'IT Specialist'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Published: {activeArticle?.created_at ? new Date(activeArticle.created_at).toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>

          <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed py-2 font-normal">
            {activeArticle?.content}
          </div>

          {activeArticle && getTagsArray(activeArticle.tags).length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-medium">Tags:</span>
              {getTagsArray(activeArticle.tags).map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-mono"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowArticleModal(false)}
              className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Create / Edit Article Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={activeArticle ? 'Edit Article' : 'Publish Knowledge Base Article'}
        subtitle="Author detailed IT guidance for technicians and employees"
      >
        <form onSubmit={handleCreateOrEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to connect to Corporate VPN using OpenVPN"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Security">Security</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="vpn, remote, auth"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Article Content (Markdown supported) *
            </label>
            <textarea
              rows={8}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Step 1: Download client... Step 2: Import config..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-y text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : activeArticle ? 'Update Article' : 'Publish Article'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${activeArticle?.title}"?`}
        confirmText="Delete Article"
        isDestructive
        isLoading={isSubmitting}
      />
    </div>
  );
};