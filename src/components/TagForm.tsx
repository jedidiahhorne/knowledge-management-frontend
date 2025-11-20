import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, type Tag } from '../lib/api';

interface TagFormProps {
  tag?: Tag;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const COLOR_PRESETS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export default function TagForm({ tag, onSuccess, onCancel }: TagFormProps) {
  const initialFormData = useMemo(() => ({
    name: tag?.name || '',
    description: tag?.description || '',
    color: tag?.color || COLOR_PRESETS[0],
  }), [tag]);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color?: string; description?: string }) =>
      tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      if (!tag) {
        setFormData({ name: '', description: '', color: COLOR_PRESETS[0] });
      }
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError?.response?.data?.detail || 'Failed to create tag';
      setErrors({ submit: errorMessage });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; color?: string; description?: string }) =>
      tagsApi.update(tag!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['search-notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError?.response?.data?.detail || 'Failed to update tag';
      setErrors({ submit: errorMessage });
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Tag name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Tag name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 255) {
      newErrors.description = 'Description must be less than 255 characters';
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

    if (tag) {
      updateMutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color || undefined,
      });
    } else {
      createMutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
          Tag Name <span className="text-red-500">*</span>
        </label>
        <input
          id="tag-name"
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Work, Personal, Ideas"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="tag-description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          id="tag-description"
          value={formData.description}
          onChange={(e) => {
            setFormData({ ...formData, description: e.target.value });
            if (errors.description) setErrors({ ...errors, description: '' });
          }}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Add a description for this tag..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex items-center gap-3">
          {/* Color Presets */}
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all
                  ${formData.color === color
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
          {/* Custom Color Picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Custom</span>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">Preview:</span>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${formData.color}20`,
                color: formData.color,
              }}
            >
              {formData.name || 'Tag Name'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {tag
            ? (updateMutation.isPending ? 'Updating...' : 'Update Tag')
            : (createMutation.isPending ? 'Creating...' : 'Create Tag')
          }
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

