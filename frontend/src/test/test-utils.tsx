import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock API functions
export const mockApi = {
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  fetchUserProfile: vi.fn(),
  fetchCollections: vi.fn(),
  createCollection: vi.fn(),
  fetchCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  fetchCollectionItems: vi.fn(),
  createItem: vi.fn(),
  fetchItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  addItemTags: vi.fn(),
  deleteItemTags: vi.fn(),
  submitContactForm: vi.fn(),
  createOrEnableShare: vi.fn(),
  disableShare: vi.fn(),
  fetchSharedCollection: vi.fn(),
  fetchSharedItem: vi.fn(),
}

// Mock the entire api module
vi.mock('../api', () => mockApi)

// Mock AuthProvider
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
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
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
