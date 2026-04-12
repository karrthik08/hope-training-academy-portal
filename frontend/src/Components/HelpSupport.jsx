import React, { useState } from 'react';

const HelpSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:8000/api/v1/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: 'success',
          text: '✅ Your support request has been sent successfully! Our team will contact you shortly at the email you provided.'
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
        
        // Close modal after 3 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSubmitMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.detail || 'Failed to send support request. Please try again or contact us directly at oohtraining@organizationofhope.org'
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: 'Network error. Please check your connection or contact us directly at oohtraining@organizationofhope.org'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      {/* Need Support Button - Styled to match Logout button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 rounded font-medium text-sm"
        style={{ backgroundColor: '#CC0000', color: 'white' }}
        title="Get Help & Support"
      >
        Need Support
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div style={{ backgroundColor: '#003087' }} className="text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Help & Support</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSubmitMessage({ type: '', text: '' });
                }}
                className="text-white hover:text-gray-200 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'contact'
                      ? 'border-b-2 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={activeTab === 'contact' ? { borderBottomColor: '#003087' } : {}}
                >
                  Contact Support
                </button>
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'faq'
                      ? 'border-b-2 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={activeTab === 'faq' ? { borderBottomColor: '#003087' } : {}}
                >
                  FAQs
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'guide'
                      ? 'border-b-2 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={activeTab === 'guide' ? { borderBottomColor: '#003087' } : {}}
                >
                  User Guide
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {activeTab === 'contact' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Contact Our Support Team</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                    <p className="text-sm text-blue-900">
                      <strong>Email:</strong> oohtraining@organizationofhope.org
                    </p>
                    <p className="text-sm text-blue-900">
                      <strong>Phone:</strong> 1.855.966.4467 / 443.449.6018
                    </p>
                    <p className="text-sm text-blue-900 mt-2">
                      <strong>Office Hours:</strong> Monday - Friday, 9:00 AM - 5:50 PM EST
                    </p>
                  </div>

                  {/* Success/Error Message */}
                  {submitMessage.text && (
                    <div
                      className={`p-4 rounded mb-4 ${
                        submitMessage.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}
                    >
                      {submitMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 disabled:bg-gray-100"
                        style={{ focusRingColor: '#003087' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject *
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 disabled:bg-gray-100 bg-white"
                        style={{ color: '#000', appearance: 'menulist' }}
                      >
                        <option value="">Select a subject</option>
                        <option value="Enrollment Issue">Enrollment Issue</option>
                        <option value="Technical Problem">Technical Problem</option>
                        <option value="Certificate Question">Certificate Question</option>
                        <option value="Course Content Question">Course Content Question</option>
                        <option value="Account Issue">Account Issue</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        rows="5"
                        placeholder="Please describe your issue or question..."
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 disabled:bg-gray-100 bg-white"
                        style={{ color: '#000', resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full text-white py-2 px-4 rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#003087' }}
                    >
                      {isSubmitting ? 'Sending...' : 'Submit Support Request'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>

                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">How do I enroll in a training?</h4>
                    <p className="text-gray-700">
                      Navigate to the "Trainings" page, find the training you're interested in, and click the "Enroll" button. 
                      Some trainings may require instructor approval before you can access the content.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">How do I get my certificate?</h4>
                    <p className="text-gray-700">
                      Once you complete all course requirements and your instructor marks you as complete, 
                      you can download your certificate from the "My Trainings" page by clicking the "Download Certificate" button.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Can I cancel my enrollment?</h4>
                    <p className="text-gray-700">
                      Yes, you can unenroll from a training at any time from your dashboard. 
                      However, if the training has already started, please contact the instructor or support team.
                    </p>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">How do I track my progress?</h4>
                    <p className="text-gray-700">
                      Click on any active training from your dashboard to view your progress. 
                      You'll see completed modules, lessons, and your overall completion percentage. 
                      You can also access detailed progress from the "My Progress" button on your participant dashboard.
                    </p>
                  </div>

                  <div className="pb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Who do I contact for technical issues?</h4>
                    <p className="text-gray-700">
                      For any technical issues, please use the "Contact Support" tab to submit a support request, 
                      or email us directly at oohtraining@organizationofhope.org. Include details about the issue and screenshots if possible.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'guide' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">User Guide</h3>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 text-sm">Participant</span>
                      Getting Started
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                      <li>Register for an account or log in if you already have one</li>
                      <li>Browse available trainings from the "Trainings" page</li>
                      <li>Enroll in trainings that interest you</li>
                      <li>Wait for instructor approval if required</li>
                      <li>Access your trainings from the participant dashboard</li>
                      <li>Complete modules and lessons at your own pace</li>
                      <li>Mark lessons as complete as you progress</li>
                      <li>Download your certificate upon completion</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2 text-sm">Instructor</span>
                      Managing Trainings
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                      <li>Access the instructor dashboard from your account menu</li>
                      <li>Create or manage trainings using the training management tools</li>
                      <li>Review and approve participant enrollments</li>
                      <li>Track attendance for scheduled sessions</li>
                      <li>Monitor participant progress through the progress tracker</li>
                      <li>Mark participants as complete when they meet all requirements</li>
                      <li>Generate reports and export data as needed</li>
                      <li>Communicate with participants through notifications</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-sm text-yellow-900">
                      <strong>💡 Tip:</strong> If you need additional help or training on using the portal, 
                      please contact our support team to schedule a training session.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpSupport;