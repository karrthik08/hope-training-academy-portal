import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyPayment, enrollAfterPayment } from '../../api/client'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const trainingId = searchParams.get('training_id')

    if (!sessionId || !trainingId) {
      setStatus('error')
      setMessage('Missing payment information')
      return
    }

    verifyAndEnroll(sessionId, trainingId)
  }, [])

  const verifyAndEnroll = async (sessionId, trainingId) => {
    try {
      // Step 1: Verify payment with Stripe
      setMessage('Verifying your payment...')
      const paymentData = await verifyPayment(sessionId)
      
      if (paymentData.payment_status !== 'paid') {
        setStatus('error')
        setMessage('Payment was not completed. Please try again.')
        return
      }

      // Step 2: Enroll student in the course
      setMessage('Enrolling you in the course...')
      await enrollAfterPayment(trainingId)

      // Step 3: Show success
      setStatus('success')
      setMessage('Payment successful! You are now enrolled in the course.')

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)

    } catch (error) {
      console.error('Payment verification error:', error)
      setStatus('error')
      setMessage(error.response?.data?.detail || 'Failed to complete enrollment. Please contact support.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {status === 'verifying' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}