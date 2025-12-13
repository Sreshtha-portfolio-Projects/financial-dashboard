import { formatCurrency } from '../../../lib/formatters';

export function BudgetCard({ budget, onEdit, onDelete }) {
  const percentage = Math.min(budget.percentage_used || 0, 100);
  const isOverBudget = budget.is_over_budget || false;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${isOverBudget ? 'border-2 border-red-500' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {budget.category_name || 'Uncategorized'}
          </h3>
          <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(budget)}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this budget?')) {
                onDelete(budget.id);
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Budget</span>
          <span className="font-semibold">{formatCurrency(budget.amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spent</span>
          <span className={isOverBudget ? 'text-red-600 font-semibold' : 'font-semibold'}>
            {formatCurrency(budget.spent)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className={budget.remaining < 0 ? 'text-red-600 font-semibold' : 'font-semibold'}>
            {formatCurrency(budget.remaining)}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{percentage.toFixed(1)}% used</span>
            {isOverBudget && <span className="text-red-600 font-semibold">Over Budget!</span>}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

