import React, { useRef, useState } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon, FileCode, Paperclip } from 'lucide-react';

export interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  label?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 15,
  disabled = false,
  label = 'Attachments & Evidence (Optional)',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-sky-500" />;
    if (ext === 'log' || ext === 'txt' || ext === 'json' || ext === 'csv') {
      return <FileCode className="w-4 h-4 text-emerald-500" />;
    }
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    return <Paperclip className="w-4 h-4 text-indigo-500" />;
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setValidationError(null);
    const newFilesList = Array.from(incomingFiles);

    if (files.length + newFilesList.length > maxFiles) {
      setValidationError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const validNewFiles: File[] = [];
    for (const f of newFilesList) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setValidationError(`"${f.name}" exceeds the ${maxSizeMB}MB file size limit.`);
        return;
      }
      // Check for duplicates
      if (files.some((existing) => existing.name === f.name && existing.size === f.size)) {
        continue;
      }
      validNewFiles.push(f);
    }

    onFilesChange([...files, ...validNewFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // Reset input so same file can be re-added if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, idx) => idx !== index));
    setValidationError(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {files.length}/{maxFiles} files (up to {maxSizeMB}MB each)
        </span>
      </div>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        disabled={disabled || files.length >= maxFiles}
        accept="image/*,.pdf,.txt,.log,.csv,.json,.doc,.docx"
        className="hidden"
      />

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && files.length < maxFiles) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 select-none ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-950/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900/50'
        } ${disabled || files.length >= maxFiles ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
            <span className="text-indigo-600 dark:text-indigo-400 underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Screenshots (PNG, JPG, WEBP), Logs (.log, .txt), or PDFs
          </p>
        </div>
      </div>

      {validationError && (
        <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 animate-fadeIn">
          {validationError}
        </p>
      )}

      {/* Selected File Chips Preview */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {files.map((file, idx) => {
            const isImg = isImageFile(file);
            const previewUrl = isImg ? URL.createObjectURL(file) : null;

            return (
              <div
                key={`${file.name}-${idx}`}
                className="group relative inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-all max-w-xs"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    onLoad={() => {
                      // Free memory after thumbnail loads
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getFileIcon(file)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  disabled={disabled}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
