import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notesApi, tagsApi, type Tag } from '../lib/api';
import DashboardLayout from './DashboardLayout';
import FileUpload from './FileUpload';
import AttachmentList from './AttachmentList';
import type { AxiosError } from 'axios';

type ViewMode = 'edit' | 'preview' | 'split';

export default function NoteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch note if editing
  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.get(Number(id)),
    enabled: isEditing,
  });

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list({ limit: 1000 }),
  });

  const tags = Array.isArray(tagsData) ? tagsData : [];

  // Initialize form data based on note - use key to reset form when note changes
  const initialFormData = useMemo(() => {
    if (note) {
      return {
        title: note.title,
        content: note.content || '',
        tag_ids: note.tags?.map((tag: Tag) => tag.id) || [],
        is_pinned: note.is_pinned,
        is_archived: note.is_archived,
      };
    }
    return {
      title: '',
      content: '',
      tag_ids: [],
      is_pinned: false,
      is_archived: false,
    };
  }, [note]);

  // Initialize state with memoized value
  const [formData, setFormData] = useState(initialFormData);

  // Update form data when note changes (for editing)
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content?: string; tag_ids?: number[]; is_pinned?: boolean; is_archived?: boolean }) =>
      notesApi.create(data),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });
      navigate(`/notes/${newNote.id}`);
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError?.response?.data?.detail || 'Failed to create note';
      setErrors({ submit: errorMessage });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string; tag_ids?: number[]; is_pinned?: boolean; is_archived?: boolean }) =>
      notesApi.update(Number(id), data),
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });
      navigate(`/notes/${updatedNote.id}`);
    },
    onError: (err: unknown) => {
      const axiosError = err as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError?.response?.data?.detail || 'Failed to update note';
      setErrors({ submit: errorMessage });
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      content: formData.content.trim() || undefined,
      tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : undefined,
      is_pinned: formData.is_pinned,
      is_archived: formData.is_archived,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setFormData({
      ...formData,
      tag_ids: formData.tag_ids.includes(tagId)
        ? formData.tag_ids.filter((id: number) => id !== tagId)
        : [...formData.tag_ids, tagId],
    });
  };

  if (isEditing && isLoadingNote) {
    return (
      <DashboardLayout selectedTagIds={[]} onTagSelect={() => {}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading note...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout selectedTagIds={[]} onTagSelect={() => {}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isEditing ? 'Edit Note' : 'Create New Note'}
              </h1>
              <p className="text-gray-600">
                {isEditing ? 'Update your note' : 'Add a new note to your collection'}
              </p>
            </div>
            <Link
              to={isEditing ? `/notes/${id}` : '/notes'}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Cancel
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {errors.submit}
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter note title..."
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* View Mode Toggle */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'split'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Split
              </button>
            </div>

            {/* Content Editor/Preview */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-gray-500">(Markdown supported)</span>
              </label>
              {viewMode === 'edit' || viewMode === 'split' ? (
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter note content in Markdown..."
                />
              ) : null}
              {viewMode === 'preview' || viewMode === 'split' ? (
                <div
                  className={`prose prose-sm max-w-none border border-gray-300 rounded-md p-4 min-h-[300px] ${
                    viewMode === 'split' ? 'mt-4' : ''
                  }`}
                >
                  {formData.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formData.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-500 italic">No content to preview</p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: Tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      formData.tag_ids.includes(tag.id)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tag.color && (
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload (only when editing) */}
            {isEditing && id && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Files</h3>
                <FileUpload noteId={Number(id)} />
              </div>
            )}

            {/* Attachments List (only when editing) */}
            {isEditing && id && (
              <div className="mb-6">
                <AttachmentList noteId={Number(id)} />
              </div>
            )}

            {/* Options */}
            <div className="mb-6 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Pin this note</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_archived}
                  onChange={(e) => setFormData({ ...formData, is_archived: e.target.checked })}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Archive this note</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isEditing
                  ? (updateMutation.isPending ? 'Saving...' : 'Save Changes')
                  : (createMutation.isPending ? 'Creating...' : 'Create Note')
                }
              </button>
              <Link
                to={isEditing ? `/notes/${id}` : '/notes'}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

