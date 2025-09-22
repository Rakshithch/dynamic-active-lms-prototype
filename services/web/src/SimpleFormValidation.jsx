import { useState, useCallback } from 'react'
import { useToast } from './Toast.jsx'

// Simple validation rules that work reliably
export const validators = {
  required: (value, message = 'This field is required') => {
    const trimmed = typeof value === 'string' ? value.trim() : value
    return !trimmed || trimmed === '' ? message : null
  },

  email: (value, message = 'Please enter a valid email address') => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return !emailRegex.test(value) ? message : null
  },

  minLength: (min) => (value, message = `Must be at least ${min} characters`) => {
    if (!value) return null
    return value.length < min ? message : null
  },

  maxLength: (max) => (value, message = `Must be no more than ${max} characters`) => {
    if (!value) return null
    return value.length > max ? message : null
  },

  positiveNumber: (value, message = 'Must be a positive number') => {
    if (!value) return null
    const num = Number(value)
    return isNaN(num) || num <= 0 ? message : null
  },

  range: (min, max) => (value, message = `Must be between ${min} and ${max}`) => {
    if (!value) return null
    const num = Number(value)
    return isNaN(num) || num < min || num > max ? message : null
  },

  future: (value, message = 'Date must be in the future') => {
    if (!value) return null
    const date = new Date(value)
    const now = new Date()
    return date <= now ? message : null
  }
}

// Simplified form validation hook
export function useFormValidation(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  // Validate single field
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name]
    if (!rules) return null

    const ruleArray = Array.isArray(rules) ? rules : [rules]
    for (const rule of ruleArray) {
      const error = rule(value)
      if (error) return error
    }
    return null
  }, [validationRules])

  // Validate all fields
  const validateAll = useCallback(() => {
    const newErrors = {}
    let hasErrors = false

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
  }, [values, validateField, validationRules])

  // Handle input change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }, [touched, validateField])

  // Handle input blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateField(name, values[name])
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }, [values, validateField])

  // Submit form with validation
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true)
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce(
      (acc, key) => ({ ...acc, [key]: true }), {}
    )
    setTouched(allTouched)

    if (!validateAll()) {
      if (toast) {
        toast.error('Please fix the validation errors before submitting')
      }
      setIsSubmitting(false)
      return false
    }

    try {
      await onSubmit(values)
      return true
    } catch (error) {
      if (toast) {
        toast.error(error.message || 'Submission failed')
      }
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateAll, validationRules, toast])

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // Get field props for easy integration
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: (e) => handleChange(name, e.target.value),
    onBlur: () => handleBlur(name),
    error: errors[name],
    touched: touched[name]
  }), [values, errors, touched, handleChange, handleBlur])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateAll,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.values(errors).some(error => error !== null)
  }
}

// Simple validation message component
export function ValidationMessage({ error, show = true }) {
  if (!error || !show) return null
  
  return (
    <div className="validation-message validation-message--error">
      <span className="validation-message__icon">⚠️</span>
      <span className="validation-message__text">{error}</span>
    </div>
  )
}

// Simple form field component
export function FormField({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  required = false,
  children,
  ...props 
}) {
  return (
    <div className={`form-field ${props.error ? 'form-field--error' : ''} ${props.touched && !props.error ? 'form-field--success' : ''}`}>
      {label && (
        <label className="form-field__label">
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
      )}
      
      <div className="form-field__input-wrapper">
        {children || (
          <input
            type={type}
            className={`form-field__input ${props.error ? 'input--error' : ''} ${props.touched && !props.error ? 'input--success' : ''}`}
            placeholder={placeholder}
            {...props}
          />
        )}
        
        {props.touched && !props.error && (
          <div className="form-field__success-icon">✓</div>
        )}
      </div>
      
      <ValidationMessage error={props.error} show={props.touched} />
    </div>
  )
}
