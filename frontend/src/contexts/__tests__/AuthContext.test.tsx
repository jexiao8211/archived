import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, AuthContext } from '../AuthContext'
import { mockApi } from '../../test/test-utils'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('provides initial auth state', () => {
    const { result } = renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    expect(result.current.token).toBeNull()
    expect(result.current.refreshToken).toBeNull()
    expect(result.current.user).toBeNull()
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.register).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })

  it('loads user profile when token exists in localStorage', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    const mockToken = 'mock-access-token'
    
    localStorage.setItem('token', mockToken)
    mockApi.fetchUserProfile.mockResolvedValue(mockUser)

    const { result } = renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(result.current.token).toBe(mockToken)
      expect(result.current.user).toEqual(mockUser)
    })

    expect(mockApi.fetchUserProfile).toHaveBeenCalled()
  })

  it('clears tokens and redirects when token is invalid', async () => {
    const mockToken = 'invalid-token'
    
    localStorage.setItem('token', mockToken)
    mockApi.fetchUserProfile.mockRejectedValue(new Error('Invalid token'))

    renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/logged-out')
    })
  })

  it('successfully logs in user', async () => {
    const mockLoginResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      token_type: 'bearer'
    }
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
    
    mockApi.loginUser.mockResolvedValue(mockLoginResponse)
    mockApi.fetchUserProfile.mockResolvedValue(mockUser)

    const { result } = renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    await act(async () => {
      await result.current.login('testuser', 'testpass')
    })

    expect(mockApi.loginUser).toHaveBeenCalledWith({ username: 'testuser', password: 'testpass' })
    expect(localStorage.getItem('token')).toBe('new-access-token')
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token')
    expect(result.current.user).toEqual(mockUser)
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('successfully registers user', async () => {
    mockApi.registerUser.mockResolvedValue(undefined)

    const { result } = renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    await act(async () => {
      await result.current.register('newuser', 'new@example.com', 'newpass')
    })

    expect(mockApi.registerUser).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'newpass'
    })
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('successfully logs out user', async () => {
    const mockToken = 'mock-token'
    const mockRefreshToken = 'mock-refresh-token'
    
    localStorage.setItem('token', mockToken)
    localStorage.setItem('refresh_token', mockRefreshToken)

    const { result } = renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.refreshToken).toBeNull()
    expect(result.current.user).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/logged-out')
  })

  it('handles login errors gracefully', async () => {
    mockApi.loginUser.mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    await expect(async () => {
      await act(async () => {
        await result.current.login('testuser', 'wrongpass')
      })
    }).rejects.toThrow('Invalid credentials')

    expect(localStorage.getItem('token')).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('handles registration errors gracefully', async () => {
    mockApi.registerUser.mockRejectedValue(new Error('Username already exists'))

    const { result } = renderHook(() => {
      const context = React.useContext(AuthContext)
      return context
    }, { wrapper: TestWrapper })

    await expect(async () => {
      await act(async () => {
        await result.current.register('existinguser', 'test@example.com', 'pass')
      })
    }).rejects.toThrow('Username already exists')

    expect(mockNavigate).not.toHaveBeenCalledWith('/login')
  })
})
