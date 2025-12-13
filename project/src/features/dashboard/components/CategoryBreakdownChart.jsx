import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../../lib/formatters';

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export function CategoryBreakdownChart({ data, loading }) {
  const [chartType, setChartType] = useState('donut'); // 'donut' or 'bar'

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-96 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-96 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
        No expense data available for the selected period
      </div>
    );
  }

  // Sort by value descending
  const sortedData = [...data]
    .sort((a, b) => b.total - a.total)
    .map((item, index) => ({
      name: item.category_name,
      value: item.total,
      color: item.category_color || COLORS[index % COLORS.length],
    }));

  const total = sortedData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Perfectly centered Donut Chart Label
  const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Only show label if slice is large enough (> 3%)
    if (percent < 0.03) return null;

    const RADIAN = Math.PI / 180;
    
    // Exact center of the donut ring (50% between inner and outer)
    const radius = (innerRadius + outerRadius) / 2;
    
    // Recharts: midAngle is in degrees, 0° at top, clockwise is positive
    // Convert to radians and adjust: subtract 90° to make 0° at right
    const angle = (midAngle - 90) * RADIAN;
    
    // Calculate exact center position
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={700}
        style={{
          textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const DonutLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => {
          const percentage = total > 0 
            ? ((entry.payload.value / total) * 100).toFixed(1) 
            : 0;
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{entry.value}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Bar Chart Components
  const BarCustomLabel = ({ x, y, width, value, payload }) => {
    return (
      <text
        x={x + width + 10}
        y={y + 15}
        fill="currentColor"
        className="text-gray-700 dark:text-gray-300"
        fontSize={12}
        fontWeight={500}
      >
        {formatCurrency(value)}
      </text>
    );
  };

  // Render Donut Chart
  const renderDonutChart = () => (
    <div className="py-4">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={sortedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderDonutLabel}
            outerRadius={110}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<DonutLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  // Render Bar Chart
  const renderBarChart = () => (
    <div className="py-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={120}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[0, 8, 8, 0]}
            label={<BarCustomLabel />}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense by Category</h3>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
          </div>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setChartType('donut')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                chartType === 'donut'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Donut
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart Container with proper spacing to prevent cutting */}
      <div className="min-h-[400px]">
        {chartType === 'donut' ? renderDonutChart() : renderBarChart()}
      </div>

      {/* Category List */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          {sortedData.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-24 text-right">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

