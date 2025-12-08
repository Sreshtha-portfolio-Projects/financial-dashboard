import { useEffect, useState } from 'react';
import { useCategoriesStore } from '../../features/categories/store/useCategoriesStore';
import { CategoryList } from '../../features/categories/components/CategoryList';
import { CategoryForm } from '../../features/categories/components/CategoryForm';

export function CategoriesPage() {
  const categoriesStore = useCategoriesStore();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    categoriesStore.fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editingCategory) {
        await categoriesStore.updateCategory(editingCategory.id, payload);
      } else {
        await categoriesStore.addCategory(payload);
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert(error.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoriesStore.deleteCategory(id);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(error.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <CategoryList
          categories={categoriesStore.items}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={categoriesStore.loading}
        />
      </div>

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          loading={categoriesStore.loading}
        />
      )}
    </div>
  );
}

