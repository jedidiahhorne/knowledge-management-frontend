import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, notesApi, type Tag, type Note } from '../lib/api';

interface NoteTagEditorProps {
  note: Note;
  onUpdate?: (updatedNote: Note) => void;
}

export default function NoteTagEditor({ note, onUpdate }: NoteTagEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: tagsData } = useQuery({
    queryKey: ['tags', searchQuery],
    queryFn: () => tagsApi.list({ search: searchQuery || undefined, limit: 100 }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: (tagIds: number[]) =>
      notesApi.update(note.id, { tag_ids: tagIds }),
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });
      if (onUpdate) {
        onUpdate(updatedNote);
      }
    },
  });

  // Backend returns array directly, not an object with tags property
  const tags = Array.isArray(tagsData) ? tagsData : [];
  const currentTagIds = note.tags?.map((tag) => tag.id) || [];

  const handleTagToggle = (tagId: number) => {
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    
    updateNoteMutation.mutate(newTagIds);
  };

  const availableTags = tags.filter((tag: Tag) => !currentTagIds.includes(tag.id));

  return (
    <div className="relative">
      {/* Current Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {note.tags && note.tags.length > 0 ? (
          note.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
              style={{
                backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                color: tag.color || '#374151',
              }}
            >
              {tag.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              {tag.name}
              <button
                onClick={() => handleTagToggle(tag.id)}
                className="ml-1 hover:text-red-600"
                aria-label={`Remove ${tag.name} tag`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">No tags</span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 rounded-full hover:bg-blue-50"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tag
        </button>
      </div>

      {/* Tag Picker Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="p-2">
              {availableTags.length === 0 ? (
                <div className="text-sm text-gray-500 py-2 text-center">
                  {searchQuery ? 'No tags found' : 'All tags added'}
                </div>
              ) : (
                <div className="space-y-1">
                  {availableTags.map((tag: Tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        handleTagToggle(tag.id);
                        setSearchQuery('');
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                    >
                      {tag.color && (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      <span>{tag.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

