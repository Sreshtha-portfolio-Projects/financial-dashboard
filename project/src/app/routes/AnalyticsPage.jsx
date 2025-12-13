import { useEffect, useState } from 'react';
import { useFiltersStore } from '../../store/useFiltersStore';
import { analyticsApi } from '../../features/analytics/api/analyticsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../../lib/formatters';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function AnalyticsPage() {
  const filters = useFiltersStore();
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState([]);
  const [topMerchants, setTopMerchants] = useState([]);
  const [walletSplit, setWalletSplit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [filters.startDate, filters.endDate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [categoryData, incomeExpenseData, merchantsData, walletData] = await Promise.all([
        analyticsApi.getSpendingByCategory({
          startDate: filters.startDate,
          endDate: filters.endDate,
          groupBy: 'month',
        }),
        analyticsApi.getIncomeVsExpense({
          startDate: filters.startDate,
          endDate: filters.endDate,
          groupBy: 'month',
        }),
        analyticsApi.getTopMerchants({
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: 10,
        }),
        analyticsApi.getWalletExpenseSplit({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      ]);

      setSpendingByCategory(categoryData);
      setIncomeVsExpense(incomeExpenseData);
      setTopMerchants(merchantsData);
      setWalletSplit(walletData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform spending by category for stacked bar chart
  const categoryChartData = spendingByCategory.map(period => {
    const data = { period: period.period };
    period.categories.forEach(cat => {
      data[cat.name] = cat.amount;
    });
    return data;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex space-x-2">
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => filters.setStartDate(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          />
          <span className="self-center text-gray-500">to</span>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => filters.setEndDate(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Income vs Expense Line Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Income vs Expense Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Expense" />
                <Line type="monotone" dataKey="net" stroke="#3B82F6" name="Net" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category Stacked Bar */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    {spendingByCategory[0]?.categories.map((cat, index) => (
                      <Bar
                        key={cat.name}
                        dataKey={cat.name}
                        stackId="a"
                        fill={cat.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available</p>
              )}
            </div>

            {/* Wallet Expense Split Pie */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Expense by Wallet</h3>
              {walletSplit.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={walletSplit}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {walletSplit.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available</p>
              )}
            </div>
          </div>

          {/* Top Merchants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Top Merchants</h3>
            {topMerchants.length > 0 ? (
              <div className="space-y-2">
                {topMerchants.map((merchant, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{merchant.name}</p>
                      <p className="text-sm text-gray-500">{merchant.count} transactions</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(merchant.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No data available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

