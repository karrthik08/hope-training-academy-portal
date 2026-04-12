import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Reports() {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [trainingTitle, setTrainingTitle] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [trainingId]);

  const loadSummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/reports/training/${trainingId}/summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const data = await response.json();
      setSummary(data);
      setTrainingTitle(data.training_title);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadAttendanceReport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/reports/training/${trainingId}/attendance-export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${trainingTitle.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attendance report:', error);
      alert('Failed to download attendance report');
    }
  };

  const downloadCompletionReport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/reports/training/${trainingId}/completion-export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `completion_report_${trainingTitle.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading completion report:', error);
      alert('Failed to download completion report');
    }
  };

  if (loading) {
    return <div className="p-8">Loading reports...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Training Reports</h1>
          <p className="text-gray-600">{trainingTitle}</p>
        </div>
        <button
          onClick={() => navigate('/instructor')}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'attendance'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Attendance Report
          </button>
          <button
            onClick={() => setActiveTab('completion')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'completion'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completion Report
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'summary' && summary && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Training Summary</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Enrolled</p>
                  <p className="text-3xl font-bold text-blue-600">{summary.total_enrolled}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{summary.total_completed}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{summary.completion_rate}%</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-3xl font-bold text-yellow-600">{summary.duration_hours}h</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-lg font-medium">{summary.category}</p>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  summary.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {summary.status}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Attendance Report</h2>
                <button
                  onClick={downloadAttendanceReport}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download CSV
                </button>
              </div>
              <p className="text-gray-600">
                Click the button above to download a detailed attendance report with participant names, 
                attendance records, and statistics in CSV format (opens in Excel).
              </p>
            </div>
          )}

          {activeTab === 'completion' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Completion Report</h2>
                <button
                  onClick={downloadCompletionReport}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download CSV
                </button>
              </div>
              <p className="text-gray-600">
                Click the button above to download a report of all participants who completed this training, 
                including enrollment dates, completion dates, and certificate IDs in CSV format.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
