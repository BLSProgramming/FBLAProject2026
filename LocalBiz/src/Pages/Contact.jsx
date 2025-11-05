import React, { useRef, useState, useEffect } from "react";
import emailjs from '@emailjs/browser';
import HoneycombBackground from '../Components/HoneycombBackground';
import PublicNavbar from '../Components/PublicNavbar';
import { logger } from '../utils/helpers.js';
 
export default function Contact() {
  const form = useRef();
 
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [wordCount, setWordCount] = useState(0)
 
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])
 
  const showToast = (type, message) => {
    setToast({ type, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }


  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }


  const countWords = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  }


  const handleMessageChange = (e) => {
    const message = e.target.value
    const words = countWords(message)
    setWordCount(words)
    
    if (words > 1000) {
      setValidationErrors(prev => ({
        ...prev,
        message: 'Message cannot exceed 1000 words'
      }))
    } else {
      setValidationErrors(prev => ({
        ...prev,
        message: null
      }))
    }
  }

  // Handle email input change with validation
  const handleEmailChange = (e) => {
    const email = e.target.value
    
    if (email && !validateEmail(email)) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }))
    } else {
      setValidationErrors(prev => ({
        ...prev,
        email: null
      }))
    }
  }
 
  const sendEmail = (e) => {
    e.preventDefault();

    // Get form values
    const formData = new FormData(form.current)
    const email = formData.get('user_email')
    const message = formData.get('message')

    // Validate before sending
    const errors = {}
    
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    const words = countWords(message)
    if (words > 1000) {
      errors.message = 'Message cannot exceed 1000 words'
    }
    
    if (words === 0) {
      errors.message = 'Please enter a message'
    }

    // If there are validation errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      showToast('error', 'Please fix the validation errors before submitting.')
      return
    }

    // Clear any existing validation errors
    setValidationErrors({})
 
    emailjs
      .sendForm(
        "service_ptyy0k4",
        "template_2qhg5g8",
        form.current,
        "UohoL3t_Gvti8yz_F"
      )
      .then(
        () => {
          showToast('success', 'Message sent successfully!')
          form.current.reset();
          setWordCount(0);
          setValidationErrors({});
        },
        (error) => {
          showToast('error', 'Failed to send message. Please try again.')
          logger.error("Error sending email:", error.text);
        }
      );
  };
 
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      {/* Yellow Background Layer */}
      <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none z-0" />
      
      {/* Honeycomb Background */}
      <HoneycombBackground opacity={0.08} />
      
      {/* Navigation Bar */}
      <PublicNavbar showContact={false} />

      <div className="pt-32 pb-16 px-4">
        {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-50 px-4 py-2 rounded shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
      
      <div className="max-w-5xl mx-auto bg-black/80 border border-yellow-400/20 rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 bg-gradient-to-br from-yellow-400/10 to-yellow-600/5">
            <h2 className="text-3xl font-bold mb-4 text-yellow-400">Get in touch</h2>
            <p className="text-yellow-200 mb-6">Have a question about Biz-Buzz? We'd love to hear from you and help you connect with your local business community.</p>
 
            <div className="space-y-4 text-yellow-200">
              <div>
                <h3 className="font-semibold text-yellow-400">Email</h3>
                <p>support@bizbuzz.com</p>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-400">Location</h3>
                <p>Supporting Local Businesses Everywhere</p>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-400">Response Time</h3>
                <p>We typically respond within 24 hours</p>
              </div>
            </div>
          </div>
 
          <div className="p-8 bg-black/50">
            <form ref={form} onSubmit={sendEmail} className="flex flex-col">
              <label htmlFor="user_email" className="mb-1 font-medium text-yellow-400">Your Email</label>
              <input 
                id="user_email" 
                name="user_email" 
                type="email" 
                required 
                onChange={handleEmailChange}
                className={`bg-gray-800 border rounded px-3 py-2 mb-1 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                  validationErrors.email 
                    ? 'border-red-400 focus:border-red-400' 
                    : 'border-yellow-400/30 focus:border-yellow-400'
                }`}
                placeholder="you@example.com" 
              />
              {validationErrors.email && (
                <p className="text-red-400 text-sm mb-3">{validationErrors.email}</p>
              )}
              {!validationErrors.email && <div className="mb-3"></div>}
 
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="message" className="font-medium text-yellow-400">Message</label>
                <span className={`text-sm ${wordCount > 1000 ? 'text-red-400' : 'text-yellow-200'}`}>
                  {wordCount}/1000 words
                </span>
              </div>
              <textarea 
                id="message" 
                name="message" 
                required 
                rows={6} 
                onChange={handleMessageChange}
                className={`bg-gray-800 border rounded px-3 py-2 mb-1 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                  validationErrors.message 
                    ? 'border-red-400 focus:border-red-400' 
                    : 'border-yellow-400/30 focus:border-yellow-400'
                }`}
                placeholder="Tell us how we can help..." 
              />
              {validationErrors.message && (
                <p className="text-red-400 text-sm mb-3">{validationErrors.message}</p>
              )}
              {!validationErrors.message && <div className="mb-3"></div>}
 
              <button 
                type="submit" 
                className="self-start bg-yellow-400 text-black px-6 py-2 rounded font-semibold hover:bg-yellow-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
 
 