import { StickyNote, Calendar, Star } from 'lucide-react';

export default function NotesPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-50 rounded-full">
            <StickyNote className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Notes Feature
          </h1>
          <p className="text-gray-600 mb-6">
            Rich text note-taking with organization and search capabilities is coming soon!
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Planned Features:</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Rich text editor with markdown support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Folder organization and tagging</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Full-text search and filtering</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Collaboration and sharing</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          This feature will be available in a future update.
        </div>
      </div>
    </div>
  );
}
