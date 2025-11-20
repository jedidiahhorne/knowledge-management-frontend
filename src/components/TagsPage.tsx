import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import TagList from './TagList';
import TagForm from './TagForm';
import { type Tag } from '../lib/api';

export default function TagsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  return (
    <DashboardLayout
      selectedTagIds={selectedTagIds}
      onTagSelect={setSelectedTagIds}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tags</h1>
              <p className="text-gray-600">Manage your tags and organize your notes</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {showForm ? 'Cancel' : '+ New Tag'}
            </button>
          </div>
        </div>

        {/* Create/Edit Tag Form */}
        {(showForm || editingTag) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </h2>
            <TagForm
              tag={editingTag}
              onSuccess={() => {
                setShowForm(false);
                setEditingTag(undefined);
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingTag(undefined);
              }}
            />
          </div>
        )}

        {/* Active Filters */}
        {selectedTagIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <button
                onClick={() => setSelectedTagIds([])}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        {/* Tags List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <TagList
            selectedTagIds={selectedTagIds}
            onTagClick={(tag) => {
              if (selectedTagIds.includes(tag.id)) {
                setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
              } else {
                setSelectedTagIds([...selectedTagIds, tag.id]);
              }
            }}
            showActions={true}
            onEdit={(tag) => {
              setEditingTag(tag);
              setShowForm(true);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

