import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function MetricsDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalUsers: 0,
    totalEnrollments: 0,
    completionRate: 0
  });
  const [popularTrainings, setPopularTrainings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ad Hoc Query State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categories, setCategories] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [allTrainings, setAllTrainings] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchAllTrainings();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, selectedStatus, dateFrom, dateTo, allTrainings]);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/admin/metrics');
      console.log('Admin metrics response:', response.data); // Debug log
      
      setStats({
  totalTrainings: response.data.totalTrainings || 0,
  totalUsers: response.data.totalUsers || 0,
  totalEnrollments: response.data.totalEnrollments || 0,
  completionRate: response.data.completionRate || 0
});
      setPopularTrainings(response.data.popular_trainings || []);
      setRecentActivity(response.data.recent_activity || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTrainings = async () => {
  try {
    const response = await api.get('/admin/trainings/detailed-metrics');
    console.log('Detailed metrics response:', response.data); // ADD THIS LINE
    console.log('Number of trainings:', response.data.length); // ADD THIS LINE
    setAllTrainings(response.data);
    setFilteredTrainings(response.data);
  } catch (error) {
    console.error('Error fetching detailed metrics:', error);
    try {
      const fallback = await api.get('/trainings/public');
      const trainingsWithMetrics = fallback.data.map(training => ({
        ...training,
        total_enrolled: 0,
        total_completed: 0,
        completion_rate: 0
      }));
      setAllTrainings(trainingsWithMetrics);
      setFilteredTrainings(trainingsWithMetrics);
    } catch (fallbackError) {
      console.error('Error fetching fallback trainings:', fallbackError);
    }
  }
};

  const fetchCategories = async () => {
    try {
      const response = await api.get('/trainings/public');
      const uniqueCategories = [...new Set(response.data.map(t => t.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allTrainings];

    if (searchTerm) {
      filtered = filtered.filter(training =>
        training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(training => training.category === selectedCategory);
    }

    if (selectedStatus) {
      filtered = filtered.filter(training => {
        const rate = training.completion_rate || 0;
        if (selectedStatus === 'high') return rate >= 75;
        if (selectedStatus === 'medium') return rate >= 50 && rate < 75;
        if (selectedStatus === 'low') return rate < 50;
        return true;
      });
    }

    if (dateFrom || dateTo) {
      filtered = filtered.filter(training => {
        if (!training.created_at) return true;
        const createdDate = new Date(training.created_at);
        if (dateFrom && createdDate < new Date(dateFrom)) return false;
        if (dateTo && createdDate > new Date(dateTo)) return false;
        return true;
      });
    }

    setFilteredTrainings(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
  };

  const exportToCSV = () => {
    const headers = ['Training Name', 'Category', 'Enrolled', 'Completed', 'Completion Rate'];
    const csvData = filteredTrainings.map(t => [
      t.title || 'N/A',
      t.category || 'N/A',
      t.total_enrolled || 0,
      t.total_completed || 0,
      (t.completion_rate || 0) + '%'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Metrics Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Trainings</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalTrainings}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalEnrollments}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Completion Rate</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.completionRate}%</p>
        </div>
      </div>

      {/* Ad Hoc Query Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Training Analytics & Queries</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Trainings</label>
              <input
                type="text"
                placeholder="Search by training name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Completion Rate</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Rates</option>
                  <option value="high">High (75%+)</option>
                  <option value="medium">Medium (50-74%)</option>
                  <option value="low">Low (below 50%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Reset Filters
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export to CSV
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredTrainings.length} of {allTrainings.length} trainings
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrainings.map((training) => (
                <tr key={training.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{training.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{training.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{training.total_enrolled || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{training.total_completed || 0}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      (training.completion_rate || 0) >= 75 ? 'bg-green-100 text-green-800' :
                      (training.completion_rate || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {training.completion_rate || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTrainings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No trainings found.
            </div>
          )}
        </div>
      </div>

      {/* Popular Trainings & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Trainings</h2>
          {popularTrainings.length > 0 ? (
            popularTrainings.map((training, index) => (
              <div key={training.id} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2">
                <span className="font-medium">#{index + 1} {training.title}</span>
                <span className="text-blue-600">{training.enrollments} enrollments</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
                <p className="font-medium">{activity.user_email}</p>
                <p className="text-sm text-gray-600">{activity.training_title}</p>
                <p className="text-xs text-gray-500">{new Date(activity.enrolled_at).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}