import React, { useState, useEffect } from 'react';
import type { TTag, TTagFormData, TApiListResponse, TApiResponse } from '../../../types/finance';

type TProps = {
  api: any;
};

export function TagManager({ api }: TProps) {
  const [tags, setTags] = useState<TTag[]>([]);
  const [formData, setFormData] = useState<TTagFormData>({
    name: '',
    color: '#3B82F6',
    description: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTag, setEditingTag] = useState<TTag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    loadTags();
  }, []);
  
  async function loadTags() {
    try {
      setLoading(true);
      const response: TApiListResponse<TTag> = await api.getTags();
      if (response.success && response.data) {
        setTags(response.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  }
  
  function resetForm() {
    setFormData({
      name: '',
      color: '#3B82F6',
      description: ''
    });
    setFormErrors({});
    setEditingTag(null);
  }
  
  function validateForm() {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Tag name is required';
    } else if (formData.name.length > 50) {
      errors.name = 'Tag name must be less than 50 characters';
    }
    
    if (!formData.color.match(/^#[0-9A-F]{6}$/i)) {
      errors.color = 'Color must be a valid hex color';
    }
    
    if (formData.description.length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      const payload = {
        name: formData.name,
        color: formData.color,
        description: formData.description || undefined
      };
      
      let response: TApiResponse<any>;
      
      if (editingTag) {
        response = await api.updateTag(editingTag.id, payload);
      } else {
        response = await api.createTag(payload);
      }
      
      if (response.success) {
        resetForm();
        await loadTags();
      }
    } catch (err) {
      console.error('Failed to save tag:', err);
    } finally {
      setSaving(false);
    }
  }
  
  async function handleDelete(id: number) {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all transactions.')) {
      try {
        const response = await api.deleteTag(id);
        if (response.success) {
          await loadTags();
        }
      } catch (err) {
        console.error('Failed to delete tag:', err);
      }
    }
  }
  
  function handleEdit(tag: TTag) {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || ''
    });
  }
  
  if (loading && tags.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600">Loading tags...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Tag Management</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Vacation, Family, Work"
              disabled={saving}
            />
            {formErrors.name && (
              <div className="text-red-500 text-sm mt-1">{formErrors.name}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-10 border-0 p-0"
                disabled={saving}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.color ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="#RRGGBB"
                disabled={saving}
              />
            </div>
            {formErrors.color && (
              <div className="text-red-500 text-sm mt-1">{formErrors.color}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Optional description"
              disabled={saving}
            />
            {formErrors.description && (
              <div className="text-red-500 text-sm mt-1">{formErrors.description}</div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
          </button>
          
          {editingTag && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Your Tags</h3>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              className="ml-2 underline" 
              onClick={() => {
                setError(null);
                loadTags();
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        {tags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tags found. Create your first tag to start organizing your transactions.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tags.map((tag) => (
              <div 
                key={tag.id} 
                className="border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <div>
                    <div className="font-medium">{tag.name}</div>
                    {tag.description && (
                      <div className="text-xs text-gray-500">{tag.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {tag.transaction_count} transaction{tag.transaction_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-1 text-gray-600 hover:text-gray-900"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-1 text-gray-600 hover:text-red-600"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
