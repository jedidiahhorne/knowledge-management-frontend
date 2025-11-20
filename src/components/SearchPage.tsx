import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi, tagsApi, type Note, type SearchNotesParams, type Tag } from '../lib/api';
import { format } from 'date-fns';
import DashboardLayout from './DashboardLayout';
import NoteTagEditor from './NoteTagEditor';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState<boolean | undefined>(undefined);
  const [isArchived, setIsArchived] = useState<boolean | undefined>(undefined);
  const [createdAfter, setCreatedAfter] = useState<string>('');
  const [createdBefore, setCreatedBefore] = useState<string>('');
  const [updatedAfter, setUpdatedAfter] = useState<string>('');
  const [updatedBefore, setUpdatedBefore] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0); // Reset to first page when query changes
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set('q', debouncedQuery);
    }
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, setSearchParams]);

  // Fetch tags for filter dropdown
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list({ limit: 1000 }),
  });

  // Search notes with debounced query
  const searchParams_obj: SearchNotesParams = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      tag_names: selectedTagNames.length > 0 ? selectedTagNames : undefined,
      is_pinned: isPinned,
      is_archived: isArchived,
      created_after: createdAfter || undefined,
      created_before: createdBefore || undefined,
      updated_after: updatedAfter || undefined,
      updated_before: updatedBefore || undefined,
      skip: page * limit,
      limit,
    }),
    [
      debouncedQuery,
      selectedTagIds,
      selectedTagNames,
      isPinned,
      isArchived,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore,
      page,
      limit,
    ]
  );

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search-notes', searchParams_obj],
    queryFn: () => searchApi.searchNotes(searchParams_obj),
    enabled: true,
  });

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedTagIds([]);
    setSelectedTagNames([]);
    setIsPinned(undefined);
    setIsArchived(undefined);
    setCreatedAfter('');
    setCreatedBefore('');
    setUpdatedAfter('');
    setUpdatedBefore('');
    setPage(0);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    selectedTagIds.length > 0 ||
    isPinned !== undefined ||
    isArchived !== undefined ||
    createdAfter ||
    createdBefore ||
    updatedAfter ||
    updatedBefore;

  const totalPages = searchResults ? Math.ceil(searchResults.total / limit) : 0;
  const allTags = Array.isArray(tagsData) ? tagsData : [];

  return (
    <DashboardLayout
      selectedTagIds={selectedTagIds}
      onTagSelect={(tagIds) => {
        setSelectedTagIds(tagIds);
        const selectedTags = allTags.filter((tag: Tag) => tagIds.includes(tag.id));
        setSelectedTagNames(selectedTags.map((tag: Tag) => tag.name));
        setPage(0);
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Notes</h1>
          <p className="text-gray-600">Full-text search across your notes and tags</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in title and content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
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
              )}
            </div>
            {debouncedQuery && (
              <p className="mt-2 text-sm text-gray-500">
                Searching for: <span className="font-medium">{debouncedQuery}</span>
              </p>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setIsPinned(isPinned === true ? undefined : true);
                setPage(0);
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isPinned === true
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📌 Pinned
            </button>
            <button
              type="button"
              onClick={() => {
                setIsArchived(isArchived === true ? undefined : false);
                setPage(0);
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isArchived === false
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✓ Active
            </button>
            <button
              type="button"
              onClick={() => {
                setIsArchived(isArchived === true ? undefined : true);
                setPage(0);
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isArchived === true
                  ? 'bg-gray-100 text-gray-800 border border-gray-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Archived
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showAdvancedFilters ? '▼' : '▶'} Advanced Filters
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tag Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <select
                    multiple
                    value={selectedTagIds.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => ({
                        id: parseInt(option.value),
                        name: option.text,
                      }));
                      setSelectedTagIds(selected.map((s) => s.id));
                      setSelectedTagNames(selected.map((s) => s.name));
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    size={5}
                  >
                    {allTags.map((tag: Tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Hold Cmd/Ctrl to select multiple</p>
                </div>

                {/* Date Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created After
                  </label>
                  <input
                    type="date"
                    value={createdAfter}
                    onChange={(e) => {
                      setCreatedAfter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created Before
                  </label>
                  <input
                    type="date"
                    value={createdBefore}
                    onChange={(e) => {
                      setCreatedBefore(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Updated After
                  </label>
                  <input
                    type="date"
                    value={updatedAfter}
                    onChange={(e) => {
                      setUpdatedAfter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {selectedTagIds.length > 0 && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''}
                  </span>
                )}
                {isPinned === true && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Pinned
                  </span>
                )}
                {isArchived !== undefined && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                    {isArchived ? 'Archived' : 'Active'}
                  </span>
                )}
                {(createdAfter || createdBefore) && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    Date range
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">Error loading search results. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && searchResults && (
          <>
            {/* Results Summary */}
            <div className="mb-4 text-sm text-gray-600">
              Found <span className="font-semibold text-gray-900">{searchResults.total}</span> note
              {searchResults.total !== 1 ? 's' : ''}
              {debouncedQuery && (
                <>
                  {' '}
                  matching <span className="font-medium">&quot;{debouncedQuery}&quot;</span>
                </>
              )}
            </div>

            {/* Results List */}
            {searchResults.notes && searchResults.notes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600 mb-4">No notes found matching your search criteria.</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {(searchResults.notes || []).map((note: Note) => (
                    <NoteCard key={note.id} note={note} searchQuery={debouncedQuery} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function NoteCard({ note, searchQuery }: { note: Note; searchQuery: string }) {
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <Link
      to={`/notes/${note.id}`}
      className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {highlightText(note.title, searchQuery)}
            </h3>
            {note.is_pinned && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pinned</span>
            )}
            {note.is_archived && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Archived</span>
            )}
          </div>
          {note.content && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {highlightText(note.content, searchQuery)}
            </p>
          )}
        </div>
      </div>

      {/* Tag Editor */}
      <div className="mb-3">
        <NoteTagEditor note={note} />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          Created: {format(new Date(note.created_at), 'MMM d, yyyy')}
        </div>
        <div>
          Updated: {format(new Date(note.updated_at), 'MMM d, yyyy')}
        </div>
        {note.attachments && note.attachments.length > 0 && (
          <div>
            {note.attachments.length} attachment{note.attachments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Link>
  );
}
