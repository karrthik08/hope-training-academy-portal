import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const AdminMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  
  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [completionFilter, setCompletionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchMetrics();
    fetchTrainings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, completionFilter, fromDate, toDate, trainings]);

  const fetchMetrics = async () => {
    console.log('ENV CHECK:', import.meta.env.VITE_API_BASE_URL);
    console.log('FULL URL:', `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/metrics`);
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/metrics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Metrics response:', response.data);
      setMetrics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/trainings/detailed-metrics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrainings(response.data);
      setFilteredTrainings(response.data);
    } catch (error) {
      console.error('Failed to fetch trainings:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...trainings];

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (completionFilter) {
      filtered = filtered.filter(t => {
        const rate = t.completion_percentage || 0;
        if (completionFilter === 'high') return rate >= 75;
        if (completionFilter === 'medium') return rate >= 50 && rate < 75;
        if (completionFilter === 'low') return rate < 50;
        return true;
      });
    }

    setFilteredTrainings(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setCompletionFilter('');
    setFromDate('');
    setToDate('');
  };

  const exportToCSV = () => {
    const headers = ['Training Name', 'Category', 'Enrolled', 'Completed', 'Completion %'];
    const rows = filteredTrainings.map(t => [
      t.title,
      t.category || '',
      t.enrolled || 0,
      t.completed || 0,
      `${t.completion_percentage || 0}%`
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training-analytics.csv';
    a.click();
  };

  if (loading) return <div className="p-6">Loading metrics...</div>;
  if (!metrics) return <div className="p-6">Failed to load metrics</div>;

  const categories = [...new Set(trainings.map(t => t.category).filter(Boolean))];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold">Admin Metrics Dashboard</h1>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Trainings</h3>
          <p className="text-3xl font-bold text-blue-600">{metrics.totalTrainings}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold text-purple-600">{metrics.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Enrollments</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.totalEnrollments}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Completion Rate</h3>
          <p className="text-3xl font-bold text-indigo-600">{metrics.completionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Drop/Withdrawal Rate */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-lg font-semibold mb-4 text-red-700">Drop/Withdrawal Rate</h3>
          <p className="text-4xl font-bold text-red-600 mb-2">
            {metrics.dropWithdrawalRate.percentage}%
          </p>
          <p className="text-sm text-gray-600">
            {metrics.dropWithdrawalRate.total} withdrawals out of {metrics.totalEnrollments} enrollments
          </p>
        </div>

        {/* Login Frequency */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4 text-blue-700">Login Frequency</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Daily Active Users</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.loginFrequency.daily}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Weekly Active Users</p>
              <p className="text-2xl font-bold text-blue-500">{metrics.loginFrequency.weekly}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Monthly Active Users</p>
              <p className="text-2xl font-bold text-blue-400">{metrics.loginFrequency.monthly}</p>
            </div>
          </div>
        </div>

        {/* Test Pass Rates */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-4 text-green-700">Test Pass Rates</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Overall Pass Rate</p>
              <p className="text-2xl font-bold text-green-600">{metrics.testPassRates.overallPassRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">First Attempt Pass Rate</p>
              <p className="text-2xl font-bold text-green-500">{metrics.testPassRates.firstAttemptPassRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-green-400">{metrics.testPassRates.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trainings & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Popular Trainings</h3>
          <div className="space-y-3">
            {metrics.popularTrainings.map((training, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-700">{training.title}</span>
                <span className="font-semibold text-blue-600">{training.enrollments} enrollments</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {metrics.recentActivity.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="text-sm border-b pb-2">
                <p className="text-gray-900 font-medium">{activity.training}</p>
                <p className="text-gray-500 text-xs">{activity.user} - {new Date(activity.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment Statistics */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Assessment Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-gray-500 text-sm">Total Attempts</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.testPassRates.totalAttempts}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <p className="text-gray-500 text-sm">Passed</p>
            <p className="text-2xl font-bold text-green-600">{metrics.testPassRates.passed}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded">
            <p className="text-gray-500 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {metrics.testPassRates.totalAttempts - metrics.testPassRates.passed}
            </p>
          </div>
        </div>
      </div>

      {/* TRAINING ANALYTICS */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Training Analytics & Queries</h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters  */}
        {showFilters && (
          <div className="space-y-4 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Trainings</label>
              <input
                type="text"
                placeholder="Search by training name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Completion Rates</option>
                  <option value="high">High (75-100%)</option>
                  <option value="medium">Medium (50-74%)</option>
                  <option value="low">Low (0-49%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Reset Filters
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export to CSV
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredTrainings.length} of {trainings.length} trainings
        </p>

        {/* Training Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrainings.map((training) => (
                <tr key={training.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{training.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{training.category || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{training.enrolled || 0}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{training.completed || 0}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`px-2 py-1 rounded font-semibold ${
                      (training.completion_percentage || 0) >= 70 ? 'bg-green-100 text-green-800' : 
                      (training.completion_percentage || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {training.completion_percentage || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;