import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessmentResults } from '../../api/assessments';

export default function AssessmentResults() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [assessmentId]);

  const loadResults = async () => {
    try {
      const data = await getAssessmentResults(assessmentId);
      setResults(data);
      console.log("Results received:", data);
      console.log("Attempts array:", data.attempts);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading results...</div>;
  if (!results) return <div className="text-center py-12">No results found</div>;

  const { assessment, total_participants, completed_count, average_score, pass_rate } = results;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-4">
        ← Back to Assessment Builder
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">📊 Assessment Results</h1>
        <h2 className="text-xl text-gray-600 mb-6">{assessment.title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Participants</div>
            <div className="text-3xl font-bold text-blue-600">{total_participants}</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-3xl font-bold text-green-600">{completed_count}</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Average Score</div>
            <div className="text-3xl font-bold text-purple-600">
              {average_score !== null ? `${average_score.toFixed(1)}%` : 'N/A'}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Pass Rate</div>
            <div className="text-3xl font-bold text-orange-600">
              {pass_rate !== null ? `${pass_rate.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Assessment Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{assessment.assessment_type.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-gray-600">Passing Score:</span>
              <span className="ml-2 font-medium">{assessment.passing_score}%</span>
            </div>
            <div>
              <span className="text-gray-600">Questions:</span>
              <span className="ml-2 font-medium">{assessment.questions?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Max Attempts:</span>
              <span className="ml-2 font-medium">{assessment.max_attempts || 'Unlimited'}</span>
            </div>
          </div>
        </div>
      </div>

      {completed_count === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No participants have completed this assessment yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Participant Attempts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.attempts && results.attempts.length > 0 ? (
                  results.attempts.map((attempt, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{attempt.user_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{attempt.attempt_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {attempt.score?.toFixed(1)}% ({attempt.points_earned || 0} / {attempt.total_points || 0})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.time_spent_seconds ? `${Math.floor(attempt.time_spent_seconds / 60)}m ${attempt.time_spent_seconds % 60}s` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attempt.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No attempts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
