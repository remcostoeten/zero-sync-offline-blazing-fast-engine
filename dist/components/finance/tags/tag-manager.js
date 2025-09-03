import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function TagManager({ api }) {
    const [tags, setTags] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        color: '#3B82F6',
        description: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    useEffect(() => {
        loadTags();
    }, []);
    async function loadTags() {
        try {
            setLoading(true);
            const response = await api.getTags();
            if (response.success && response.data) {
                setTags(response.data);
                setError(null);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tags');
            console.error('Failed to load tags:', err);
        }
        finally {
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
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = 'Tag name is required';
        }
        else if (formData.name.length > 50) {
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
    async function handleSubmit(e) {
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
            let response;
            if (editingTag) {
                response = await api.updateTag(editingTag.id, payload);
            }
            else {
                response = await api.createTag(payload);
            }
            if (response.success) {
                resetForm();
                await loadTags();
            }
        }
        catch (err) {
            console.error('Failed to save tag:', err);
        }
        finally {
            setSaving(false);
        }
    }
    async function handleDelete(id) {
        if (window.confirm('Are you sure you want to delete this tag? It will be removed from all transactions.')) {
            try {
                const response = await api.deleteTag(id);
                if (response.success) {
                    await loadTags();
                }
            }
            catch (err) {
                console.error('Failed to delete tag:', err);
            }
        }
    }
    function handleEdit(tag) {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            color: tag.color,
            description: tag.description || ''
        });
    }
    if (loading && tags.length === 0) {
        return (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "text-lg text-gray-600", children: "Loading tags..." }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-6", children: "Tag Management" }), _jsxs("form", { onSubmit: handleSubmit, className: "mb-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Tag Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "e.g., Vacation, Family, Work", disabled: saving }), formErrors.name && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: formErrors.name }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Color ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: formData.color, onChange: (e) => setFormData({ ...formData, color: e.target.value }), className: "h-10 w-10 border-0 p-0", disabled: saving }), _jsx("input", { type: "text", value: formData.color, onChange: (e) => setFormData({ ...formData, color: e.target.value }), className: `flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.color ? 'border-red-500' : 'border-gray-300'}`, placeholder: "#RRGGBB", disabled: saving })] }), formErrors.color && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: formErrors.color }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx("input", { type: "text", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Optional description", disabled: saving }), formErrors.description && (_jsx("div", { className: "text-red-500 text-sm mt-1", children: formErrors.description }))] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "submit", disabled: saving, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: saving ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag' }), editingTag && (_jsx("button", { type: "button", onClick: resetForm, disabled: saving, className: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300", children: "Cancel" }))] })] }), _jsxs("div", { className: "border-t pt-6", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Your Tags" }), error && (_jsxs("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: [error, _jsx("button", { className: "ml-2 underline", onClick: () => {
                                    setError(null);
                                    loadTags();
                                }, children: "Retry" })] })), tags.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No tags found. Create your first tag to start organizing your transactions." })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: tags.map((tag) => (_jsxs("div", { className: "border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow", style: { borderLeftColor: tag.color, borderLeftWidth: '4px' }, children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: tag.color } }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: tag.name }), tag.description && (_jsx("div", { className: "text-xs text-gray-500", children: tag.description })), _jsxs("div", { className: "text-xs text-gray-400 mt-1", children: [tag.transaction_count, " transaction", tag.transaction_count !== 1 ? 's' : ''] })] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => handleEdit(tag), className: "p-1 text-gray-600 hover:text-gray-900", title: "Edit", children: "\u270F\uFE0F" }), _jsx("button", { onClick: () => handleDelete(tag.id), className: "p-1 text-gray-600 hover:text-red-600", title: "Delete", children: "\uD83D\uDDD1\uFE0F" })] })] }, tag.id))) }))] })] }));
}
//# sourceMappingURL=tag-manager.js.map