import React, { useEffect, useState } from 'react'
import { getAllTrainings, createTraining, updateTraining, submitTraining, getRoster, markAttendance, markCompletion } from '../../api/client'
import { COURSE_TEMPLATES } from '../../data/courseTemplates'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  'Prevention & Youth Education',
  'Peer Recovery & Coaching',
  'Family & Community Support',
  'Professional Development',
  'Clinical & Medical',
  'Curriculum Development & Implementation',
  'Youth Prevention Training',
  'Business Incubator',
  'Peer Support Certification Training',
  'Accreditation & Corporate Support',
  'Workforce Readiness',
  'Leadership Development',
  'Life & Resilience Skills Training',
]

const EMPTY_FORM = { 
  title: '', 
  description: '', 
  category: '', 
  video_url: '', 
  dropbox_url: '',
  flyer_url: '',
  instructor_manual_url: '',
  knowledge_mgmt_folder_url: '',
  student_handbook_url: '',
  student_workbook_url: '',
  slides_url: '',
  qrc_surveys_url: '',
  target_audience: '',
  instructor_name: '',
  delivery_type: 'self-paced',
  duration_hours: '',
  start_date: '',
  end_date: '',
  prerequisites: '',
  learning_objectives: '',
  agenda: '',
  disclaimer: '',
  accessibility_notes: '',
  language_options: 'English',
  ceu_alignment: '',
  status: 'draft'
}

export default function InstructorDashboard() {
  const [trainings, setTrainings]         = useState([])
  const [selected, setSelected]           = useState(null)
  const [roster, setRoster]               = useState([])
  const [tab, setTab]                     = useState('trainings')
  const [showForm, setShowForm]           = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editTarget, setEditTarget]       = useState(null)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [loading, setLoading]             = useState(true)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [searchEmail, setSearchEmail] = useState("")
  const [saving, setSaving]               = useState(false)
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const navigate = useNavigate()

  useEffect(() => { loadTrainings() }, [])

  const loadTrainings = async () => {
    setLoading(true)
    try { const r = await getAllTrainings(); setTrainings(r) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditTarget(t)
    setForm({
      title:            t.title || '',
      description:      t.description || '',
      category:         t.category || '',
      video_url:        t.video_url || '',
      dropbox_url:      t.dropbox_url || '',
      flyer_url:        t.flyer_url || '',
      instructor_manual_url: t.instructor_manual_url || '',
      knowledge_mgmt_folder_url: t.knowledge_mgmt_folder_url || '',
      student_handbook_url: t.student_handbook_url || '',
      student_workbook_url: t.student_workbook_url || '',
      slides_url: t.slides_url || '',
      qrc_surveys_url: t.qrc_surveys_url || '',
      target_audience:  t.target_audience || '',
      instructor_name:  t.instructor_name || '',
      delivery_type:    t.delivery_type || 'self-paced',
      duration_hours:   t.duration_hours || '',
      start_date:       t.start_date ? t.start_date.slice(0,16) : '',
      end_date:         t.end_date ? t.end_date.slice(0,16) : '',
      prerequisites:    t.prerequisites || '',
      learning_objectives: t.learning_objectives || '',
      agenda:           t.agenda || '',
      disclaimer:       t.disclaimer || '',
      accessibility_notes: t.accessibility_notes || '',
      language_options: t.language_options || 'English',
      ceu_alignment:    t.ceu_alignment || '',
      status:           t.status || 'draft',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      
      if (editTarget) {
        await updateTraining(editTarget.id, payload)
      } else {
        await createTraining(payload)
      }
      closeForm()
      await loadTrainings()
    } catch(e) {
      alert(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForReview = async (trainingId) => {
    if (!confirm('Submit this course for admin review?')) return
    try {
      await submitTraining(trainingId)
      await loadTrainings()
      alert('Course submitted for review!')
    } catch(e) {
      alert(e.response?.data?.detail || 'Failed to submit')
    }
  }

  const openRoster = async (t) => {
    setSelected(t); setTab('roster'); setRosterLoading(true)
    try { const r = await getRoster(t.id); setRoster(r) }
    catch(e) { console.error(e) }
    finally { setRosterLoading(false) }
  }

  const handleAttendance = async (id, status) => {
    try { await markAttendance(id, status); alert(`Marked ${status}`) }
    catch(e) { alert(e.response?.data?.detail || 'Failed') }
  }

  const handleComplete = async (id) => {
    if (!confirm('Mark complete and generate certificate?')) return
    try {
      await markCompletion(id)
      const r = await getRoster(selected.id)
      setRoster(r)
    } catch(e) { alert(e.response?.data?.detail || 'Failed or already completed') }
  }

  const handleMarkComplete = async (enrollmentId) => {
    if (!confirm('Mark this participant as complete? This will mark the training as finished.')) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/completion/mark-complete/${enrollmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hope_access_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to mark complete');
      
      alert('Participant marked as complete!');
      const r = await getRoster(selected.id);
      setRoster(r);
    } catch (error) {
      console.error('Error marking complete:', error);
      alert('Failed to mark participant as complete');
    }
  };

  const handleRemoveParticipant = async (enrollmentId) => {
    if (!confirm('Remove this participant from the training?')) return
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enrollments/remove/${enrollmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      })
      const r = await getRoster(selected.id)
      setRoster(r)
      alert('Participant removed successfully!')
    } catch (error) {
      console.error('Error removing participant:', error)
      alert('Failed to remove participant')
    }
  }

  const handleAddParticipant = async () => {
    if (!searchEmail.trim()) {
      alert('Please enter an email address')
      return
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enrollments/enroll-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hope_access_token')}`
        },
        body: JSON.stringify({
          training_id: selected.id,
          email: searchEmail.trim()
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to add participant')
      }
      
      const r = await getRoster(selected.id)
      setRoster(r)
      setShowAddParticipant(false)
      setSearchEmail('')
      alert('Participant added successfully!')
    } catch (error) {
      console.error('Error adding participant:', error)
      alert(error.message || 'Failed to add participant')
    }
  }

  // Filter trainings based on search and category
  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || training.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const badge = (s) => ({
    draft:     'bg-yellow-100 text-yellow-700',
    submitted: 'bg-purple-100 text-purple-700',
    approved:  'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
  }[s] || 'bg-gray-100 text-gray-600')

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage trainings, attendance, completions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
            + New Training
          </button>
          <button onClick={() => setShowTemplates(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700">
            📋 Start from Template
          </button>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Choose a Template</h2>
                <button onClick={() => setShowTemplates(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Start with a pre-configured course template</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {COURSE_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => {
                    setForm({...EMPTY_FORM, ...template.data, status: 'draft'});
                    setShowTemplates(false);
                    setShowForm(true);
                  }}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition"
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-500">💡 Tip: You can customize all fields after selecting a template</p>
              <button onClick={() => setShowTemplates(false)} className="text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-blue-100">
          <h2 className="text-lg font-semibold mb-4">
            {editTarget ? `Edit: ${editTarget.title}` : 'New Training'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Training title"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what participants will learn..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., New employees, Managers"
                value={form.target_audience}
                onChange={e => setForm({...form, target_audience: e.target.value})}
              />
            </div>

            {/* Instructor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Lead instructor or facilitator"
                value={form.instructor_name}
                onChange={e => setForm({...form, instructor_name: e.target.value})}
              />
            </div>

            {/* Delivery Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.delivery_type}
                onChange={e => setForm({...form, delivery_type: e.target.value})}
              >
                <option value="self-paced">Self-Paced</option>
                <option value="live">Live/Scheduled</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
              <input
                type="number"
                min="1"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 4"
                value={form.duration_hours}
                onChange={e => setForm({...form, duration_hours: e.target.value})}
              />
            </div>

            {/* Conditional: Start/End Dates for Live Courses */}
            {form.delivery_type === 'live' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.start_date}
                    onChange={e => setForm({...form, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.end_date}
                    onChange={e => setForm({...form, end_date: e.target.value})}
                  />
                </div>
              </>
            )}

            {/* YouTube Video URL */}
            <div className={form.delivery_type === 'live' ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.video_url}
                onChange={e => setForm({...form, video_url: e.target.value})}
              />
            </div>

            {/*Dropbox URL */}
            <div className={form.delivery_type === 'live' ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropbox Video/Document URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.dropbox.com/..."
                value={form.dropbox_url}
                onChange={e => setForm({...form, dropbox_url: e.target.value})}
              />
            </div>

            {/* Flyer URL */}
            <div className={form.delivery_type === 'live' ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flyer URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                value={form.flyer_url}
                onChange={e => setForm({...form, flyer_url: e.target.value})}
              />
  {/* Flyer URL */}
            <div className={form.delivery_type === 'live' ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flyer URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                value={form.flyer_url}
                onChange={e => setForm({...form, flyer_url: e.target.value})}
              />
            </div>

            {/* ========== NEW TRAINING MATERIALS SECTION ========== */}
            
            {/* INSTRUCTOR MATERIALS */}
            <div className="md:col-span-2 border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-800 mb-3">📚 Instructor Materials (Instructor Access Only)</h4>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor Manual URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.dropbox.com/..."
                value={form.instructor_manual_url || ''}
                onChange={e => setForm({...form, instructor_manual_url: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Knowledge Management Folder URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.dropbox.com/..."
                value={form.knowledge_mgmt_folder_url || ''}
                onChange={e => setForm({...form, knowledge_mgmt_folder_url: e.target.value})}
              />
            </div>

            {/* STUDENT MATERIALS */}
            <div className="md:col-span-2 border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-800 mb-3">📖 Student Materials</h4>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Handbook URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.dropbox.com/..."
                value={form.student_handbook_url || ''}
                onChange={e => setForm({...form, student_handbook_url: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Workbook URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.dropbox.com/..."
                value={form.student_workbook_url || ''}
                onChange={e => setForm({...form, student_workbook_url: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presentation Slides URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.dropbox.com/..."
                value={form.slides_url || ''}
                onChange={e => setForm({...form, slides_url: e.target.value})}
              />
            </div>

            {/* QRC SURVEYS */}
            <div className="md:col-span-2 border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-800 mb-3">📊 QRC Surveys</h4>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QRC Surveys URL
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://me-qr.com/... or https://www.dropbox.com/..."
                value={form.qrc_surveys_url || ''}
                onChange={e => setForm({...form, qrc_surveys_url: e.target.value})}
              />
            </div>

            {/* ========== END NEW MATERIALS SECTION ========== */}

            {/* Prerequisites */}

            </div>

            {/* Prerequisites */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Any requirements participants should meet before enrolling..."
                value={form.prerequisites}
                onChange={e => setForm({...form, prerequisites: e.target.value})}
              />
            </div>

            {/* Learning Objectives */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Learning Objectives</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What will participants be able to do after completing this training?"
                value={form.learning_objectives}
                onChange={e => setForm({...form, learning_objectives: e.target.value})}
              />
            </div>

            {/* Agenda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Training outline, schedule, or module breakdown..."
                value={form.agenda}
                onChange={e => setForm({...form, agenda: e.target.value})}
              />
            </div>

            {/* Disclaimer */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Disclaimer or Policy Statement</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Any disclaimers, policies, or important notices..."
                value={form.disclaimer}
                onChange={e => setForm({...form, disclaimer: e.target.value})}
              />
            </div>

            {/* Accessibility Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accessibility Notes</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Accommodations, accessibility features..."
                value={form.accessibility_notes}
                onChange={e => setForm({...form, accessibility_notes: e.target.value})}
              />
            </div>

            {/* Language Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language Options</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., English, Spanish"
                value={form.language_options}
                onChange={e => setForm({...form, language_options: e.target.value})}
              />
            </div>

            {/* CEU Alignment */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">CEU or Certification Alignment</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2.0 CEUs, Certified Peer Specialist alignment"
                value={form.ceu_alignment}
                onChange={e => setForm({...form, ceu_alignment: e.target.value})}
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This course will be saved as a <strong>draft</strong>. 
              You can submit it for admin approval later.
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Save as Draft'}
            </button>
            <button onClick={closeForm}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('trainings')}
          className={`px-4 py-2 rounded text-sm font-medium ${tab==='trainings' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
          All Trainings
        </button>
        {selected && (
          <button onClick={() => setTab('roster')}
            className={`px-4 py-2 rounded text-sm font-medium ${tab==='roster' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
            Roster: {selected.title}
          </button>
        )}
      </div>

      {tab === 'trainings' && (
        <>
          {/* Search and Filter Section */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search trainings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Results Count */}
            {(searchTerm || selectedCategory) && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredTrainings.length} of {trainings.length} trainings
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredTrainings.length === 0 ? (
              <p className="text-center py-12 text-gray-400">
                {searchTerm || selectedCategory ? 'No trainings match your filters.' : 'No trainings yet. Create one above.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTrainings.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t.title}</div>
                        <div className="flex gap-2 mt-0.5">
                          {t.target_audience && (
                            <span className="text-xs text-gray-500">👥 {t.target_audience}</span>
                          )}
                          {t.duration_hours && (
                            <span className="text-xs text-gray-500">⏱ {t.duration_hours}h</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.delivery_type === 'live' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {t.delivery_type === 'live' ? '🔴 Live' : '📚 Self-Paced'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/instructor/manage-content/${t.id}`)}
                            className="text-green-600 text-xs hover:underline font-medium"
                          >
                            📚 Content
                          </button>
                          <button
                            onClick={() => navigate(`/instructor/course-builder/${t.id}`)}
                            className="text-purple-600 text-xs hover:underline font-medium"
                          >
                            🏗️ Build
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="text-gray-500 text-xs hover:text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          {t.status === 'published' && (
                            <>
                              <button onClick={() => openRoster(t)}
                                className="text-blue-600 text-xs hover:underline font-medium mr-3">
                                View Roster →
                              </button>
                              <button 
                                onClick={() => navigate(`/instructor/view-course/${t.id}`)}
                                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 font-medium mr-3">
                                👁️ View Course
                              </button>
                              <button 
                                onClick={() => navigate(`/instructor/bulk-enroll/${t.id}`)}
                                className="text-green-600 text-xs hover:underline font-medium mr-3">
                                + Bulk Enroll
                              </button>
                              <button 
                                onClick={() => navigate(`/instructor/attendance/${t.id}`)}
                                className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 font-medium mr-3">
                                📋 Attendance
                              </button>
                              <button 
                                onClick={() => navigate(`/instructor/progress/${t.id}`)}
                                className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded hover:bg-purple-700 font-medium mr-3">
                                📊 Progress
                              </button>
                              <button 
                                onClick={() => navigate(`/instructor/reports/${t.id}`)}
                                className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 font-medium">
                                📋 Reports
                              </button>
                            </>
                          )}
                          {t.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitForReview(t.id)}
                              className="bg-purple-600 text-white text-xs px-3 py-1 rounded hover:bg-purple-700"
                            >
                              Submit for Review
                            </button>
                          )}
                          {t.status === 'submitted' && (
                            <span className="text-xs text-purple-600">⏳ Pending Review</span>
                          )}
                          {t.status === 'approved' && (
                            <span className="text-xs text-blue-600">✓ Approved</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'roster' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Training Roster</h2>
            <button onClick={() => setShowAddParticipant(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              + Add Participant
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
          {rosterLoading ? (
            <p className="text-center py-8 text-gray-400">Loading roster...</p>
          ) : roster.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium mb-1">No participants enrolled yet.</p>
              <p className="text-gray-400 text-sm">Share the training with your audience to get enrollments.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Participant</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Enrolled</th>
                  <th className="px-4 py-3 text-left">Attendance</th>
                  <th className="px-4 py-3 text-left">Completion</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {e.participant_name || e.user_id.slice(0,8)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.enrollment_status==='completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {e.enrollment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(e.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {e.enrollment_status !== 'completed' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleAttendance(e.id, 'present')}
                            className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded hover:bg-green-200">
                            Present
                          </button>
                          <button onClick={() => handleAttendance(e.id, 'absent')}
                            className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded hover:bg-red-200">
                            Absent
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.enrollment_status === 'enrolled' && (
                        <button onClick={() => handleMarkComplete(e.id)}
                          className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700">
                          ✓ Mark Complete
                        </button>
                      )}
                      {e.enrollment_status === 'completed' && (
                        <span className="text-green-600 text-xs font-medium">✓ Completed</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRemoveParticipant(e.id)}
                        className="text-red-600 text-xs hover:underline font-medium">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Participant to {selected?.title}</h3>
            
            <input
              type="email"
              placeholder="Search by email..."
              className="w-full border rounded px-3 py-2 mb-4"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleAddParticipant}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Add Participant
              </button>
              <button
                onClick={() => { setShowAddParticipant(false); setSearchEmail(''); }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}