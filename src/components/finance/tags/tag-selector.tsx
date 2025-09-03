import React, { useState, useEffect, useRef } from 'react';
import type { TTag, TApiListResponse } from '../../../types/finance';

type TProps = {
  selectedTagIds: number[];
  onTagsChange: (tagIds: number[]) => void;
  api: any;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export function TagSelector({ 
  selectedTagIds, 
  onTagsChange, 
  api, 
  disabled = false,
  className = '',
  placeholder = 'Select tags...'
}: TProps) {
  const [tags, setTags] = useState<TTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadTags() {
    try {
      setLoading(true);
      const response: TApiListResponse<TTag> = await api.getTags();
      if (response.success && response.data) {
        setTags(response.data);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  }

  function removeTag(tagId: number) {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  }

  function clearAllTags() {
    onTagsChange([]);
  }

  function handleInputClick() {
    if (!disabled) {
      setIsOpen(true);
      inputRef.current?.focus();
    }
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    if (!isOpen) setIsOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  }

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const availableTags = filteredTags.filter(tag => !selectedTagIds.includes(tag.id));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tags
      </label>
      
      <div
        className={`min-h-[42px] w-full px-3 py-2 border rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 cursor-text ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
        } border-gray-300`}
        onClick={handleInputClick}
      >
        <div className="flex flex-wrap items-center gap-1">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag.id);
                  }}
                  className="ml-1 text-white hover:text-gray-200"
                >
                  ×
                </button>
              )}
            </span>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm"
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            disabled={disabled}
          />
          
          {selectedTags.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAllTags();
              }}
              className="text-gray-400 hover:text-gray-600 text-sm"
              title="Clear all tags"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500 text-sm">Loading tags...</div>
          ) : availableTags.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              {searchTerm ? 'No tags match your search' : 'No more tags available'}
            </div>
          ) : (
            <>
              {searchTerm && (
                <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b">
                  Search results for "{searchTerm}"
                </div>
              )}
              
              {availableTags.map((tag) => (
                <div
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{tag.name}</div>
                    {tag.description && (
                      <div className="text-xs text-gray-500">{tag.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {tag.transaction_count}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
