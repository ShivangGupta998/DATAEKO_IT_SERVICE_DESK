import React, { useState } from 'react';
import { Download, ExternalLink, Eye, FileCode, FileText, Image as ImageIcon, Loader2, Paperclip, X } from 'lucide-react';
import { Attachment } from '../../types/ticket';
import { getStoredApiUrl } from '../../api/client';

interface AttachmentGalleryProps {
  attachments?: Attachment[];
  title?: string;
  className?: string;
}

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({
  attachments,
  title = 'Attached Evidence & Files',
  className = '',
}) => {
  const [activeImage, setActiveImage] = useState<Attachment | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const getAttachmentUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    if (
      rawUrl.startsWith('http://') ||
      rawUrl.startsWith('https://') ||
      rawUrl.startsWith('blob:') ||
      rawUrl.startsWith('data:')
    ) {
      return rawUrl;
    }
    const apiBase = getStoredApiUrl().replace(/\/+$/, '');
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${apiBase}${cleanPath}`;
  };

  const handleDownload = async (e: React.MouseEvent, att: Attachment) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = getAttachmentUrl(att.url);
    if (!fullUrl) return;

    try {
      setDownloadingUrl(att.url);
      const res = await fetch(fullUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch file: ${res.status}`);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = att.name || 'attachment';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Direct blob download failed, falling back to direct navigation:', err);
      const tempLink = document.createElement('a');
      tempLink.href = fullUrl;
      tempLink.download = att.name || 'attachment';
      tempLink.target = '_blank';
      tempLink.rel = 'noreferrer';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    } finally {
      setDownloadingUrl(null);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageAttachment = (att: Attachment): boolean => {
    if (att.type?.startsWith('image/')) return true;
    const ext = att.name.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '');
  };

  const getAttachmentIcon = (att: Attachment) => {
    const ext = att.name.split('.').pop()?.toLowerCase();
    if (isImageAttachment(att)) return <ImageIcon className="w-4 h-4 text-sky-500" />;
    if (ext === 'log' || ext === 'txt' || ext === 'json' || ext === 'csv') {
      return <FileCode className="w-4 h-4 text-emerald-500" />;
    }
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    return <Paperclip className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
          <span>{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
            {attachments.length}
          </span>
        </h4>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {attachments.map((att, idx) => {
          const isImg = isImageAttachment(att);

          return (
            <div
              key={`${att.url}-${idx}`}
              className="group relative flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Thumbnail / Icon */}
              {isImg ? (
                <div
                  onClick={() => setActiveImage(att)}
                  className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <img
                    src={getAttachmentUrl(att.url)}
                    alt={att.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  {getAttachmentIcon(att)}
                </div>
              )}

              {/* Name & Size */}
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title={att.name}
                  onClick={() => {
                    if (isImg) setActiveImage(att);
                    else window.open(getAttachmentUrl(att.url), '_blank');
                  }}
                >
                  {att.name}
                </p>
                {att.size ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {formatFileSize(att.size)}
                  </p>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, att)}
                  disabled={downloadingUrl === att.url}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  title="Download File"
                >
                  {downloadingUrl === att.url ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Lightbox Modal */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeImage.name}
                </h3>
                {activeImage.size && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatFileSize(activeImage.size)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, activeImage)}
                  disabled={downloadingUrl === activeImage.url}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                  title="Download Image"
                >
                  {downloadingUrl === activeImage.url ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download</span>
                </button>
                <a
                  href={getAttachmentUrl(activeImage.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Body / Image Viewer */}
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-950/40">
              <img
                src={getAttachmentUrl(activeImage.url)}
                alt={activeImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
