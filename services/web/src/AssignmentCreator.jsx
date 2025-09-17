import React, { useState } from 'react'
import { generateQuestions, createAssignmentWithAI } from './api'

export default function AssignmentCreator({ classes, onAssignmentCreated, onCancel }) {
  const [formData, setFormData] = useState({
    class_id: classes[0]?.id || '',
    title: '',
    subject: 'Math',
    skill_tag: 'fractions',
    difficulty: 1,
    num_questions: 3,
    due_date: '',
    due_time: '23:59'
  })
  
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Form, 2: Questions Preview, 3: Created

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const generateQuestionsWithAI = async () => {
    if (!formData.title || !formData.skill_tag) {
      setError('Title and skill tag are required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const result = await generateQuestions({
        topic: formData.title,
        difficulty: parseInt(formData.difficulty),
        skill_tag: formData.skill_tag,
        num_questions: parseInt(formData.num_questions),
        grade_level: '6-8'
      })
      
      setGeneratedQuestions(result.questions)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async () => {
    setLoading(true)
    setError('')
    
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
        type: 'quiz'
      }
      
      const result = await createAssignmentWithAI(assignmentData)
      setStep(3)
      
      // Notify parent component
      setTimeout(() => {
        onAssignmentCreated?.(result)
      }, 2000)
      
    } catch (err) {
      setError(err.message || 'Failed to create assignment')
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
              
              {question.rubric_keywords && (
                <div className="form-group">
                  <label>Rubric Keywords</label>
                  <div className="keyword-tags">
                    {question.rubric_keywords.map((keyword, keyIndex) => (
                      <span key={keyIndex} className="tag">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>Explanation</label>
                <textarea
                  value={question.explanation}
                  onChange={(e) => editQuestion(index, 'explanation', e.target.value)}
                  className="input"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="step-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setStep(1)}
          >
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

  return (
    <div className="assignment-creator">
      <div className="step-header">
        <h3>🤖 AI-Powered Assignment Creator</h3>
        <p>Create assignments with AI-generated questions tailored to your curriculum</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={(e) => { e.preventDefault(); generateQuestionsWithAI(); }}>
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              className="input"
              required
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Subject</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="input"
            >
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="History">History</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Assignment Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            placeholder="e.g., Fraction Addition and Subtraction"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Skill Focus</label>
            <select
              name="skill_tag"
              value={formData.skill_tag}
              onChange={handleChange}
              className="input"
            >
              <option value="fractions">Fractions</option>
              <option value="algebra">Algebra</option>
              <option value="geometry">Geometry</option>
              <option value="statistics">Statistics</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Difficulty Level</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="input"
            >
              <option value="1">Beginner (1)</option>
              <option value="2">Intermediate (2)</option>
              <option value="3">Advanced (3)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Number of Questions</label>
            <select
              name="num_questions"
              value={formData.num_questions}
              onChange={handleChange}
              className="input"
            >
              <option value="3">3 Questions</option>
              <option value="5">5 Questions</option>
              <option value="7">7 Questions</option>
              <option value="10">10 Questions</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Due Time</label>
            <input
              type="time"
              name="due_time"
              value={formData.due_time}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>
        
        <div className="step-actions">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Generating Questions...' : '🤖 Generate Questions with AI'}
          </button>
        </div>
      </form>
    </div>
  )
}
