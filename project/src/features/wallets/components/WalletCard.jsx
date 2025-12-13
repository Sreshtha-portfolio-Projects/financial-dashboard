import { formatCurrency } from '../../../lib/formatters';

const typeIcons = {
  bank: '🏦',
  card: '💳',
  cash: '💵',
  wallet: '📱',
};

export function WalletCard({ wallet, onEdit, onDelete, onClick }) {
  return (
    <div
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{typeIcons[wallet.type] || '💰'}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{wallet.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{wallet.type}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(wallet);
            }}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this wallet?')) {
                onDelete(wallet.id);
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(wallet.balance, wallet.currency)}
        </p>
        <p className="text-sm text-gray-500 mt-1">{wallet.currency}</p>
      </div>
    </div>
  );
}

