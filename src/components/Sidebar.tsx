import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tagsApi, type Tag } from '../lib/api';

interface SidebarProps {
  selectedTagIds: number[];
  onTagSelect: (tagIds: number[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ selectedTagIds, onTagSelect, isOpen, onClose }: SidebarProps) {
  const [tagSearch, setTagSearch] = useState('');

  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags', tagSearch],
    queryFn: () => tagsApi.list({ search: tagSearch || undefined, limit: 100 }),
  });

  // Backend returns array directly, not an object with tags property
  const tags = Array.isArray(tagsData) ? tagsData : [];

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onTagSelect(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagSelect([...selectedTagIds, tagId]);
    }
  };

  const clearTagFilters = () => {
    onTagSelect([]);
    setTagSearch('');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Tags Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Tags
                </h3>
                {selectedTagIds.length > 0 && (
                  <button
                    onClick={clearTagFilters}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Tag Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tags List */}
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading tags...</div>
              ) : tags.length === 0 ? (
                <div className="text-sm text-gray-500">No tags found</div>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag: Tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className={`
                          w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                          ${isSelected
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {tag.color && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                          <span className="flex-1">{tag.name}</span>
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-blue-600"
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
                        {tag.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {tag.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Filters Section */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Quick Filters
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => onTagSelect([])}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  All Notes
                </button>
                <button
                  onClick={() => {
                    // This would filter for pinned notes - you'd need to pass this up
                    onTagSelect([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Pinned
                </button>
                <button
                  onClick={() => {
                    // This would filter for archived notes
                    onTagSelect([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Archived
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

