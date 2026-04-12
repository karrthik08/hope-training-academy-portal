import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bulkEnroll, getAvailableUsers } from '../../api/enrollments';

export default function BulkEnrollment() {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState('csv'); // 'csv' or 'select'
  const [csvText, setCsvText] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (method === 'select') {
      loadAvailableUsers();
    }
  }, [method, trainingId]);

  const loadAvailableUsers = async () => {
    try {
      const users = await getAvailableUsers(trainingId);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCsvEnroll = async () => {
    setLoading(true);
    setResults(null);
    
    const emails = csvText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('@'));

    try {
      const result = await bulkEnroll(trainingId, emails);
      setResults(result);
      setCsvText('');
    } catch (error) {
      console.error('Error enrolling users:', error);
      alert('Failed to enroll users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEnroll = async () => {
    setLoading(true);
    setResults(null);

    const emails = selectedUsers.map(userId => {
      const user = availableUsers.find(u => u.id === userId);
      return user?.email;
    }).filter(Boolean);

    try {
      const result = await bulkEnroll(trainingId, emails);
      setResults(result);
      setSelectedUsers([]);
      loadAvailableUsers(); // Refresh the list
    } catch (error) {
      console.error('Error enrolling users:', error);
      alert('Failed to enroll users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button 
        onClick={() => navigate(-1)} 
        className="text-blue-600 hover:underline mb-4"
      >
        ← Back to Roster
      </button>

      <h1 className="text-3xl font-bold mb-6">Bulk Enrollment</h1>

      {/* Method Selection */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setMethod('csv')}
          className={`px-4 py-2 rounded ${
            method === 'csv' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          📄 CSV/Email List
        </button>
        <button
          onClick={() => setMethod('select')}
          className={`px-4 py-2 rounded ${
            method === 'select' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          👥 Select Users
        </button>
      </div>

      {/* CSV Method */}
      {method === 'csv' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enroll by Email</h2>
          <p className="text-gray-600 mb-4">
            Enter one email address per line:
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
            className="w-full border rounded p-3 h-48 font-mono text-sm"
          />
          <button
            onClick={handleCsvEnroll}
            disabled={!csvText.trim() || loading}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Enrolling...' : 'Enroll Users'}
          </button>
        </div>
      )}

      {/* Select Method */}
      {method === 'select' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Users to Enroll</h2>
          
          {availableUsers.length === 0 ? (
            <p className="text-gray-500">No available users to enroll</p>
          ) : (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setSelectedUsers(availableUsers.map(u => u.id))}
                  className="text-blue-600 hover:underline mr-4"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-blue-600 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded">
                {availableUsers.map(user => (
                  <label 
                    key={user.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleSelectEnroll}
                disabled={selectedUsers.length === 0 || loading}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Enrolling...' : `Enroll ${selectedUsers.length} User(s)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Enrollment Results</h2>
          
          {results.success.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-green-600 mb-2">
                ✓ Successfully Enrolled ({results.success.length})
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {results.success.map((email, i) => (
                  <li key={i}>{email}</li>
                ))}
              </ul>
            </div>
          )}

          {results.failed.length > 0 && (
            <div>
              <h3 className="font-medium text-red-600 mb-2">
                ✗ Failed ({results.failed.length})
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {results.failed.map((item, i) => (
                  <li key={i}>
                    {item.email}: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
