import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi, tagsApi, type Note, type SearchNotesParams } from '../lib/api';
import { format } from 'date-fns';
import DashboardLayout from './DashboardLayout';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState<boolean | undefined>(undefined);
  const [isArchived, setIsArchived] = useState<boolean | undefined>(undefined);
  const [createdAfter, setCreatedAfter] = useState<string>('');
  const [createdBefore, setCreatedBefore] = useState<string>('');
  const [updatedAfter, setUpdatedAfter] = useState<string>('');
  const [updatedBefore, setUpdatedBefore] = useState<string>('');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch tags for filter dropdown
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list({ limit: 1000 }),
  });

  // Search notes
  const searchParams: SearchNotesParams = {
    query: searchQuery || undefined,
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
  };

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search-notes', searchParams],
    queryFn: () => searchApi.searchNotes(searchParams),
    enabled: true,
  });


  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTagIds([]);
    setSelectedTagNames([]);
    setIsPinned(undefined);
    setIsArchived(undefined);
    setCreatedAfter('');
    setCreatedBefore('');
    setUpdatedAfter('');
    setUpdatedBefore('');
    setPage(0);
  };

  const totalPages = searchResults ? Math.ceil(searchResults.total / limit) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search in title and content..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                size={5}
              >
                {tagsData?.tags?.map((tag: { id: number; name: string }) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                )) || []}
              </select>
            </div>

            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPinned === true}
                    onChange={(e) => setIsPinned(e.target.checked ? true : undefined)}
                    className="mr-2"
                  />
                  <span className="text-sm">Pinned</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isArchived === true}
                    onChange={(e) => setIsArchived(e.target.checked ? true : undefined)}
                    className="mr-2"
                  />
                  <span className="text-sm">Archived</span>
                </label>
              </div>
            </div>

            {/* Date Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Created After</label>
              <input
                type="date"
                value={createdAfter}
                onChange={(e) => {
                  setCreatedAfter(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Created Before</label>
              <input
                type="date"
                value={createdBefore}
                onChange={(e) => {
                  setCreatedBefore(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
            {searchResults && (
              <div className="text-sm text-gray-600">
                Found {searchResults.total} note{searchResults.total !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Error searching notes. Please try again.</p>
            </div>
          )}

          {!isLoading && !error && searchResults && (
            <>
              {(!searchResults.notes || searchResults.notes.length === 0) ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No notes found. Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(searchResults.notes || []).map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
            {note.is_pinned && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pinned</span>
            )}
            {note.is_archived && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Archived</span>
            )}
          </div>
          {note.content && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{note.content}</p>
          )}
        </div>
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {note.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs rounded-full"
              style={{
                backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                color: tag.color || '#374151',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

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
    </div>
  );
}

