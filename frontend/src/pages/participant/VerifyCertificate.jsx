import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'

export default function VerifyCertificate() {
  const { verificationCode } = useParams()
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get(`/instructor/certificates/verify/${verificationCode}`)
      .then(r => setResult(r.data))
      .catch(() => setError('Certificate not found or invalid code.'))
      .finally(() => setLoading(false))
  }, [verificationCode])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Verifying certificate…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

      <div className="flex items-center gap-2 mb-8">
        <span className="text-2xl"></span>
        <span className="text-blue-700 font-bold tracking-widest text-sm uppercase">HOPE Training Academy</span>
      </div>

      {error ? (
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Certificate</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <p className="text-xs text-gray-400">
            Verification code: <span className="font-mono">{verificationCode}</span>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center border-t-4 border-blue-600">

          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="#16a34a"/>
              <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Certificate Verified
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">This certificate is authentic</h2>
          <p className="text-gray-500 text-sm mb-6">Issued by HOPE Training Academy</p>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Certificate ID</p>
              <p className="font-mono font-semibold text-blue-700">{result?.certificate_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Date Completed</p>
              <p className="font-medium text-gray-800">
                {result?.completed_at
                  ? new Date(result.completed_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Verification Code</p>
              <p className="font-mono text-xs text-gray-500">{verificationCode}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Verified on{' '}
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}

      <Link to="/" className="mt-8 text-blue-600 text-sm hover:underline">← Back to HOPE Portal</Link>
    </div>
  )
}