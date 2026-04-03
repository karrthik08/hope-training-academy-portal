import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { myEnrollments, getCourseContent, getContentProgress, markContentComplete, markContentIncomplete } from '../../api/client'

export default function CourseView() {
  const { enrollmentId } = useParams()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState(null)
  const [content, setContent] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [enrollmentId])

  const loadData = async () => {
    setLoading(true)
    try {
      const enrollments = await myEnrollments()
      const currentEnrollment = enrollments.find(e => e.id === enrollmentId)
      
      if (!currentEnrollment) {
        alert('Enrollment not found')
        navigate('/')
        return
      }

      const [contentData, progressData] = await Promise.all([
        getCourseContent(currentEnrollment.training_id),
        getContentProgress(enrollmentId)
      ])

      setEnrollment(currentEnrollment)
      setContent(contentData)
      setProgress(progressData)
    } catch (e) {
      console.error(e)
      alert('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const isCompleted = (contentId) => {
    return progress.some(p => p.content_id === contentId && p.completed)
  }

  const handleToggleComplete = async (contentId) => {
    try {
      if (isCompleted(contentId)) {
        await markContentIncomplete(enrollmentId, contentId)
      } else {
        await markContentComplete(enrollmentId, contentId)
      }
      await loadData()
    } catch (e) {
      alert('Failed to update progress')
    }
  }

  const calculateProgress = () => {
    if (content.length === 0) return 0
    const completed = progress.filter(p => p.completed).length
    return Math.round((completed / content.length) * 100)
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'pdf': return '📄'
      case 'link': return '🔗'
      case 'text': return '📝'
      default: return '📌'
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  if (!enrollment) return <div className="text-center py-12">Course not found</div>

  const progressPercent = calculateProgress()

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/')} className="text-blue-600 text-sm hover:underline mb-4">
        ← Back to My Courses
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{enrollment.training?.title}</h1>
        <p className="text-gray-600 mb-4">{enrollment.training?.description}</p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Course Progress</span>
            <span className="text-gray-600">{progressPercent}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {enrollment.training?.category && (
          <p className="text-sm text-gray-500">
            <span className="font-medium">Category:</span> {enrollment.training.category}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Course Content ({content.length} items)</h2>
        </div>

        {content.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No content available yet
          </div>
        ) : (
          <div className="divide-y">
            {content.map((item, idx) => {
              const completed = isCompleted(item.id)
              return (
                <div
                  key={item.id}
                  className={`p-6 hover:bg-gray-50 transition ${completed ? 'bg-green-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={completed}
                      onChange={() => handleToggleComplete(item.id)}
                      className="mt-1 h-5 w-5 text-green-600 cursor-pointer"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getContentTypeIcon(item.content_type)}</span>
                        <h3 className={`text-lg font-semibold ${completed ? 'text-green-700' : ''}`}>
                          {idx + 1}. {item.title}
                        </h3>
                      </div>

                      {item.content_value && (
                        <div className="mt-2">
                          {item.content_type === 'text' ? (
                            <p className="text-gray-700 whitespace-pre-wrap">{item.content_value}</p>
                          ) : (
                            
                              <a href={item.content_value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                              {item.content_type === 'video' ? 'Watch Video' :
                               item.content_type === 'pdf' ? 'View PDF' :
                               'Open Link'} →
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {completed && (
                      <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {progressPercent === 100 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-bold text-lg mb-2">🎉 Congratulations!</p>
          <p className="text-green-700">You've completed all course content!</p>
        </div>
      )}
    </div>
  )
}
