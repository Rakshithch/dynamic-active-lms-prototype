import React, { useState } from 'react'

export default function Login({ onLogin, loading = false }) {
  const [formData, setFormData] = useState({
    email: 'student.demo@example.com', // Default for demo
    password: 'password123'
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      await onLogin(formData.email, formData.password)
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Quick login buttons for demo
  const quickLogin = (email, role) => {
    setFormData({ email, password: 'password123' })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Dynamic Active LMS</h2>
        <p className="subtitle">Sign in to continue</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="demo-logins">
          <p className="demo-title">Demo Accounts:</p>
          <div className="demo-buttons">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => quickLogin('student.demo@example.com', 'student')}
            >
              Student (Demo Student)
            </button>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => quickLogin('teacher.demo@example.com', 'teacher')}
            >
              Teacher (Demo Teacher)
            </button>
          </div>
          <p className="demo-note">Password: password123</p>
        </div>
      </div>
    </div>
  )
}
