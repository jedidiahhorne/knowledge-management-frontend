import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notesApi } from '../lib/api';
import { format } from 'date-fns';
import DashboardLayout from './DashboardLayout';
import NoteTagEditor from './NoteTagEditor';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: note, isLoading, error } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.get(Number(id)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => notesApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });
      navigate('/notes');
    },
  });

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${note?.title}"? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
    } catch {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout selectedTagIds={[]} onTagSelect={() => {}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading note...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !note) {
    return (
      <DashboardLayout selectedTagIds={[]} onTagSelect={() => {}}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 mb-4">Note not found or error loading note.</p>
            <Link
              to="/notes"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Notes
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout selectedTagIds={[]} onTagSelect={() => {}}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/notes"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Notes
            </Link>
            <div className="flex gap-2">
              <Link
                to={`/notes/${note.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting || deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Note Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Title and Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
              {note.is_pinned && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pinned</span>
              )}
              {note.is_archived && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Archived</span>
              )}
            </div>

            {/* Tags */}
            <div className="mb-4">
              <NoteTagEditor note={note} />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <div>
                Created: {format(new Date(note.created_at), 'MMM d, yyyy HH:mm')}
              </div>
              <div>
                Updated: {format(new Date(note.updated_at), 'MMM d, yyyy HH:mm')}
              </div>
              {note.attachments && note.attachments.length > 0 && (
                <div>
                  {note.attachments.length} attachment{note.attachments.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {note.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-500 italic">No content</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

