import { formatCurrency } from '../../../lib/formatters';

const typeIcons = {
  savings: '💰',
  debt: '💳',
  tax: '📊',
  investment: '📈',
};

export function GoalCard({ goal, onEdit, onDelete, onClick }) {
  const percentage = Math.min(goal.percentage || 0, 100);
  const isCompleted = goal.is_completed || false;

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow ${
        isCompleted ? 'border-2 border-green-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{typeIcons[goal.type] || '🎯'}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{goal.type}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(goal);
            }}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this goal?')) {
                onDelete(goal.id);
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Progress</span>
          <span className={`text-sm font-semibold ${isCompleted ? 'text-green-600' : ''}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Saved</span>
          <span className="font-semibold">{formatCurrency(goal.current_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Target</span>
          <span className="font-semibold">{formatCurrency(goal.target_amount)}</span>
        </div>
        {goal.remaining > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Remaining</span>
            <span className="font-semibold">{formatCurrency(goal.remaining)}</span>
          </div>
        )}
        {goal.deadline && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Deadline</span>
            <span className="text-sm">{new Date(goal.deadline).toLocaleDateString()}</span>
          </div>
        )}

        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                isCompleted ? 'bg-green-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {isCompleted && (
            <p className="text-green-600 text-sm font-semibold mt-2 text-center">🎉 Goal Achieved!</p>
          )}
        </div>
      </div>
    </div>
  );
}

