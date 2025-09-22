import React, { useState } from 'react'
import { createAssignmentWithAI, generateQuestions } from './api'
import { useToast } from './Toast.jsx'
import { useFormValidation, validators, FormField } from './SimpleFormValidation.jsx'

export default function WorkingAssignmentCreator({ classes, onAssignmentCreated, onCancel }) {
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Form, 2: Questions Preview, 3: Created
  const toast = useToast()

  const {
    values: formData,
    errors,
    touched,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    handleChange: handleFormChange,
    validateField,
    isValid
  } = useFormValidation(
    {
      class_id: classes[0]?.id || '',
      title: '',
      subject: 'Math',
      skill_tag: 'fractions',
      difficulty: 1,
      num_questions: 3,
      due_date: '',
      due_time: '23:59',
      time_limit_minutes: 30
    },
    {
      title: [validators.required, validators.minLength(3), validators.maxLength(100)],
      due_date: [validators.required, validators.future],
      class_id: [validators.required],
      num_questions: [validators.required, validators.positiveNumber, validators.range(1, 20)]
    }
  )

  const generateQuestionsWithAI = async (validatedData) => {
    if (!isValid) {
      if (toast) {
        toast.warning('Please fill in all required fields correctly')
      }
      return
    }
    
    setLoading(true)
    setError('')
    if (toast) {
      toast.info('🤖 AI is generating questions...')
    }
    
    try {
      const result = await generateQuestions({
        topic: validatedData.title,
        difficulty: parseInt(validatedData.difficulty),
        skill_tag: validatedData.skill_tag,
        num_questions: parseInt(validatedData.num_questions),
        grade_level: '6-8'
      })
      
      setGeneratedQuestions(result.questions)
      setStep(2)
      if (toast) {
        toast.success(`🎉 Generated ${result.questions.length} questions successfully!`)
      }
    } catch (err) {
      setError(err.message || 'Failed to generate questions')
      if (toast) {
        toast.error(`Failed to generate questions: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async () => {
    setLoading(true)
    setError('')
    if (toast) {
      toast.info('Creating assignment...')
    }
    
    try {
      const due_at = `${formData.due_date}T${formData.due_time}:00`
      
      const assignmentData = {
        class_id: parseInt(formData.class_id),
        lesson_data: {
          title: formData.title,
          subject: formData.subject,
          skill_tag: formData.skill_tag,
          difficulty: parseInt(formData.difficulty)
        },
        questions: generatedQuestions,
        due_at,
        type: 'quiz',
        time_limit_minutes: parseInt(formData.time_limit_minutes) || null
      }
      
      const result = await createAssignmentWithAI(assignmentData)
      setStep(3)
      if (toast) {
        toast.success('🎉 Assignment created and assigned to students!')
      }
      
      // Notify parent component
      setTimeout(() => {
        onAssignmentCreated?.(result)
      }, 2000)
      
    } catch (err) {
      setError(err.message || 'Failed to create assignment')
      if (toast) {
        toast.error(`Failed to create assignment: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const editQuestion = (index, field, value) => {
    const updated = [...generatedQuestions]
    updated[index][field] = value
    setGeneratedQuestions(updated)
  }

  if (step === 3) {
    return (
      <div className="assignment-creator">
        <div className="success-message">
          <h3>🎉 Assignment Created Successfully!</h3>
          <p>Your AI-generated assignment has been created and is ready for students.</p>
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => onAssignmentCreated?.()}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="assignment-creator">
        <div className="step-header">
          <h3>Review AI-Generated Questions</h3>
          <p>Review and edit the questions before creating the assignment</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="questions-preview">
          {generatedQuestions.map((question, index) => (
            <div key={index} className="question-editor">
              <div className="question-header">
                <span className="question-type">{question.type.toUpperCase()}</span>
                <span className="question-number">Question {index + 1}</span>
              </div>
              
              <div className="form-group">
                <label>Question Prompt</label>
                <textarea
                  value={question.prompt}
                  onChange={(e) => editQuestion(index, 'prompt', e.target.value)}
                  className="input"
                  rows={2}
                />
              </div>
              
              {question.type === 'mcq' && (
                <div className="form-group">
                  <label>Answer Options</label>
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="option-input">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...question.options]
                          newOptions[optIndex] = e.target.value
                          editQuestion(index, 'options', newOptions)
                        }}
                        className="input"
                        placeholder={`Option ${optIndex + 1}`}
                      />
                      {option === question.answer_key && (
                        <span className="correct-indicator">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="form-group">
                <label>Correct Answer</label>
                <input
                  type="text"
                  value={question.answer_key}
                  onChange={(e) => editQuestion(index, 'answer_key', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="step-actions">
          <button className="btn btn-secondary" onClick={() => setStep(1)}>
            Back to Form
          </button>
          <button 
            className="btn btn-primary"
            onClick={createAssignment}
            disabled={loading}
          >
            {loading ? 'Creating Assignment...' : 'Create Assignment'}
          </button>
        </div>
      </div>
    )
  }

  // Step 1: Form
  return (
    <div className="assignment-creator">
      <div className="step-header">
        <h3>🤖 Create AI-Powered Assignment</h3>
        <p>Fill in the details and AI will generate questions for you</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(generateQuestionsWithAI)
      }}>
        <FormField
          label="Assignment Title"
          name="title"
          placeholder="e.g., Fractions Practice Quiz"
          required
          {...getFieldProps('title')}
        />
        
        <FormField
          label="Class"
          name="class_id"
          required
          {...getFieldProps('class_id')}
        >
          <select
            className="form-field__input"
            {...getFieldProps('class_id')}
          >
            <option value="">Select a class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </FormField>
        
        <FormField
          label="Subject"
          name="subject"
          {...getFieldProps('subject')}
        >
          <select
            className="form-field__input"
            {...getFieldProps('subject')}
          >
            <option value="Math">Math</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="History">History</option>
          </select>
        </FormField>
        
        <FormField
          label="Number of Questions"
          name="num_questions"
          type="number"
          placeholder="3"
          required
          {...getFieldProps('num_questions')}
        />
        
        <FormField
          label="Due Date"
          name="due_date"
          type="date"
          required
          {...getFieldProps('due_date')}
        />
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting || loading}
          >
            {loading ? 'Generating...' : '🤖 Generate Questions'}
          </button>
        </div>
      </form>
    </div>
  )
}
