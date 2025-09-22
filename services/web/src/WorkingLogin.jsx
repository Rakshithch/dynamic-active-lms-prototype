import React, { useState } from 'react'
import { login } from './api'
import { useFormValidation, validators, FormField } from './SimpleFormValidation.jsx'
import { useToast } from './Toast.jsx'

export default function WorkingLogin({ onLogin, loading = false }) {
  const toast = useToast()

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    reset
  } = useFormValidation(
    {
      email: 'student.demo@example.com', // Default for demo
      password: 'password123'
    },
    {
      email: [validators.required, validators.email],
      password: [validators.required, validators.minLength(6)]
    }
  )

  const onSubmit = async (formData) => {
    await onLogin(formData.email, formData.password)
    if (toast) {
      toast.success('Login successful! Welcome back! 👋')
    }
  }

  // Quick login buttons for demo
  const quickLogin = (email, role) => {
    reset({ email, password: 'password123' })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Dynamic Active LMS</h2>
        <p className="subtitle">Sign in to continue</p>
        
        <form onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(onSubmit)
        }}>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            {...getFieldProps('email')}
          />
          
          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            {...getFieldProps('password')}
          />
          
          <button 
            type="submit" 
            className="btn btn-primary btn--form-submit"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Signing in...' : 'Sign In'}
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
