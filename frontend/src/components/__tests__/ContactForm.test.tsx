import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import ContactForm from '../ContactForm'
import { mockApi } from '../../test/test-utils'

describe('ContactForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders contact form with all required fields', () => {
    render(<ContactForm />)
    
    expect(screen.getByLabelText('Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Email *')).toBeInTheDocument()
    expect(screen.getByLabelText('Subject *')).toBeInTheDocument()
    expect(screen.getByLabelText('Message *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument()
  })

  it('allows user to input all form fields', async () => {
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    
    expect(nameInput).toHaveValue('John Doe')
    expect(emailInput).toHaveValue('john@example.com')
    expect(subjectInput).toHaveValue('Test Subject')
    expect(messageInput).toHaveValue('This is a test message')
  })

  it('calls submitContactForm when form is submitted with valid data', async () => {
    mockApi.submitContactForm.mockResolvedValue(undefined)
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    expect(mockApi.submitContactForm).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'This is a test message'
    })
  })

  it('shows success message after successful submission', async () => {
    mockApi.submitContactForm.mockResolvedValue(undefined)
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Thank you for your message! We'll get back to you soon.")).toBeInTheDocument()
    })
  })

  it('clears form after successful submission', async () => {
    mockApi.submitContactForm.mockResolvedValue(undefined)
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(emailInput).toHaveValue('')
      expect(subjectInput).toHaveValue('')
      expect(messageInput).toHaveValue('')
    })
  })

  it('shows error message when submission fails', async () => {
    mockApi.submitContactForm.mockRejectedValue(new Error('Network error'))
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows rate limiting error message when rate limited', async () => {
    const rateLimitError = {
      response: {
        status: 429,
        data: {
          message: 'Rate limit exceeded. Please try again later.'
        }
      }
    }
    mockApi.submitContactForm.mockRejectedValue(rateLimitError)
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded. Please try again later.')).toBeInTheDocument()
    })
  })

  it('shows generic rate limiting message when no specific message provided', async () => {
    const rateLimitError = {
      response: {
        status: 429,
        data: {}
      }
    }
    mockApi.submitContactForm.mockRejectedValue(rateLimitError)
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Too many contact form submissions. Please try again later.')).toBeInTheDocument()
    })
  })

  it('disables submit button while submitting', async () => {
    mockApi.submitContactForm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent('Sending...')
  })

  it('has proper form validation attributes', () => {
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    
    expect(nameInput).toBeRequired()
    expect(emailInput).toBeRequired()
    expect(subjectInput).toBeRequired()
    expect(messageInput).toBeRequired()
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('has proper placeholder text', () => {
    render(<ContactForm />)
    
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What is this about?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tell us more about your inquiry...')).toBeInTheDocument()
  })

  it('clears error message when user starts typing again', async () => {
    mockApi.submitContactForm.mockRejectedValue(new Error('Network error'))
    
    render(<ContactForm />)
    
    const nameInput = screen.getByLabelText('Name *')
    const emailInput = screen.getByLabelText('Email *')
    const subjectInput = screen.getByLabelText('Subject *')
    const messageInput = screen.getByLabelText('Message *')
    const submitButton = screen.getByRole('button', { name: 'Send Message' })
    
    // First, trigger an error
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(subjectInput, 'Test Subject')
    await user.type(messageInput, 'This is a test message')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
    
    // Then start typing again
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Doe')
    
    // Error should be cleared
    expect(screen.queryByText('Network error')).not.toBeInTheDocument()
  })
})
