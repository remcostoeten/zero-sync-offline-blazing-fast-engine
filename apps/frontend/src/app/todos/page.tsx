import { CheckSquare, Star } from 'lucide-react';

export default function TodosPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-purple-50 rounded-full">
            <CheckSquare className="h-12 w-12 text-purple-600" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            To-dos Feature
          </h1>
          <p className="text-gray-600 mb-6">
            Task management with projects, deadlines, and collaboration is coming soon!
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Planned Features:</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-purple-500" />
              <span>Task lists with deadlines and priorities</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-purple-500" />
              <span>Project organization and team collaboration</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-purple-500" />
              <span>Calendar view and reminders</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-purple-500" />
              <span>Time tracking and productivity insights</span>
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
