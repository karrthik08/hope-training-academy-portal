import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAssessmentWithAttempts,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  getAttemptResponses
} from '../../api/assessments';

const TakeAssessment = () => {
  const { assessmentId, enrollmentId } = useParams();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [attemptResults, setAttemptResults] = useState(null);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (!startTime || !assessment?.time_limit_minutes || showResults) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const limit = assessment.time_limit_minutes * 60;
      const remaining = limit - elapsed;
      
      if (remaining <= 0) {
        handleSubmit(true);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, assessment, showResults]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await getAssessmentWithAttempts(assessmentId);
      setAssessment(data);
      
      if (data.remaining_attempts === 0) {
        alert('You have used all available attempts for this assessment');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      alert('Failed to load assessment');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttempt = async () => {
    try {
      const attempt = await startAssessmentAttempt(assessmentId, enrollmentId);
      setCurrentAttempt(attempt);
      setStartTime(Date.now());
      
      const initialResponses = {};
      assessment.questions.forEach(q => {
        initialResponses[q.id] = {
          question_id: q.id,
          assessment_id: assessmentId,
          enrollment_id: enrollmentId,
          response_text: '',
          selected_option_id: null,
          attempt_number: attempt.attempt_number
        };
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Error starting attempt:', error);
      alert('Failed to start assessment');
    }
  };

  const handleResponseChange = (questionId, value, isOption = false) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [isOption ? 'selected_option_id' : 'response_text']: value
      }
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return;
    }

    try {
      setSubmitting(true);
      
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
      const responsesArray = Object.values(responses);
      
      const result = await submitAssessmentAttempt(
        currentAttempt.id,
        responsesArray,
        timeSpent
      );
      
      setAttemptResults(result);
      setShowResults(true);
      
      if (assessment.show_correct_answers) {
        const attemptResponses = await getAttemptResponses(currentAttempt.id);
        const responseMap = {};
        attemptResponses.forEach(r => {
          responseMap[r.question_id] = r;
        });
        setResponses(responseMap);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading assessment...</div>;
  }

  if (!assessment) {
    return <div className="p-8 text-center">Assessment not found</div>;
  }

  if (showResults && attemptResults) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Assessment Complete!</h1>
            
            <div className={`text-6xl font-bold mb-4 ${attemptResults.passed ? 'text-green-600' : 'text-red-600'}`}>
              {attemptResults.score.toFixed(1)}%
            </div>
            
            <div className="text-xl mb-2">
              {attemptResults.passed ? (
                <span className="text-green-600">✅ Passed</span>
              ) : (
                <span className="text-red-600">❌ Did Not Pass</span>
              )}
            </div>
            
            <div className="text-gray-600 mb-4">
              Score: {attemptResults.points_earned} / {attemptResults.total_points} points
            </div>
            
            {!attemptResults.passed && assessment.remaining_attempts > 1 && (
              <div className="text-gray-700 mb-4">
                You have {assessment.remaining_attempts - 1} attempt{assessment.remaining_attempts - 1 !== 1 ? 's' : ''} remaining
              </div>
            )}
          </div>

          {assessment.show_correct_answers && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Review Your Answers</h2>
              <div className="space-y-4">
                {assessment.questions.map((question, idx) => {
                  const response = responses[question.id];
                  const isCorrect = response?.is_correct;
                  
                  return (
                    <div key={question.id} className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="font-semibold">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium">{question.question_text}</p>
                          <div className="mt-2">
                            {question.question_type === 'multiple_choice' && (
                              <div className="space-y-1">
                                {question.options.map((option) => {
                                  const isSelected = option.id === response?.selected_option_id;
                                  return (
                                    <div
                                      key={option.id}
                                      className={`p-2 rounded ${
                                        option.is_correct
                                          ? 'bg-green-100 border border-green-300'
                                          : isSelected
                                          ? 'bg-red-100 border border-red-300'
                                          : 'bg-white'
                                      }`}
                                    >
                                      {option.option_text}
                                      {option.is_correct && <span className="ml-2 text-green-600">✓ Correct</span>}
                                      {isSelected && !option.is_correct && <span className="ml-2 text-red-600">✗ Your answer</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {question.question_type === 'true_false' && (
                              <div>
                                <p>Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                  {response?.response_text}
                                </span></p>
                                <p>Correct answer: <span className="text-green-600">{question.correct_answer}</span></p>
                              </div>
                            )}
                            
                            {question.question_type === 'short_answer' && (
                              <div>
                                <p className="text-gray-700">Your answer: {response?.response_text}</p>
                                {response?.feedback && (
                                  <p className="text-sm text-gray-600 mt-1">Feedback: {response.feedback}</p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {question.explanation && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Back to Course
            </button>
            
            {!attemptResults.passed && assessment.remaining_attempts > 1 && (
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentAttempt(null);
                  setResponses({});
                  setStartTime(null);
                  loadAssessment();
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentAttempt) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">{assessment.title}</h1>
          
          {assessment.description && (
            <p className="text-gray-700 mb-6">{assessment.description}</p>
          )}
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">Assessment Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="font-medium">{assessment.questions?.length || 0}</p>
              </div>
              
              {assessment.time_limit_minutes && (
                <div>
                  <p className="text-sm text-gray-600">Time Limit</p>
                  <p className="font-medium">{assessment.time_limit_minutes} minutes</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600">Passing Score</p>
                <p className="font-medium">{assessment.passing_score}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Attempts Remaining</p>
                <p className="font-medium">{assessment.remaining_attempts}</p>
              </div>
            </div>
          </div>
          
          {assessment.user_attempts && assessment.user_attempts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Previous Attempts</h3>
              <div className="space-y-2">
                {assessment.user_attempts.map((attempt) => (
                  <div key={attempt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Attempt {attempt.attempt_number}</span>
                    <div className="flex gap-4 items-center">
                      <span className={attempt.passed ? 'text-green-600' : 'text-red-600'}>
                        {attempt.score?.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(attempt.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              onClick={handleStartAttempt}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              Start Assessment
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-300 px-6 py-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold">{assessment.title}</h1>
          {timeLeft !== null && (
            <div className={`text-xl font-mono font-bold ${
              timeLeft < 60 ? 'text-red-600' : 'text-gray-700'
            }`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>
              {Object.values(responses).filter(r => r.response_text || r.selected_option_id).length} / {assessment.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(Object.values(responses).filter(r => r.response_text || r.selected_option_id).length / assessment.questions.length) * 100}%`
              }}
            />
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {assessment.questions.map((question, idx) => (
            <div key={question.id} className="p-6 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2 mb-4">
                <span className="font-semibold text-lg">{idx + 1}.</span>
                <div className="flex-1">
                  <p className="text-lg font-medium mb-2">{question.question_text}</p>
                  <p className="text-sm text-gray-600 mb-3">{question.points} {question.points === 1 ? 'point' : 'points'}</p>
                  
                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3 p-3 bg-white rounded border hover:border-blue-400 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question_${question.id}`}
                            checked={responses[question.id]?.selected_option_id === option.id}
                            onChange={() => handleResponseChange(question.id, option.id, true)}
                            className="w-4 h-4"
                          />
                          <span>{option.option_text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {question.question_type === 'true_false' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-white rounded border hover:border-blue-400 cursor-pointer">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={responses[question.id]?.response_text === 'true'}
                          onChange={() => handleResponseChange(question.id, 'true')}
                          className="w-4 h-4"
                        />
                        <span>True</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-white rounded border hover:border-blue-400 cursor-pointer">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={responses[question.id]?.response_text === 'false'}
                          onChange={() => handleResponseChange(question.id, 'false')}
                          className="w-4 h-4"
                        />
                        <span>False</span>
                      </label>
                    </div>
                  )}
                  
                  {question.question_type === 'short_answer' && (
                    <textarea
                      value={responses[question.id]?.response_text || ''}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg"
                      rows="3"
                      placeholder="Type your answer here..."
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
          <button
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="bg-gray-300 px-6 py-3 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;