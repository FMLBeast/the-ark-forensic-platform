import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { LoginPage } from './LoginPage'
import { renderWithProviders } from '@/test/utils'
import userEvent from '@testing-library/user-event'

// Mock the API
vi.mock('@utils/api', () => ({
  api: {
    post: vi.fn()
  }
}))

// Mock the auth context
const mockLogin = vi.fn()
vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    user: null
  })
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all required fields', () => {
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    expect(screen.getByText('The Ark')).toBeInTheDocument()
    expect(screen.getByText('Forensic Investigation Platform')).toBeInTheDocument()
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /access system/i })).toBeInTheDocument()
  })

  it('shows Matrix-themed visual elements', () => {
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    // Check for Matrix rain component
    expect(screen.getByTestId('matrix-rain')).toBeInTheDocument()
    
    // Check for themed styling classes
    const loginContainer = screen.getByRole('main')
    expect(loginContainer).toHaveClass('bg-bg-primary')
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    const submitButton = screen.getByRole('button', { name: /access system/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('submits login form with valid credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /access system/i })
    
    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123')
    })
  })

  it('displays error message for invalid credentials', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid username or password'
    
    // Mock the useAuth hook to return an error
    vi.mocked(require('@hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: errorMessage,
      user: null
    })
    
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-red-500/20')
  })

  it('shows loading state during authentication', async () => {
    // Mock loading state
    vi.mocked(require('@hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      user: null
    })
    
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    const submitButton = screen.getByRole('button', { name: /authenticating/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'admin123')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123')
    })
  })

  it('clears error message when user starts typing', async () => {
    const user = userEvent.setup()
    
    // Start with an error state
    vi.mocked(require('@hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Previous error',
      user: null
    })
    
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    expect(screen.getByText('Previous error')).toBeInTheDocument()
    
    const usernameInput = screen.getByLabelText(/username/i)
    await user.type(usernameInput, 'a')
    
    // Error should be cleared (this would require implementing this behavior in the actual component)
    await waitFor(() => {
      expect(screen.queryByText('Previous error')).not.toBeInTheDocument()
    })
  })

  it('displays password visibility toggle', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click again to hide password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('autofocuses username field on mount', () => {
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    const usernameInput = screen.getByLabelText(/username/i)
    expect(usernameInput).toHaveFocus()
  })

  it('shows default credentials hint', () => {
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    expect(screen.getByText(/default credentials/i)).toBeInTheDocument()
    expect(screen.getByText('admin / admin123')).toBeInTheDocument()
  })

  it('displays system status indicator', () => {
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    expect(screen.getByText(/system status/i)).toBeInTheDocument()
    expect(screen.getByText(/operational/i)).toBeInTheDocument()
    expect(screen.getByTestId('status-indicator')).toHaveClass('bg-green-500')
  })

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup()
    const networkError = 'Network connection failed'
    
    vi.mocked(require('@hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: networkError,
      user: null
    })
    
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    expect(screen.getByText(networkError)).toBeInTheDocument()
    expect(screen.getByText(/please check your connection/i)).toBeInTheDocument()
  })

  it('redirects authenticated users', () => {
    const mockUser = {
      id: 'user-1',
      username: 'admin',
      display_name: 'Administrator',
      role: 'admin',
      clearance_level: 5
    }
    
    vi.mocked(require('@hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      user: mockUser
    })
    
    // Mock navigate function
    const mockNavigate = vi.fn()
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate)
    
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { withAuth: false })
    
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /access system/i })
    
    // Tab navigation should work
    expect(usernameInput).toHaveFocus()
    
    await user.tab()
    expect(passwordInput).toHaveFocus()
    
    await user.tab()
    expect(submitButton).toHaveFocus()
  })
})