import { useEffect, useState } from 'react';
import { useGoalsStore } from '../../features/goals/store/useGoalsStore';
import { GoalCard } from '../../features/goals/components/GoalCard';
import { GoalForm } from '../../features/goals/components/GoalForm';
import { goalsApi } from '../../features/goals/api/goalsApi';

export function GoalsPage() {
  const goalsStore = useGoalsStore();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalDetails, setGoalDetails] = useState(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    goalsStore.fetchGoals({ active: showActiveOnly ? 'true' : undefined });
  }, [showActiveOnly]);

  useEffect(() => {
    if (selectedGoal) {
      loadGoalDetails(selectedGoal.id);
    }
  }, [selectedGoal]);

  const loadGoalDetails = async (goalId) => {
    try {
      const details = await goalsApi.getGoal(goalId);
      setGoalDetails(details);
    } catch (error) {
      console.error('Failed to load goal details:', error);
    }
  };

  const handleAdd = () => {
    setEditingGoal(null);
    setShowForm(true);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editingGoal) {
        await goalsStore.updateGoal(editingGoal.id, payload);
      } else {
        await goalsStore.addGoal(payload);
      }
      setShowForm(false);
      setEditingGoal(null);
      goalsStore.fetchGoals({ active: showActiveOnly ? 'true' : undefined });
    } catch (error) {
      console.error('Failed to save goal:', error);
      alert(error.message || 'Failed to save goal');
    }
  };

  const handleDelete = async (id) => {
    try {
      await goalsStore.deleteGoal(id);
      if (selectedGoal?.id === id) {
        setSelectedGoal(null);
        setGoalDetails(null);
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert(error.message || 'Failed to delete goal');
    }
  };

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal);
  };

  if (selectedGoal && goalDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => {
                setSelectedGoal(null);
                setGoalDetails(null);
              }}
              className="text-indigo-600 hover:text-indigo-800 mb-2"
            >
              ← Back to Goals
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedGoal.name}</h1>
            <p className="text-gray-600 capitalize">{selectedGoal.type}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Allocations</h3>
          {goalDetails.allocations && goalDetails.allocations.length > 0 ? (
            <div className="space-y-2">
              {goalDetails.allocations.map((alloc) => (
                <div key={alloc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{alloc.wallet_name}</span>
                  <span className="font-semibold">{formatCurrency(alloc.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No allocations yet</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
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
            Add Goal
          </button>
        </div>
      </div>

      {goalsStore.loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : goalsStore.items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No goals yet. Create your first financial goal.</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsStore.items.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={() => handleGoalClick(goal)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
          loading={goalsStore.loading}
        />
      )}
    </div>
  );
}

