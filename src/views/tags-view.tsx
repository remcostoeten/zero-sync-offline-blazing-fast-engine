import React from 'react';
import { TagManager } from '../components/finance/tags/tag-manager';

type TProps = {
  api: any;
};

export function TagsView({ api }: TProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏷️ Tag Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage tags to organize your transactions with flexible categorization
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">💡 How Tags Work</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tags provide flexible organization beyond categories</li>
              <li>• Multiple tags can be applied to each transaction</li>
              <li>• Use tags for projects, people, locations, or any custom grouping</li>
              <li>• Filter and search transactions by tags to find related items quickly</li>
            </ul>
          </div>

          <TagManager api={api} />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-3">Tag Usage Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-purple-700 mb-2">🎯 Projects</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Kitchen Renovation</div>
                  <div>Website Redesign</div>
                  <div>Car Maintenance</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-green-700 mb-2">👥 People</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Family</div>
                  <div>Business Partner</div>
                  <div>Clients</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-blue-700 mb-2">📍 Locations</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Home Office</div>
                  <div>Travel</div>
                  <div>Local</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TagsView;
