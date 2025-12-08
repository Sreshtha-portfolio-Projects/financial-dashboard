export function CategoryList({ categories, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-500">Loading categories...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No categories found. Create your first category to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            {category.icon && (
              <span className="text-2xl">{category.icon}</span>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              {category.color && (
                <div
                  className="w-4 h-4 rounded-full mt-1"
                  style={{ backgroundColor: category.color }}
                />
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(category)}
              className="text-indigo-600 hover:text-indigo-900 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

