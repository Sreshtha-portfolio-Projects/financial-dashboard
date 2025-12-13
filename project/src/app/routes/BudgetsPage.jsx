import { useEffect, useState } from 'react';
import { useBudgetsStore } from '../../features/budgets/store/useBudgetsStore';
import { BudgetCard } from '../../features/budgets/components/BudgetCard';
import { BudgetForm } from '../../features/budgets/components/BudgetForm';

export function BudgetsPage() {
  const budgetsStore = useBudgetsStore();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    budgetsStore.fetchBudgets({ active: showActiveOnly ? 'true' : undefined });
  }, [showActiveOnly]);

  const handleAdd = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editingBudget) {
        await budgetsStore.updateBudget(editingBudget.id, payload);
      } else {
        await budgetsStore.addBudget(payload);
      }
      setShowForm(false);
      setEditingBudget(null);
      budgetsStore.fetchBudgets({ active: showActiveOnly ? 'true' : undefined });
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert(error.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    try {
      await budgetsStore.deleteBudget(id);
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert(error.message || 'Failed to delete budget');
    }
  };

  const overBudgetCount = budgetsStore.items.filter(b => b.is_over_budget).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          {overBudgetCount > 0 && (
            <p className="text-red-600 text-sm mt-1">
              {overBudgetCount} budget{overBudgetCount > 1 ? 's' : ''} over limit
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Active only</span>
          </label>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Budget
          </button>
        </div>
      </div>

      {budgetsStore.loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : budgetsStore.items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No budgets yet. Create your first budget to track spending.</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetsStore.items.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <BudgetForm
          budget={editingBudget}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingBudget(null);
          }}
          loading={budgetsStore.loading}
        />
      )}
    </div>
  );
}

