import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/test-utils'
import LoginForm from '../LoginForm'
import { mockApi } from '../../test/test-utils'

// Mock the AuthContext
const mockLogin = vi.fn()
const mockAuthContext = {
  token: null,
  refreshToken: null,
  user: null,
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
}

vi.mock('../../contexts/AuthContext', () => ({
  AuthContext: React.createContext({
    token: null,
    refreshToken: null,
    user: null,
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
  }),
  useContext: () => mockAuthContext,
}))

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all required fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Username:')).toBeInTheDocument()
    expect(screen.getByLabelText('Password:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByText('new to archived? register here')).toBeInTheDocument()
  })

  it('allows user to input username and password', async () => {
    render(<LoginForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const passwordInput = screen.getByLabelText('Password:')
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    
    expect(usernameInput).toHaveValue('testuser')
    expect(passwordInput).toHaveValue('testpass')
  })

  it('calls login function when form is submitted with valid data', async () => {
    mockLogin.mockResolvedValue(undefined)
    
    render(<LoginForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const passwordInput = screen.getByLabelText('Password:')
    const submitButton = screen.getByRole('button', { name: 'Login' })
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'testpass')
    await user.click(submitButton)
    
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass')
  })

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'))
    
    render(<LoginForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const passwordInput = screen.getByLabelText('Password:')
    const submitButton = screen.getByRole('button', { name: 'Login' })
    
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'wrongpass')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument()
    })
  })

  it('clears error message when user starts typing again', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'))
    
    render(<LoginForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const passwordInput = screen.getByLabelText('Password:')
    const submitButton = screen.getByRole('button', { name: 'Login' })
    
    // First, trigger an error
    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'wrongpass')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument()
    })
    
    // Then start typing again
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newuser')
    
    // Error should be cleared
    expect(screen.queryByText('Login failed. Please check your credentials.')).not.toBeInTheDocument()
  })

  it('prevents form submission with empty fields', async () => {
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Login' })
    
    // Try to submit without filling fields
    await user.click(submitButton)
    
    // Form should not submit (HTML5 validation)
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('has proper form validation attributes', () => {
    render(<LoginForm />)
    
    const usernameInput = screen.getByLabelText('Username:')
    const passwordInput = screen.getByLabelText('Password:')
    
    expect(usernameInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('navigates to register page when register link is clicked', async () => {
    render(<LoginForm />)
    
    const registerLink = screen.getByText('new to archived? register here')
    expect(registerLink).toHaveAttribute('href', '/register')
  })
})
