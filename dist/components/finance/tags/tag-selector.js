import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
export function TagSelector({ selectedTagIds, onTagsChange, api, disabled = false, className = '', placeholder = 'Select tags...' }) {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    useEffect(() => {
        loadTags();
    }, []);
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
            const response = await api.getTags();
            if (response.success && response.data) {
                setTags(response.data);
            }
        }
        catch (err) {
            console.error('Failed to load tags:', err);
        }
        finally {
            setLoading(false);
        }
    }
    function toggleTag(tagId) {
        if (selectedTagIds.includes(tagId)) {
            onTagsChange(selectedTagIds.filter(id => id !== tagId));
        }
        else {
            onTagsChange([...selectedTagIds, tagId]);
        }
    }
    function removeTag(tagId) {
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
    function handleSearchChange(value) {
        setSearchTerm(value);
        if (!isOpen)
            setIsOpen(true);
    }
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        }
    }
    const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
    const filteredTags = tags.filter(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const availableTags = filteredTags.filter(tag => !selectedTagIds.includes(tag.id));
    return (_jsxs("div", { className: `relative ${className}`, ref: dropdownRef, children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tags" }), _jsx("div", { className: `min-h-[42px] w-full px-3 py-2 border rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 cursor-text ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'} border-gray-300`, onClick: handleInputClick, children: _jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [selectedTags.map((tag) => (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white", style: { backgroundColor: tag.color }, children: [tag.name, !disabled && (_jsx("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        removeTag(tag.id);
                                    }, className: "ml-1 text-white hover:text-gray-200", children: "\u00D7" }))] }, tag.id))), _jsx("input", { ref: inputRef, type: "text", value: searchTerm, onChange: (e) => handleSearchChange(e.target.value), onKeyDown: handleKeyDown, className: "flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm", placeholder: selectedTags.length === 0 ? placeholder : '', disabled: disabled }), selectedTags.length > 0 && !disabled && (_jsx("button", { type: "button", onClick: (e) => {
                                e.stopPropagation();
                                clearAllTags();
                            }, className: "text-gray-400 hover:text-gray-600 text-sm", title: "Clear all tags", children: "Clear" }))] }) }), isOpen && !disabled && (_jsx("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto", children: loading ? (_jsx("div", { className: "px-3 py-2 text-gray-500 text-sm", children: "Loading tags..." })) : availableTags.length === 0 ? (_jsx("div", { className: "px-3 py-2 text-gray-500 text-sm", children: searchTerm ? 'No tags match your search' : 'No more tags available' })) : (_jsxs(_Fragment, { children: [searchTerm && (_jsxs("div", { className: "px-3 py-2 text-xs font-medium text-gray-400 border-b", children: ["Search results for \"", searchTerm, "\""] })), availableTags.map((tag) => (_jsxs("div", { onClick: () => toggleTag(tag.id), className: "px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0", children: [_jsx("div", { className: "w-3 h-3 rounded-full flex-shrink-0", style: { backgroundColor: tag.color } }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-sm", children: tag.name }), tag.description && (_jsx("div", { className: "text-xs text-gray-500", children: tag.description }))] }), _jsx("div", { className: "text-xs text-gray-400", children: tag.transaction_count })] }, tag.id)))] })) }))] }));
}
//# sourceMappingURL=tag-selector.js.map