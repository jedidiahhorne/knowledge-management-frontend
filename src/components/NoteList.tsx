import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notesApi, tagsApi, type Note } from '../lib/api';
import { format } from 'date-fns';
import DashboardLayout from './DashboardLayout';
import NoteTagEditor from './NoteTagEditor';

export default function NoteList() {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch tags for filtering
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list({ limit: 1000 }),
  });

  // Fetch notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', selectedTagIds, page],
    queryFn: () =>
      notesApi.list({
        skip: page * limit,
        limit,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }),
  });

  const allTags = Array.isArray(tagsData) ? tagsData : [];
  const notesList = Array.isArray(notes) ? notes : [];
  const totalPages = Math.ceil((notesList.length || 0) / limit);

  return (
    <DashboardLayout
      selectedTagIds={selectedTagIds}
      onTagSelect={setSelectedTagIds}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes</h1>
              <p className="text-gray-600">Manage and organize your notes</p>
            </div>
            <Link
              to="/notes/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + New Note
            </Link>
          </div>
        </div>

        {/* Notes List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notes...</p>
          </div>
        ) : notesList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No notes found.</p>
            <Link
              to="/notes/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first note
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {notesList.map((note: Note) => (
                <NoteListItem key={note.id} note={note} allTags={allTags} />
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
      </div>
    </DashboardLayout>
  );
}

function NoteListItem({ note }: { note: Note }) {
  return (
    <Link
      to={`/notes/${note.id}`}
      className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{note.title}</h3>
            {note.is_pinned && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pinned</span>
            )}
            {note.is_archived && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Archived</span>
            )}
          </div>
          {note.content && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{note.content}</p>
          )}
        </div>
      </div>

      {/* Tags */}
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

