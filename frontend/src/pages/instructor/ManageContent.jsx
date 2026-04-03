import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAllTrainings, getCourseContent, createCourseContent, updateCourseContent, deleteCourseContent } from '../../api/client'

const CONTENT_TYPES = [
  { value: 'video', label: '🎥 Video (YouTube URL)' },
  { value: 'pdf', label: '📄 PDF Link' },
  { value: 'link', label: '🔗 External Link' },
  { value: 'text', label: '📝 Text Lesson' },
]

export default function ManageContent() {
  const { trainingId } = useParams()
  const navigate = useNavigate()
  const [training, setTraining] = useState(null)
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState({ title: '', content_type: 'video', content_value: '', order_index: 0 })

  useEffect(() => {
    loadData()
  }, [trainingId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trainings, contentData] = await Promise.all([
        getAllTrainings(),
        getCourseContent(trainingId)
      ])
      const currentTraining = trainings.find(t => t.id === trainingId)
      setTraining(currentTraining)
      setContent(contentData)
    } catch (e) {
      console.error(e)
      alert('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm({ title: '', content_type: 'video', content_value: '', order_index: content.length })
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setForm({
      title: item.title,
      content_type: item.content_type,
      content_value: item.content_value || '',
      order_index: item.order_index
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setForm({ title: '', content_type: 'video', content_value: '', order_index: 0 })
  }

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title required')
    
    try {
      if (editTarget) {
        await updateCourseContent(editTarget.id, form)
      } else {
        await createCourseContent({ ...form, training_id: trainingId })
      }
      closeForm()
      await loadData()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this content item?')) return
    try {
      await deleteCourseContent(id)
      await loadData()
    } catch (e) {
      alert('Failed to delete')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  if (!training) return <div className="text-center py-12">Training not found</div>

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/instructor')} className="text-blue-600 text-sm hover:underline mb-2">
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold">Manage Content: {training.title}</h1>
        <p className="text-gray-500 text-sm mt-1">Add videos, PDFs, links, and text lessons</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Course Content ({content.length} items)</h2>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add Content
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-blue-100">
          <h3 className="text-lg font-semibold mb-4">{editTarget ? 'Edit Content' : 'Add Content'}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="e.g., Introduction to the Course"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-white"
                value={form.content_type}
                onChange={e => setForm({...form, content_type: e.target.value})}
              >
                {CONTENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.content_type === 'text' ? 'Lesson Content' : 'URL'} *
              </label>
              {form.content_type === 'text' ? (
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={6}
                  placeholder="Enter the lesson text here..."
                  value={form.content_value}
                  onChange={e => setForm({...form, content_value: e.target.value})}
                />
              ) : (
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder={
                    form.content_type === 'video' ? 'https://www.youtube.com/watch?v=...' :
                    form.content_type === 'pdf' ? 'https://example.com/document.pdf' :
                    'https://example.com'
                  }
                  value={form.content_value}
                  onChange={e => setForm({...form, content_value: e.target.value})}
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700">
              {editTarget ? 'Save Changes' : 'Add Content'}
            </button>
            <button onClick={closeForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {content.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 font-medium mb-1">No content yet</p>
          <p className="text-gray-400 text-sm">Click "Add Content" to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {content.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {CONTENT_TYPES.find(t => t.value === item.content_type)?.label || item.content_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
