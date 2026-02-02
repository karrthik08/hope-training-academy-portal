import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'

export default function CertificatePage() {
  const { enrollmentId } = useParams()
  const [cert, setCert]   = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/instructor/completions-by-enrollment/${enrollmentId}`)
      .then(r => setCert(r.data))
      .catch(() => setError('Certificate not found.'))
  }, [enrollmentId])

  if (error) return (
    <div className="text-center py-16">
      <p className="text-red-500 mb-4">{error}</p>
      <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
    </div>
  )
  if (!cert) return <div className="text-center py-12 text-gray-400">Loading...</div>

  const completedDate = new Date(cert.completed_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">

      {/* Actions — hidden on print */}
      <div className="flex gap-4 mb-6 print:hidden items-center">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white text-sm px-5 py-2 rounded hover:bg-blue-700 font-medium shadow"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Certificate card */}
      <div
        className="bg-white w-full max-w-2xl shadow-2xl relative overflow-hidden"
        style={{ borderTop: '6px solid #2563eb', borderBottom: '6px solid #2563eb' }}
      >
        {/* Gold corner ornaments */}
        <div className="absolute top-5 left-5 w-12 h-12 border-t-4 border-l-4 border-yellow-400" />
        <div className="absolute top-5 right-5 w-12 h-12 border-t-4 border-r-4 border-yellow-400" />
        <div className="absolute bottom-5 left-5 w-12 h-12 border-b-4 border-l-4 border-yellow-400" />
        <div className="absolute bottom-5 right-5 w-12 h-12 border-b-4 border-r-4 border-yellow-400" />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
          <span style={{ fontSize: 280, fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>H</span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-16 py-12">

          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎓</span>
            <span className="text-blue-700 font-bold tracking-widest text-xs uppercase">
              HOPE Training Academy
            </span>
          </div>
          <p className="text-gray-400 text-xs tracking-[0.25em] uppercase mb-6">
            Certificate of Completion
          </p>

          {/* Top divider */}
          <div className="flex items-center gap-3 w-48 mb-6">
            <div className="flex-1 h-px bg-yellow-400" />
            <div className="w-2 h-2 bg-yellow-400 rotate-45" />
            <div className="flex-1 h-px bg-yellow-400" />
          </div>

          <p className="text-gray-500 text-sm mb-2">This certifies that</p>

          {/* Participant name */}
          <h1
            className="text-gray-900 mb-2"
            style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 700 }}
          >
            {cert.participant_name || 'Participant'}
          </h1>

          <p className="text-gray-500 text-sm mb-2">has successfully completed</p>

          {/* Training title */}
          <h2
            className="text-blue-700 mb-6"
            style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 600 }}
          >
            {cert.training_title || 'HOPE Training Program'}
          </h2>

          {/* Bottom divider */}
          <div className="flex items-center gap-3 w-48 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="w-1.5 h-1.5 bg-gray-300 rotate-45" />
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Meta row */}
          <div className="flex gap-10 mb-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Date Completed</p>
              <p className="text-gray-800 text-sm font-semibold">{completedDate}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Certificate ID</p>
              <p className="text-gray-800 text-sm font-mono font-semibold">{cert.certificate_id}</p>
            </div>
          </div>

          {/* Verification */}
          <p className="text-gray-400 text-xs">
            Verification code:{' '}
            <span className="font-mono text-blue-500">{cert.verification_code?.slice(0, 14)}…</span>
          </p>

        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}