import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProgressTracker() {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainingTitle, setTrainingTitle] = useState('');

  useEffect(() => {
    loadData();
  }, [trainingId]);

  const loadData = async () => {
    try {
      // Load training info
      const trainingRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/trainings/${trainingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const trainingData = await trainingRes.json();
      setTrainingTitle(trainingData.title);

      // Load progress summary
      const summaryRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/progress/training/${trainingId}/summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const summaryData = await summaryRes.json();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading progress data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Progress Tracker</h1>
          <p className="text-gray-600">{trainingTitle}</p>
        </div>
        <button
          onClick={() => navigate('/instructor')}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Progress Summary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modules Completed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion %</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {summary.map((participant) => (
              <tr key={participant.enrollment_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">
                  {participant.user_email}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          participant.completion_percentage === 100
                            ? 'bg-green-600'
                            : participant.completion_percentage > 0
                            ? 'bg-blue-600'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${participant.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {participant.completed_modules} / {participant.total_modules}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    participant.completion_percentage === 100
                      ? 'bg-green-100 text-green-700'
                      : participant.completion_percentage > 50
                      ? 'bg-blue-100 text-blue-700'
                      : participant.completion_percentage > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {participant.completion_percentage}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {summary.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No participants enrolled yet.
          </div>
        )}
      </div>
    </div>
  );
}
