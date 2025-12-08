import { useEffect, useState } from 'react';
import { useFiltersStore } from '../../store/useFiltersStore';
import { dashboardApi } from '../../features/dashboard/api/dashboardApi';
import { SummaryCards } from '../../features/dashboard/components/SummaryCards';
import { TrendChart } from '../../features/dashboard/components/TrendChart';
import { CategoryBreakdownChart } from '../../features/dashboard/components/CategoryBreakdownChart';

export function DashboardPage() {
  const filters = useFiltersStore();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [filters.startDate, filters.endDate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryData, trendData, breakdownData] = await Promise.all([
        dashboardApi.getSummary({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        dashboardApi.getTrend({
          startDate: filters.startDate,
          endDate: filters.endDate,
          groupBy: 'month',
        }),
        dashboardApi.getCategoryBreakdown({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      ]);

      setSummary(summaryData);
      setTrend(trendData);
      setCategoryBreakdown(breakdownData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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

      <SummaryCards summary={summary} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={trend} loading={loading} />
        <CategoryBreakdownChart data={categoryBreakdown} loading={loading} />
      </div>
    </div>
  );
}

