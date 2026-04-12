import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  createAssessment,
  getAssessmentsByTraining,
  deleteAssessment,
  createQuestion,
  deleteQuestion
} from '../../api/assessments';
import { getTrainingById } from '../../api/client';

const AssessmentBuilder = () => {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  
  const [training, setTraining] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [expandedAssessments, setExpandedAssessments] = useState({});
  
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    assessment_type: 'quiz',
    time_limit_minutes: null,
    passing_score: 70,
    max_attempts: 3,
    randomize_questions: false,
    show_correct_answers: true,
    is_required: false
  });
  
  const [showNewQuestion, setShowNewQuestion] = useState({});
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    correct_answer: '',
    explanation: '',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    loadData();
  }, [trainingId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trainingData, assessmentsData] = await Promise.all([
        getTrainingById(trainingId),
        getAssessmentsByTraining(trainingId)
      ]);
      setTraining(trainingData);
      setAssessments(assessmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!newAssessment.title.trim()) {
      alert('Please enter an assessment title');
      return;
    }

    try {
      await createAssessment({
        ...newAssessment,
        training_id: trainingId
      });
      
      setNewAssessment({
        title: '',
        description: '',
        assessment_type: 'quiz',
        time_limit_minutes: null,
        passing_score: 70,
        max_attempts: 3,
        randomize_questions: false,
        show_correct_answers: true,
        is_required: false
      });
      setShowNewAssessment(false);
      await loadData();
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Failed to create assessment');
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      await deleteAssessment(assessmentId);
      await loadData();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert('Failed to delete assessment');
    }
  };

  const toggleAssessment = (assessmentId) => {
    setExpandedAssessments(prev => ({
      ...prev,
      [assessmentId]: !prev[assessmentId]
    }));
  };

  const handleCreateQuestion = async (assessmentId) => {
    if (!newQuestion.question_text.trim()) {
      alert('Please enter a question');
      return;
    }

    try {
      let options = [];
      if (newQuestion.question_type === 'multiple_choice') {
        options = newQuestion.options.filter(opt => opt.option_text.trim());
        if (options.length < 2) {
          alert('Please provide at least 2 answer options');
          return;
        }
        if (!options.some(opt => opt.is_correct)) {
          alert('Please mark at least one option as correct');
          return;
        }
      }

      await createQuestion({
        ...newQuestion,
        assessment_id: assessmentId,
        options: newQuestion.question_type === 'multiple_choice' ? options : []
      });

      setNewQuestion({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        correct_answer: '',
        explanation: '',
        options: [
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      });
      setShowNewQuestion({ ...showNewQuestion, [assessmentId]: false });
      await loadData();
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await deleteQuestion(questionId);
      await loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const updateOption = (index, field, value) => {
    const updated = [...newQuestion.options];
    updated[index] = { ...updated[index], [field]: value };
    setNewQuestion({ ...newQuestion, options: updated });
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, { option_text: '', is_correct: false }]
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(`/instructor/course-builder/${trainingId}`)}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Course Builder
        </button>
        <h1 className="text-3xl font-bold mb-2">📝 Assessment Builder</h1>
        <p className="text-gray-600">{training?.title}</p>
      </div>

      <button
        onClick={() => setShowNewAssessment(!showNewAssessment)}
        className="mb-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
      >
        ➕ Add Assessment
      </button>

      {showNewAssessment && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-200">
          <h3 className="text-xl font-semibold mb-4">Create New Assessment</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={newAssessment.title}
                onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Pre-Test, Final Quiz"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newAssessment.assessment_type}
                onChange={(e) => setNewAssessment({ ...newAssessment, assessment_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="pre_test">Pre-Test</option>
                <option value="post_test">Post-Test</option>
                <option value="quiz">Quiz</option>
                <option value="knowledge_check">Knowledge Check</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newAssessment.description}
              onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Time Limit (min)</label>
              <input
                type="number"
                value={newAssessment.time_limit_minutes || ''}
                onChange={(e) => setNewAssessment({ ...newAssessment, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
              <input
                type="number"
                value={newAssessment.passing_score}
                onChange={(e) => setNewAssessment({ ...newAssessment, passing_score: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Max Attempts</label>
              <input
                type="number"
                value={newAssessment.max_attempts}
                onChange={(e) => setNewAssessment({ ...newAssessment, max_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssessment.is_required}
                onChange={(e) => setNewAssessment({ ...newAssessment, is_required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Required</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssessment.randomize_questions}
                onChange={(e) => setNewAssessment({ ...newAssessment, randomize_questions: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Randomize Questions</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssessment.show_correct_answers}
                onChange={(e) => setNewAssessment({ ...newAssessment, show_correct_answers: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Correct Answers</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateAssessment}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Create Assessment
            </button>
            <button
              onClick={() => setShowNewAssessment(false)}
              className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {assessments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl mb-2">No assessments yet</p>
            <p>Create your first assessment to test learner knowledge</p>
          </div>
        ) : (
          assessments.map((assessment) => (
            <div key={assessment.id} className="bg-white rounded-lg shadow-md border">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleAssessment(assessment.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">
                    {expandedAssessments[assessment.id] ? '▼' : '▶'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg">{assessment.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span className="bg-blue-100 px-2 py-1 rounded">
                        {assessment.assessment_type.replace('_', ' ')}
                      </span>
                      <span>{assessment.questions?.length || 0} questions</span>
                      <span>Passing: {assessment.passing_score}%</span>
                      {assessment.is_required && (
                        <span className="text-red-600 font-medium">Required</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/instructor/assessment-results/${assessment.id}`);
                  }}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 mr-2"
                >
                  �� View Results
                </button>
                
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAssessment(assessment.id);
                  }}
                  className="text-red-600 hover:text-red-800 px-3 py-1"
                >
                  🗑️ Delete
                </button>
              </div>

              {expandedAssessments[assessment.id] && (
                <div className="p-4 bg-gray-50 border-t">
                  {assessment.description && (
                    <p className="text-gray-700 mb-4">{assessment.description}</p>
                  )}

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Questions:</h4>
                    {assessment.questions && assessment.questions.length > 0 ? (
                      <div className="space-y-2">
                        {assessment.questions.map((question, idx) => (
                          <div key={question.id} className="bg-white p-3 rounded border flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-700">{idx + 1}.</span>
                                <div className="flex-1">
                                  <p className="text-gray-800">{question.question_text}</p>
                                  <div className="flex gap-3 text-sm text-gray-600 mt-1">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                                      {question.question_type.replace('_', ' ')}
                                    </span>
                                    <span>{question.points} points</span>
                                  </div>
                                  
                                  {question.question_type === 'multiple_choice' && question.options && (
                                    <div className="mt-2 ml-4 space-y-1">
                                      {question.options.map((option, optIdx) => (
                                        <div key={option.id} className="text-sm flex items-center gap-2">
                                          <span className={option.is_correct ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                            {String.fromCharCode(65 + optIdx)}.
                                          </span>
                                          <span>{option.option_text}</span>
                                          {option.is_correct && <span className="text-green-600">✓</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {question.question_type === 'true_false' && question.correct_answer && (
                                    <p className="text-sm text-green-600 mt-1">
                                      Correct: {question.correct_answer}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-800 text-sm px-2"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No questions yet</p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowNewQuestion({ ...showNewQuestion, [assessment.id]: !showNewQuestion[assessment.id] })}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    ➕ Add Question
                  </button>

                  {showNewQuestion[assessment.id] && (
                    <div className="mt-4 bg-white p-4 rounded-lg border-2 border-blue-200">
                      <h5 className="font-semibold mb-3">New Question</h5>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">Question Type</label>
                        <select
                          value={newQuestion.question_type}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">Question *</label>
                        <textarea
                          value={newQuestion.question_text}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                          rows="2"
                        />
                      </div>

                      {newQuestion.question_type === 'multiple_choice' && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-2">Answer Options</label>
                          {newQuestion.options.map((option, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={option.option_text}
                                onChange={(e) => updateOption(idx, 'option_text', e.target.value)}
                                className="flex-1 px-3 py-2 border rounded"
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              />
                              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded">
                                <input
                                  type="checkbox"
                                  checked={option.is_correct}
                                  onChange={(e) => updateOption(idx, 'is_correct', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">Correct</span>
                              </label>
                            </div>
                          ))}
                          <button onClick={addOption} className="text-blue-600 text-sm hover:underline">
                            + Add option
                          </button>
                        </div>
                      )}

                      {newQuestion.question_type === 'true_false' && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-2">Correct Answer</label>
                          <select
                            value={newQuestion.correct_answer}
                            onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                          >
                            <option value="">Select...</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Points</label>
                          <input
                            type="number"
                            value={newQuestion.points}
                            onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">Explanation (Optional)</label>
                        <textarea
                          value={newQuestion.explanation}
                          onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                          rows="2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreateQuestion(assessment.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Add Question
                        </button>
                        <button
                          onClick={() => setShowNewQuestion({ ...showNewQuestion, [assessment.id]: false })}
                          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssessmentBuilder;