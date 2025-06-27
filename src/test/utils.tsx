import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@store/AuthProvider'

// Custom render function with providers
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  withAuth?: boolean
  user?: {
    id: string
    username: string
    display_name: string
    role: string
    clearance_level: number
  }
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    initialEntries = ['/'],
    withAuth = true,
    user = {
      id: 'test-user-1',
      username: 'testuser',
      display_name: 'Test User',
      role: 'investigator',
      clearance_level: 2
    },
    ...renderOptions
  } = options

  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {withAuth ? (
            <AuthProvider>
              {children}
            </AuthProvider>
          ) : (
            children
          )}
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    user,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Mock data generators
export const mockForensicFile = (overrides: Partial<any> = {}) => ({
  id: 'test-file-1',
  filename: 'test_image.jpg',
  path: '/extracted_fragments/test_image.jpg',
  size: 2048576,
  entropy: 7.5,
  file_type: 'JPEG',
  suspicious_score: 8.2,
  analysis_date: new Date().toISOString(),
  ...overrides
})

export const mockAgent = (overrides: Partial<any> = {}) => ({
  agent_id: 'test-agent',
  name: 'Test Agent',
  description: 'Test agent for unit testing',
  capabilities: ['test_capability'],
  status: 'idle' as const,
  task_count: 10,
  success_count: 9,
  error_count: 1,
  success_rate: 0.9,
  created_at: new Date().toISOString(),
  last_activity: new Date().toISOString(),
  ...overrides
})

export const mockAnalysisResult = (overrides: Partial<any> = {}) => ({
  file: mockForensicFile(),
  binary: {
    entropy: 7.5,
    compression_ratio: 0.8,
    null_byte_percentage: 2.1,
    printable_percentage: 65.4,
    likely_binary: 1
  },
  strings: [
    {
      id: 1,
      string_content: 'Test string content',
      string_length: 18,
      is_suspicious: 0,
      offset_decimal: 1024
    }
  ],
  signatures: [
    {
      id: 1,
      signature_name: 'JPEG Header',
      signature_hex: 'FFD8FF',
      offset: 0,
      confidence: 0.95
    }
  ],
  xor: [],
  bitplane: [],
  analysis_timestamp: new Date().toISOString(),
  analysis_complete: true,
  ...overrides
})

export const mockGraphData = (overrides: Partial<any> = {}) => ({
  nodes: [
    {
      id: 'file_1',
      type: 'file',
      label: 'test_file_1.jpg',
      data: {
        filename: 'test_file_1.jpg',
        size: 1024000,
        entropy: 7.5,
        suspicious_score: 8.0
      },
      weight: 3.0
    }
  ],
  edges: [],
  clusters: [],
  statistics: {
    total_nodes: 1,
    total_edges: 0,
    total_clusters: 0,
    edge_types: {},
    average_edge_weight: 0,
    density: 0,
    largest_cluster_size: 0
  },
  metadata: {
    generated_at: new Date().toISOString(),
    mode: 'test'
  },
  ...overrides
})

// Test helper functions
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-1',
  username: 'testuser',
  display_name: 'Test User',
  role: 'investigator',
  clearance_level: 2,
  status: 'online',
  last_active: new Date().toISOString(),
  created_at: new Date().toISOString(),
  ...overrides
})

export const createMockInvestigation = (overrides: Partial<any> = {}) => ({
  id: 'test-investigation-1',
  title: 'Test Investigation',
  description: 'A test investigation for unit tests',
  category: 'malware_analysis',
  priority: 'medium',
  status: 'active',
  author: 'test-user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

// Custom matchers for testing
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

export const expectElementToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveClass(className)
}

// Navigation helpers
export const navigateTo = (path: string) => {
  window.history.pushState({}, 'Test page', path)
}

// Form helpers
export const fillForm = async (
  form: HTMLFormElement,
  data: Record<string, string>,
  userEvent: any
) => {
  for (const [name, value] of Object.entries(data)) {
    const field = form.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (field) {
      await userEvent.clear(field)
      await userEvent.type(field, value)
    }
  }
}

// API helpers
export const mockApiResponse = (data: any, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (error: any, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delay)
  })
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'