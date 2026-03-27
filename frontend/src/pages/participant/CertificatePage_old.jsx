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
    // Fetch certificate data from the certificates endpoint
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

  // Determine which certificate template to use
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

  const handleDownload = () => {
    // Create a temporary link to download the current page as PDF
    // Note: This actually triggers print dialog where user can "Save as PDF"
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
      {/* Action buttons - hide when printing */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden px-4">
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
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Certificate Display */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none">
        <div className="relative">
          {/* Background certificate template */}
          <img 
            src={certificateTemplate} 
            alt="Certificate Template"
            className="w-full h-auto"
          />
          
          {/* Overlay text on the certificate */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-16">
            {/* Participant Name */}
            <div 
              className="font-serif text-4xl font-bold mb-8"
              style={{ 
                marginTop: '45%',
                color: '#003087',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {cert.participant_name}
            </div>
            
            {/* Training Title */}
            <div 
              className="font-serif text-2xl font-semibold mb-12"
              style={{ 
                color: '#003087',
                maxWidth: '80%'
              }}
            >
              {cert.training_title}
            </div>
            
            {/* Date and Certificate Info */}
            <div className="grid grid-cols-2 gap-8 text-sm" style={{ marginTop: '8%' }}>
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Date Completed</div>
                <div className="font-semibold text-gray-700">{completedDate}</div>
              </div>
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Certificate ID</div>
                <div className="font-mono text-blue-600 font-semibold">{cert.certificate_id}</div>
              </div>
            </div>
            
            {/* QR Code for verification */}
            <div className="mt-12">
              <QRCode value={verifyUrl} size={100} />
              <div className="text-xs text-gray-500 mt-2">
                Scan to verify this certificate
              </div>
              <div className="text-xs text-blue-600 mt-1 font-mono">
                {verifyUrl}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Details - hide when printing */}
      <div className="max-w-4xl mx-auto mt-8 bg-white p-6 rounded-lg shadow print:hidden">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Certificate Details</h3>
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
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 font-semibold">{cert.duration_hours || 'N/A'} hours</span>
          </div>
          <div>
            <span className="text-gray-600">Certificate ID:</span>
            <span className="ml-2 font-mono text-blue-600">{cert.certificate_id}</span>
          </div>
          <div>
            <span className="text-gray-600">Verification Code:</span>
            <span className="ml-2 font-mono text-blue-600">{cert.verification_code}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Template:</span>
            <span className="ml-2 font-semibold">{cert.certificate_template}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
