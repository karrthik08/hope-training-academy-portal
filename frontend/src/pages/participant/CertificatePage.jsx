import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'

function QRCode({ value, size = 128 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
  return <img src={url} alt="Verification QR Code" width={size} height={size} />
}

export default function CertificatePage() {
  const { enrollmentId } = useParams()
  const [cert, setCert] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/enrollments/${enrollmentId}/certificate`)
      .then(r => {
        setCert(r.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Certificate fetch error:', err)
        setError('Certificate not found or training not completed yet.')
        setLoading(false)
      })
  }, [enrollmentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading certificate...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  if (!cert) return null

  const templateMap = {
    'OOH': '/certificates/ooh-certificate.png',
    'PPW': '/certificates/ppw-certificate.png',
    'CORPORATE': '/certificates/corporate-certificate.png'
  }
  
  const certificateTemplate = templateMap[cert.certificate_template] || templateMap['CORPORATE']
  
  const completedDate = cert.completed_at 
    ? new Date(cert.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A'

  const verifyUrl = `${window.location.origin}/verify/${cert.verification_code}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
      {/* Action buttons */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <Link 
          to="/dashboard" 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Print / Save PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Certificate with Text Overlay */}
      <div className="max-w-5xl mx-auto bg-white shadow-xl print:shadow-none">
        <div className="relative">
          {/* Background Certificate Template */}
          <img 
            src={certificateTemplate} 
            alt="Certificate Template"
            className="w-full h-auto"
            style={{ display: 'block' }}
          />
          
          {/* Text Overlay - Positioned to match template blanks */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Container for centering */}
            <div className="relative w-full h-full flex flex-col items-center">
              
              {/* Participant Name - positioned in the middle area */}
              <div 
                className="absolute text-center"
                style={{
                  top: '48%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '70%'
                }}
              >
                <div 
                  className="font-serif font-bold"
                  style={{
                    fontSize: 'clamp(24px, 4vw, 48px)',
                    color: '#1a365d',
                    letterSpacing: '0.05em'
                  }}
                >
                  {cert.participant_name}
                </div>
              </div>

              {/* Training Title - positioned below name */}
              <div 
                className="absolute text-center"
                style={{
                  top: '58%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%'
                }}
              >
                <div 
                  className="font-serif font-semibold"
                  style={{
                    fontSize: 'clamp(18px, 2.5vw, 32px)',
                    color: '#2563eb',
                    lineHeight: '1.3'
                  }}
                >
                  {cert.training_title}
                </div>
              </div>

              {/* Date and Certificate ID - bottom area */}
              <div 
                className="absolute text-center"
                style={{
                  bottom: '18%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%'
                }}
              >
                <div className="flex justify-center gap-12">
                  <div>
                    <div style={{ fontSize: 'clamp(12px, 1.5vw, 18px)', color: '#1a365d', fontWeight: '600' }}>
                      {completedDate}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'clamp(12px, 1.5vw, 18px)', color: '#2563eb', fontWeight: '600', fontFamily: 'monospace' }}>
                      {cert.certificate_id}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Certificate Details Below - Print Hidden */}
        <div className="p-6 bg-blue-50 print:hidden">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Participant:</span>
              <span className="ml-2 font-semibold">{cert.participant_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Training:</span>
              <span className="ml-2 font-semibold">{cert.training_title}</span>
            </div>
            <div>
              <span className="text-gray-600">Completed:</span>
              <span className="ml-2 font-semibold">{completedDate}</span>
            </div>
            <div>
              <span className="text-gray-600">Certificate ID:</span>
              <span className="ml-2 font-mono text-blue-600">{cert.certificate_id}</span>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <span className="ml-2 font-semibold">{cert.duration_hours || 'N/A'} hours</span>
            </div>
            <div>
              <span className="text-gray-600">Template:</span>
              <span className="ml-2 font-semibold">{cert.certificate_template}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-600">Verification Code:</div>
              <div className="text-sm font-mono text-gray-700">{cert.verification_code}</div>
              <a 
                href={verifyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Verify Certificate →
              </a>
            </div>
            <div className="text-center">
              <QRCode value={verifyUrl} size={80} />
              <div className="text-xs text-gray-500 mt-1">Scan to verify</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
