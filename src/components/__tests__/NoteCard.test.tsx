import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../test/testUtils';
import { mockNote } from '../../test/mockData';
import NoteTagEditor from '../NoteTagEditor';

// Simple NoteCard component for testing
function NoteCard({ note }: { note: typeof mockNote }) {
  return (
    <div data-testid="note-card">
      <h3>{note.title}</h3>
      {note.content && <p>{note.content}</p>}
      {note.is_pinned && <span>Pinned</span>}
      {note.is_archived && <span>Archived</span>}
      <NoteTagEditor note={note} />
    </div>
  );
}

describe('NoteCard', () => {
  it('renders note title and content', () => {
    render(<NoteCard note={mockNote} />);

    expect(screen.getByText(mockNote.title)).toBeInTheDocument();
    expect(screen.getByText(mockNote.content!)).toBeInTheDocument();
  });

  it('shows pinned badge when note is pinned', () => {
    const pinnedNote = { ...mockNote, is_pinned: true };
    render(<NoteCard note={pinnedNote} />);

    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('shows archived badge when note is archived', () => {
    const archivedNote = { ...mockNote, is_archived: true };
    render(<NoteCard note={archivedNote} />);

    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});

