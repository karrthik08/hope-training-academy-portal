import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'

function QRCode({ value, size = 100 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
  return <img src={url} alt="Verification QR Code" width={size} height={size} />
}

function detectTemplate(title = '', category = '') {
  const text = (title + ' ' + category).toLowerCase()
  if (text.includes('trauma') || text.includes('trauma-informed')) return 'trauma'
  if (text.includes('ppw') || text.includes('prevention') || text.includes('wellness') || text.includes('peer support')) return 'ppw'
  return 'general'
}

const TEMPLATES = {
  general: {
    label: 'General OOH Training',
    borderColor: '#2563eb',
    accentColor: '#ca8a04',
    titleColor: '#1d4ed8',
    nameColor: '#111827',
    watermark: 'H',
    watermarkColor: '#1d4ed8',
    cornerClass: 'border-yellow-400',
    dividerColor: '#ca8a04',
    tagBg: '#eff6ff',
    tagText: '#1d4ed8',
    tagLabel: 'General OOH Training',
  },
  trauma: {
    label: 'Trauma-Informed Training',
    borderColor: '#7c3aed',
    accentColor: '#9ca3af',
    titleColor: '#6d28d9',
    nameColor: '#1f2937',
    watermark: 'T',
    watermarkColor: '#7c3aed',
    cornerClass: 'border-purple-400',
    dividerColor: '#a78bfa',
    tagBg: '#f5f3ff',
    tagText: '#6d28d9',
    tagLabel: 'Trauma-Informed Training',
  },
  ppw: {
    label: 'PPW Training',
    borderColor: '#16a34a',
    accentColor: '#ca8a04',
    titleColor: '#15803d',
    nameColor: '#111827',
    watermark: 'P',
    watermarkColor: '#16a34a',
    cornerClass: 'border-green-400',
    dividerColor: '#86efac',
    tagBg: '#f0fdf4',
    tagText: '#15803d',
    tagLabel: 'Prevention & Wellness',
  },
}

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

  const templateKey = detectTemplate(cert.training_title, cert.category || '')
  const tmpl = TEMPLATES[templateKey]
  const verifyUrl = `${window.location.origin}/verify/${cert.verification_code}`

  const handleDownload = () => {
    // Clear any text selection first
    window.getSelection()?.removeAllRanges()
    document.activeElement?.blur()

    const name  = (cert.participant_name || 'Participant').replace(/\s+/g, '-')
    const title = (cert.training_title   || 'Training').replace(/\s+/g, '-')

    // Build certificate HTML from scratch — no innerHTML copy
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HOPE-Certificate-${name}-${title}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          * { user-select: none !important; -webkit-user-select: none !important; box-sizing: border-box; }
          body { margin: 0; padding: 20px; background: white; font-family: sans-serif; }
          @page { margin: 0.5cm; }
          @media print { body { padding: 0; } }
          .cert { border-top: 6px solid ${tmpl.borderColor}; border-bottom: 6px solid ${tmpl.borderColor}; background: white; max-width: 700px; margin: 0 auto; position: relative; overflow: hidden; padding: 48px 64px; text-align: center; }
          .corner-tl { position:absolute; top:20px; left:20px; width:48px; height:48px; border-top:4px solid ${tmpl.dividerColor}; border-left:4px solid ${tmpl.dividerColor}; }
          .corner-tr { position:absolute; top:20px; right:20px; width:48px; height:48px; border-top:4px solid ${tmpl.dividerColor}; border-right:4px solid ${tmpl.dividerColor}; }
          .corner-bl { position:absolute; bottom:20px; left:20px; width:48px; height:48px; border-bottom:4px solid ${tmpl.dividerColor}; border-left:4px solid ${tmpl.dividerColor}; }
          .corner-br { position:absolute; bottom:20px; right:20px; width:48px; height:48px; border-bottom:4px solid ${tmpl.dividerColor}; border-right:4px solid ${tmpl.dividerColor}; }
          .watermark { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; opacity:0.03; font-size:280px; font-weight:900; color:${tmpl.watermarkColor}; line-height:1; }
          .header { font-weight:700; letter-spacing:0.2em; font-size:11px; text-transform:uppercase; color:${tmpl.titleColor}; margin-bottom:4px; }
          .subheader { font-size:10px; letter-spacing:0.25em; text-transform:uppercase; color:#9ca3af; margin-bottom:4px; }
          .tag { display:inline-block; font-size:10px; font-weight:600; padding:2px 12px; border-radius:999px; background:${tmpl.tagBg}; color:${tmpl.tagText}; margin-bottom:24px; }
          .divider { display:flex; align-items:center; gap:12px; width:192px; margin:0 auto 24px; }
          .divider-line { flex:1; height:1px; background:${tmpl.dividerColor}; }
          .divider-dot { width:8px; height:8px; background:${tmpl.dividerColor}; transform:rotate(45deg); }
          .certifies { font-size:13px; color:#6b7280; margin-bottom:8px; }
          .name { font-family:Georgia,serif; font-size:32px; font-weight:700; color:${tmpl.nameColor}; margin-bottom:8px; }
          .completed { font-size:13px; color:#6b7280; margin-bottom:8px; }
          .training { font-family:Georgia,serif; font-size:20px; font-weight:600; color:${tmpl.titleColor}; margin-bottom:24px; }
          .divider2-line { flex:1; height:1px; background:#e5e7eb; }
          .divider2-dot { width:6px; height:6px; background:#d1d5db; transform:rotate(45deg); }
          .meta { display:flex; gap:40px; justify-content:center; margin-bottom:24px; }
          .meta-label { font-size:9px; text-transform:uppercase; letter-spacing:0.2em; color:#9ca3af; margin-bottom:4px; }
          .meta-value { font-size:13px; font-weight:600; color:#1f2937; }
          .cert-id { font-family:monospace; color:${tmpl.titleColor}; }
          .qr-section { display:flex; flex-direction:column; align-items:center; gap:8px; margin-top:8px; }
          .qr-label { font-size:10px; color:#9ca3af; }
          .verify-url { font-size:10px; font-family:monospace; color:${tmpl.titleColor}; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="cert">
          <div class="corner-tl"></div>
          <div class="corner-tr"></div>
          <div class="corner-bl"></div>
          <div class="corner-br"></div>
          <div class="watermark">${tmpl.watermark}</div>

          <div class="header">HOPE Training Academy</div>
          <div class="subheader">Certificate of Completion</div>
          <div class="tag">${tmpl.tagLabel}</div>

          <div class="divider">
            <div class="divider-line"></div>
            <div class="divider-dot"></div>
            <div class="divider-line"></div>
          </div>

          <div class="certifies">This certifies that</div>
          <div class="name">${cert.participant_name || 'Participant'}</div>
          <div class="completed">has successfully completed</div>
          <div class="training">${cert.training_title || 'HOPE Training Program'}</div>

          <div class="divider">
            <div class="divider2-line"></div>
            <div class="divider2-dot"></div>
            <div class="divider2-line"></div>
          </div>

          <div class="meta">
            <div>
              <div class="meta-label">Date Completed</div>
              <div class="meta-value">${completedDate}</div>
            </div>
            <div>
              <div class="meta-label">Certificate ID</div>
              <div class="meta-value cert-id">${cert.certificate_id}</div>
            </div>
          </div>

          <div class="qr-section">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}" width="100" height="100" alt="QR Code" />
            <div class="qr-label">Scan to verify this certificate</div>
            <div class="verify-url">${verifyUrl.length > 60 ? verifyUrl.slice(0,60) + '…' : verifyUrl}</div>
          </div>
        </div>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">

      {/* Actions */}
      <div className="flex gap-3 mb-6 print:hidden items-center flex-wrap justify-center">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="text-white text-sm px-5 py-2 rounded font-medium shadow"
          style={{ backgroundColor: tmpl.borderColor }}
        >
         Print / Save PDF
        </button>
        <button
          onClick={handleDownload}
          className="text-white text-sm px-5 py-2 rounded font-medium shadow"
          style={{ backgroundColor: '#16a34a' }}
        >
         Download PDF
        </button>
      </div>

      {/* Template badge */}
      <div
        className="print:hidden mb-4 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: tmpl.tagBg, color: tmpl.tagText }}
      >
        Template: {tmpl.tagLabel}
      </div>

      {/* Certificate card */}
      <div
        id="certificate-card"
        className="bg-white w-full max-w-2xl shadow-2xl relative overflow-hidden"
        style={{ borderTop: `6px solid ${tmpl.borderColor}`, borderBottom: `6px solid ${tmpl.borderColor}` }}
      >
        <div className={`absolute top-5 left-5 w-12 h-12 border-t-4 border-l-4 ${tmpl.cornerClass}`} />
        <div className={`absolute top-5 right-5 w-12 h-12 border-t-4 border-r-4 ${tmpl.cornerClass}`} />
        <div className={`absolute bottom-5 left-5 w-12 h-12 border-b-4 border-l-4 ${tmpl.cornerClass}`} />
        <div className={`absolute bottom-5 right-5 w-12 h-12 border-b-4 border-r-4 ${tmpl.cornerClass}`} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
          <span style={{ fontSize: 280, fontWeight: 900, color: tmpl.watermarkColor, lineHeight: 1 }}>
            {tmpl.watermark}
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-16 py-12">
          <span className="font-bold tracking-widest text-xs uppercase mb-1" style={{ color: tmpl.titleColor }}>
            HOPE Training Academy
          </span>
          <p className="text-gray-400 text-xs tracking-[0.25em] uppercase mb-1">Certificate of Completion</p>
          <p className="text-xs font-medium mb-6 px-3 py-0.5 rounded-full"
            style={{ backgroundColor: tmpl.tagBg, color: tmpl.tagText }}>
            {tmpl.tagLabel}
          </p>

          <div className="flex items-center gap-3 w-48 mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: tmpl.dividerColor }} />
            <div className="w-2 h-2 rotate-45" style={{ backgroundColor: tmpl.dividerColor }} />
            <div className="flex-1 h-px" style={{ backgroundColor: tmpl.dividerColor }} />
          </div>

          <p className="text-gray-500 text-sm mb-2">This certifies that</p>
          <h1 className="mb-2" style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 700, color: tmpl.nameColor }}>
            {cert.participant_name || 'Participant'}
          </h1>
          <p className="text-gray-500 text-sm mb-2">has successfully completed</p>
          <h2 className="mb-6" style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 600, color: tmpl.titleColor }}>
            {cert.training_title || 'HOPE Training Program'}
          </h2>

          <div className="flex items-center gap-3 w-48 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="w-1.5 h-1.5 bg-gray-300 rotate-45" />
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex gap-10 mb-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Date Completed</p>
              <p className="text-gray-800 text-sm font-semibold">{completedDate}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Certificate ID</p>
              <p className="text-sm font-mono font-semibold" style={{ color: tmpl.titleColor }}>{cert.certificate_id}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 mt-2">
            <QRCode value={verifyUrl} size={100} />
            <p className="text-gray-400 text-xs mt-1">Scan to verify this certificate</p>
            <a href={verifyUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs font-mono hover:underline" style={{ color: tmpl.titleColor }}>
              {verifyUrl.length > 60 ? verifyUrl.slice(0, 60) + '…' : verifyUrl}
            </a>
          </div>
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