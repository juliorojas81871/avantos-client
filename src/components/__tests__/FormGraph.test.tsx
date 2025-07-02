import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test-utils'
import FormGraph from '../FormGraph'
import { getFormGraph } from '../../api/formApi'

// Mock the API module
vi.mock('../../api/formApi', () => ({
  getFormGraph: vi.fn(),
  getGlobalData: vi.fn().mockResolvedValue({
    actionProperties: {
      actionId: '123',
      actionName: 'Test Action',
    },
    clientProperties: {
      clientId: '456',
      clientName: 'Test Client',
    },
  }),
}))

const mockFormGraph = {
  nodes: [
    {
      id: 'form-a',
      name: 'Form A',
      dependencies: [],
      fields: [
        { id: 'email', name: 'Email', type: 'email' },
        { id: 'name', name: 'Name', type: 'text' },
      ],
    },
    {
      id: 'form-b',
      name: 'Form B',
      dependencies: ['form-a'],
      fields: [
        { id: 'address', name: 'Address', type: 'text' },
      ],
    },
    {
      id: 'form-c',
      name: 'Form C',
      dependencies: ['form-b'],
      fields: [
        { id: 'phone', name: 'Phone', type: 'tel' },
      ],
    },
  ],
  edges: [
    { source: 'form-a', target: 'form-b' },
    { source: 'form-b', target: 'form-c' },
  ],
}

describe('FormGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getFormGraph).mockResolvedValue(mockFormGraph)
  })

  it('renders form graph and fetches data', async () => {
    render(<FormGraph />)

    // Wait for forms to load and be rendered
    await waitFor(() => {
      expect(getFormGraph).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Form A')).toBeInTheDocument()
      expect(screen.getByText('Form B')).toBeInTheDocument()
      expect(screen.getByText('Form C')).toBeInTheDocument()
    })
  })

  it('opens prefill modal when clicking a form', async () => {
    const { user } = render(<FormGraph />)

    // Wait for forms to load
    await waitFor(() => {
      expect(getFormGraph).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open Form B' })).toBeInTheDocument()
    })

    // Click on Form B
    await user.click(screen.getByRole('button', { name: 'Open Form B' }))

    // Wait for modal to open and global data to load
    await waitFor(() => {
      expect(screen.getByText('Configure Prefill - Form B')).toBeInTheDocument()
    })

    // Check if fields are displayed
    await waitFor(() => {
      expect(screen.getByText('Address')).toBeInTheDocument()
      expect(screen.getByText(/Type:\s*text/)).toBeInTheDocument()
    })
  })

  it('displays forms in correct dependency order', async () => {
    render(<FormGraph />)

    // Wait for forms to load
    await waitFor(() => {
      expect(getFormGraph).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Form A')).toBeInTheDocument()
    })

    // Get all form elements by their aria-labels
    const formElements = screen.getAllByRole('button', { name: /Open Form [A-Z]/ })
    const formNames = formElements.map(el => el.getAttribute('aria-label')?.replace('Open ', ''))

    // Check that forms are in correct order (A -> B -> C)
    expect(formNames).toEqual(['Form A', 'Form B', 'Form C'])
  })

  it('handles API errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getFormGraph).mockRejectedValue(new Error('API Error'))

    render(<FormGraph />)

    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error fetching graph:', expect.any(Error))
    })

    consoleError.mockRestore()
  })

  it('closes prefill modal when clicking outside', async () => {
    const { user } = render(<FormGraph />)

    // Wait for forms to load
    await waitFor(() => {
      expect(getFormGraph).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Form B')).toBeInTheDocument()
    })

    // Click on Form B to open modal
    await user.click(screen.getByRole('button', { name: 'Open Form B' }))

    // Wait for modal to open and global data to load
    await waitFor(() => {
      expect(screen.getByText('Configure Prefill - Form B')).toBeInTheDocument()
    })

    // Close the modal using the close button
    const closeButton = screen.getByRole('button', { name: 'close' })
    await user.click(closeButton)

    // Check if modal is closed (wait for animation)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('updates prefill configuration when changed', async () => {
    const { user } = render(<FormGraph />)

    // Wait for forms to load
    await waitFor(() => {
      expect(getFormGraph).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Form B')).toBeInTheDocument()
    })

    // Click on Form B
    await user.click(screen.getByText('Form B'))

    // Wait for modal to open and global data to load
    await waitFor(() => {
      expect(screen.getByText('Configure Prefill - Form B')).toBeInTheDocument()
    })

    // Click on Address field
    await user.click(screen.getByText('Address'))

    // Wait for source selection dialog to open
    await waitFor(() => {
      expect(screen.getByText('Select Prefill Source for Address')).toBeInTheDocument()
    })

    // Select a global property
    await user.click(screen.getByText('Global Properties'))
    await waitFor(() => {
      expect(screen.getByText('clientName')).toBeInTheDocument()
    })
    await user.click(screen.getByText('clientName'))

    // Check if the prefill status is updated
    await waitFor(() => {
      expect(screen.getByText(/Prefilled from: clientProperties - clientName/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('handles empty graph gracefully', async () => {
    vi.mocked(getFormGraph).mockResolvedValue({ nodes: [], edges: [] })
    render(<FormGraph />)

    await waitFor(() => {
      expect(getFormGraph).toHaveBeenCalledTimes(1)
    })

    // Should not crash and should render empty state
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
}) 