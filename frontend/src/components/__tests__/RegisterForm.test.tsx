import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import RegisterForm from '../RegisterForm'

// Mock the AuthContext
const mockRegister = vi.fn()
const mockAuthContext = {
  token: null,
  refreshToken: null,
  user: null,
  login: vi.fn(),
  register: mockRegister,
  logout: vi.fn(),
}

vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: React.createContext({
    token: null,
    refreshToken: null,
    user: null,
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
  }),
  useContext: () => mockAuthContext,
}))

describe('RegisterForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form with all required fields', () => {
    render(<RegisterForm />)
    
    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.getByLabelText('Username:')).toBeInTheDocument()
    expect(screen.getByLabelText('Email:')).toBeInTheDocument()
    expect(screen.getByLabelText('Password:')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
    expect(screen.getByText('already have an account? login here')).toBeInTheDocument()
  })

  it('allows user to input all form fields', async () => {
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    
    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    
    expect(usernameInput).toHaveValue('newuser')
    expect(emailInput).toHaveValue('new@example.com')
    expect(passwordInput).toHaveValue('newpass123')
    expect(confirmPasswordInput).toHaveValue('newpass123')
  })

  it('shows password match indicator when passwords match', async () => {
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    
    expect(screen.getByText('✓ Passwords match')).toBeInTheDocument()
  })

  it('shows password mismatch indicator when passwords do not match', async () => {
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'differentpass')
    
    expect(screen.getByText('✗ Passwords do not match')).toBeInTheDocument()
  })

  it('enables submit button when all fields are valid', async () => {
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    // Initially disabled
    expect(submitButton).toBeDisabled()
    
    // Fill all fields with matching passwords
    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    
    // Should be enabled
    expect(submitButton).toBeEnabled()
  })

  it('calls register function when form is submitted with valid data', async () => {
    mockRegister.mockResolvedValue(undefined)
    
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)
    
    expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@example.com', 'newpass123')
  })

  it('shows error when passwords do not match on submit', async () => {
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'differentpass')
    await user.click(submitButton)
    
    expect(screen.getByText('Passwords do not match. Please try again.')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, '123')
    await user.type(confirmPasswordInput, '123')
    await user.click(submitButton)
    
    expect(screen.getByText('Password must be at least 6 characters long.')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('shows error message when registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'))
    
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('clears error message when user starts typing again', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'))
    
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    // First, trigger an error
    await user.type(usernameInput, 'newuser')
    await user.type(emailInput, 'new@example.com')
    await user.type(passwordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument()
    })
    
    // Then start typing again
    await user.clear(usernameInput)
    await user.type(usernameInput, 'differentuser')
    
    // Error should be cleared
    expect(screen.queryByText('Registration failed. Please try again.')).not.toBeInTheDocument()
  })

  it('has proper form validation attributes', () => {
    render(<RegisterForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const emailInput = screen.getByLabelText('Email:')
    const passwordInput = screen.getByLabelText('Password:')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password:')
    
    expect(usernameInput).toBeRequired()
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(confirmPasswordInput).toBeRequired()
    expect(passwordInput).toHaveAttribute('minLength', '6')
    expect(confirmPasswordInput).toHaveAttribute('minLength', '6')
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('navigates to login page when login link is clicked', async () => {
    render(<RegisterForm />)
    
    const loginLink = screen.getByText('already have an account? login here')
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('disables submit button when any required field is empty', async () => {
    render(<RegisterForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Register' })
    
    // Test with only username filled
    await user.type(screen.getByLabelText('Username:'), 'newuser')
    expect(submitButton).toBeDisabled()
    
    // Test with username and email filled
    await user.type(screen.getByLabelText('Email:'), 'new@example.com')
    expect(submitButton).toBeDisabled()
    
    // Test with username, email, and password filled
    await user.type(screen.getByLabelText('Password:'), 'newpass123')
    expect(submitButton).toBeDisabled()
    
    // Test with all fields filled but passwords don't match
    await user.type(screen.getByLabelText('Confirm Password:'), 'differentpass')
    expect(submitButton).toBeDisabled()
  })
})
