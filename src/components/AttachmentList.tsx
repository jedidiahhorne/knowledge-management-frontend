import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi, type Attachment } from '../lib/api';
import FileViewer from './FileViewer';
import { format } from 'date-fns';
import type { AxiosError } from 'axios';

interface AttachmentListProps {
  noteId: number;
}

export default function AttachmentList({ noteId }: AttachmentListProps) {
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const queryClient = useQueryClient();

  const { data: attachments, isLoading } = useQuery({
    queryKey: ['attachments', noteId],
    queryFn: () => attachmentsApi.list(noteId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => attachmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', noteId] });
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });
    },
  });

  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = await attachmentsApi.download(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      alert(axiosError?.response?.data?.detail || 'Failed to download file');
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Delete "${attachment.filename}"? This action cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(attachment.id);
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📕';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📄';
  };

  const attachmentsList = Array.isArray(attachments) ? attachments : [];

  if (isLoading) {
    return (
      <div className="text-center py-4 text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (attachmentsList.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No attachments yet. Upload files using the upload area above.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
        {attachmentsList.map((attachment: Attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{getFileIcon(attachment.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.filename}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(attachment.file_size)}</span>
                  <span>•</span>
                  <span>{format(new Date(attachment.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setViewingAttachment(attachment)}
                className="px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                View
              </button>
              <button
                onClick={() => handleDownload(attachment)}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Download
              </button>
              <button
                onClick={() => handleDelete(attachment)}
                disabled={deleteMutation.isPending}
                className="px-3 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* File Viewer Modal */}
      {viewingAttachment && (
        <FileViewer
          attachment={viewingAttachment}
          onClose={() => setViewingAttachment(null)}
        />
      )}
    </>
  );
}
