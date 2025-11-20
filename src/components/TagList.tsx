import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, type Tag } from '../lib/api';

interface TagListProps {
  selectedTagIds?: number[];
  onTagClick?: (tag: Tag) => void;
  showActions?: boolean;
  onEdit?: (tag: Tag) => void;
}

export default function TagList({ selectedTagIds = [], onTagClick, showActions = false, onEdit }: TagListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags', searchQuery],
    queryFn: () => tagsApi.list({ search: searchQuery || undefined, limit: 1000 }),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      // Invalidate all tag queries (including those with search parameters)
      queryClient.invalidateQueries({ queryKey: ['tags'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  // Backend returns array directly, not an object with tags property
  const tags = Array.isArray(tagsData) ? tagsData : [];

  const handleTagClick = (tag: Tag) => {
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  const isSelected = (tagId: number) => selectedTagIds.includes(tagId);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading tags...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'No tags found matching your search' : 'No tags yet. Create your first tag!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag: Tag) => (
            <div
              key={tag.id}
              className={`
                border rounded-lg p-3 transition-all cursor-pointer
                ${isSelected(tag.id)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${onTagClick ? 'hover:scale-105' : ''}
              `}
              onClick={() => handleTagClick(tag)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {tag.color && (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{tag.name}</h3>
                    {tag.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tag.description}</p>
                    )}
                  </div>
                </div>
                {isSelected(tag.id) && (
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {showActions && (
                <div className="mt-2 flex gap-2">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(tag);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete tag "${tag.name}"? This will remove it from all notes.`)) {
                        deleteTagMutation.mutate(tag.id);
                      }
                    }}
                    disabled={deleteTagMutation.isPending}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleteTagMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

