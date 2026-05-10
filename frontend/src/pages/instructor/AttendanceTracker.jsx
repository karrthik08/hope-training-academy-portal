import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function AttendanceTracker() {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const [roster, setRoster] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [trainingTitle, setTrainingTitle] = useState('');

  useEffect(() => {
    loadData();
  }, [trainingId]);

  const loadData = async () => {
    try {
      // Load training info
      const trainingRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/trainings/${trainingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const trainingData = await trainingRes.json();
      setTrainingTitle(trainingData.title);

      // Load roster
      const rosterRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/instructor/trainings/${trainingId}/roster`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const rosterData = await rosterRes.json();
      setRoster(rosterData);

      // Load attendance
      const attendanceRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/attendance/training/${trainingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (enrollmentId, status) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hope_access_token')}`
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          session_date: new Date(selectedDate).toISOString(),
          status: status
        })
      });
      
      // Reload attendance
      loadData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const getAttendanceForSession = (enrollmentId, date) => {
    return attendance.find(a => 
      a.enrollment_id === enrollmentId && 
      a.session_date.startsWith(date)
    );
  };

  const getAttendanceStats = (enrollmentId) => {
    const records = attendance.filter(a => a.enrollment_id === enrollmentId);
    const present = records.filter(a => a.status === 'present').length;
    const total = records.length;
    return { present, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  if (loading) {
    return <div className="p-8">Loading attendance...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Tracker</h1>
          <p className="text-gray-600">{trainingTitle}</p>
        </div>
        <button
          onClick={() => navigate('/instructor')}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium mb-2">Session Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status for {selectedDate}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {roster.map((enrollment) => {
              const sessionAttendance = getAttendanceForSession(enrollment.id, selectedDate);
              const stats = getAttendanceStats(enrollment.id);
              
              return (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {enrollment.participant_name || enrollment.user_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => markAttendance(enrollment.id, 'present')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          sessionAttendance?.status === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(enrollment.id, 'absent')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          sessionAttendance?.status === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(enrollment.id, 'excused')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          sessionAttendance?.status === 'excused'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${stats.rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {stats.present}/{stats.total} ({stats.rate}%)
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {roster.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No participants enrolled yet.
          </div>
        )}
      </div>
    </div>
  );
}
