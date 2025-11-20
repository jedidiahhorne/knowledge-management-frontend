import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi, type Attachment } from '../lib/api';
import type { AxiosError } from 'axios';

interface FileUploadProps {
  noteId: number;
  onUploadComplete?: (attachment: Attachment) => void;
  onError?: (error: string) => void;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function FileUpload({ noteId, onUploadComplete, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress: (progress: number) => void }) =>
      attachmentsApi.upload(noteId, file, onProgress),
    onSuccess: (attachment, variables) => {
      const fileKey = variables.file.name;
      setUploads((prev) => {
        const next = new Map(prev);
        const upload = next.get(fileKey);
        if (upload) {
          next.set(fileKey, { ...upload, status: 'success', progress: 100 });
        }
        return next;
      });

      queryClient.invalidateQueries({ queryKey: ['attachments', noteId] });
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });

      if (onUploadComplete) {
        onUploadComplete(attachment);
      }

      // Remove from uploads after 2 seconds
      setTimeout(() => {
        setUploads((prev) => {
          const next = new Map(prev);
          next.delete(fileKey);
          return next;
        });
      }, 2000);
    },
    onError: (error: unknown, variables) => {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError?.response?.data?.detail || 'Failed to upload file';
      const fileKey = variables.file.name;

      setUploads((prev) => {
        const next = new Map(prev);
        const upload = next.get(fileKey);
        if (upload) {
          next.set(fileKey, { ...upload, status: 'error', error: errorMessage });
        }
        return next;
      });

      if (onError) {
        onError(errorMessage);
      }
    },
  });

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        const fileKey = file.name;
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(fileKey, {
            file,
            progress: 0,
            status: 'uploading',
          });
          return next;
        });

        uploadMutation.mutate({
          file,
          onProgress: (progress) => {
            setUploads((prev) => {
              const next = new Map(prev);
              const upload = next.get(fileKey);
              if (upload) {
                next.set(fileKey, { ...upload, progress });
              }
              return next;
            });
          },
        });
      });
    },
    [uploadMutation]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadsArray = Array.from(uploads.values());

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>{' '}
            or drag and drop
          </div>
          <p className="text-xs text-gray-500">Files will be attached to this note</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadsArray.length > 0 && (
        <div className="space-y-2">
          {uploadsArray.map((upload) => (
            <div
              key={upload.file.name}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(upload.file.size)})
                  </span>
                </div>
                {upload.status === 'success' && (
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {upload.status === 'error' && (
                  <svg
                    className="h-5 w-5 text-red-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}

              {upload.status === 'error' && upload.error && (
                <p className="text-sm text-red-600 mt-1">{upload.error}</p>
              )}

              {upload.status === 'success' && (
                <p className="text-sm text-green-600 mt-1">Upload complete!</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
