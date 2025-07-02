import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test-utils'
import PrefillModal from '../PrefillModal'
import { getGlobalData } from '../../api/formApi'
import type { FormNode } from '../../types'

// Mock the API module
vi.mock('../../api/formApi', () => ({
  getGlobalData: vi.fn(),
}))

const mockForm: FormNode = {
  id: 'form-d',
  name: 'Form D',
  dependencies: ['form-b'],
  fields: [
    { 
      id: 'dynamic_checkbox_group',
      name: 'Dynamic Checkbox Group',
      type: 'checkbox-group',
    },
    {
      id: 'dynamic_object',
      name: 'Dynamic Object',
      type: 'object',
    },
    {
      id: 'email',
      name: 'Email',
      type: 'email',
      prefill: {
        sourceType: 'form',
        sourceFormId: 'form-a',
        sourceFieldId: 'email',
      },
    },
  ],
}

const mockForms: FormNode[] = [
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
  mockForm,
]

const mockGlobalData = {
  actionProperties: {
    actionId: '123',
    actionName: 'Test Action',
  },
  clientProperties: {
    clientId: '456',
    clientName: 'Test Client',
  },
}

describe('PrefillModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getGlobalData).mockResolvedValue(mockGlobalData)
  })

  it('renders form fields with their prefill status', async () => {
    const { user } = await render(
      <PrefillModal
        form={mockForm}
        forms={mockForms}
        open={true}
        onClose={() => {}}
      />
    )

    // Wait for global data to load
    await waitFor(() => {
      expect(getGlobalData).toHaveBeenCalled()
    })

    // Check if all fields are displayed
    expect(screen.getByText('Dynamic Checkbox Group')).toBeInTheDocument()
    expect(screen.getByText('Dynamic Object')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()

    // Check prefill status
    expect(screen.getByText(/Type: checkbox-group/)).toBeInTheDocument()
    expect(screen.getByText(/Type: object/)).toBeInTheDocument()
    expect(screen.getByText(/Type: email/)).toBeInTheDocument()
    expect(screen.getByText(/Prefilled from: form-a - email/)).toBeInTheDocument()
  })

  it('opens source selection dialog when clicking unprefilled field', async () => {
    const { user } = await render(
      <PrefillModal
        form={mockForm}
        forms={mockForms}
        open={true}
        onClose={() => {}}
      />
    )

    // Wait for global data to load
    await waitFor(() => {
      expect(getGlobalData).toHaveBeenCalled()
    })

    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByText('Dynamic Checkbox Group')).toBeInTheDocument()
    })

    // Click on unprefilled field
    await user.click(screen.getByText('Dynamic Checkbox Group'))

    // Check if source selection dialog is opened
    expect(screen.getByText('Select Prefill Source for Dynamic Checkbox Group')).toBeInTheDocument()

    // Check if all data source categories are displayed
    expect(screen.getByText('Direct Dependencies')).toBeInTheDocument()
    expect(screen.getByText('Transitive Dependencies')).toBeInTheDocument()
    expect(screen.getByText('Global Properties')).toBeInTheDocument()
  })

  it('shows correct dependencies in source selection', async () => {
    const { user } = await render(
      <PrefillModal
        form={mockForm}
        forms={mockForms}
        open={true}
        onClose={() => {}}
      />
    )

    // Wait for global data to load
    await waitFor(() => {
      expect(getGlobalData).toHaveBeenCalled()
    })

    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByText('Dynamic Checkbox Group')).toBeInTheDocument()
    })

    // Click on unprefilled field
    await user.click(screen.getByText('Dynamic Checkbox Group'))

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Select Prefill Source for Dynamic Checkbox Group')).toBeInTheDocument()
    })

    // Check direct dependencies
    expect(screen.getByText('Form B')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()

    // Check transitive dependencies
    expect(screen.getAllByText('Form A')).toHaveLength(1)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('allows clearing prefill configuration', async () => {
    const onPrefillChange = vi.fn()
    const { user } = await render(
      <PrefillModal
        form={mockForm}
        forms={mockForms}
        open={true}
        onClose={() => {}}
        onPrefillChange={onPrefillChange}
      />
    )

    // Wait for global data to load
    await waitFor(() => {
      expect(getGlobalData).toHaveBeenCalled()
    })

    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    // Find the clear button for the email field
    const clearButton = screen.getByRole('button', {
      name: /clear prefill/i,
    })

    // Click the clear button
    await user.click(clearButton)

    // Check if onPrefillChange was called with correct arguments
    expect(onPrefillChange).toHaveBeenCalledWith('email', null)
  })

  it('selects a prefill source from direct dependencies', async () => {
    const onPrefillChange = vi.fn()
    const { user } = await render(
      <PrefillModal
        form={mockForm}
        forms={mockForms}
        open={true}
        onClose={() => {}}
        onPrefillChange={onPrefillChange}
      />
    )

    // Wait for global data to load
    await waitFor(() => {
      expect(getGlobalData).toHaveBeenCalled()
    })

    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByText('Dynamic Checkbox Group')).toBeInTheDocument()
    })

    // Click on unprefilled field
    await user.click(screen.getByText('Dynamic Checkbox Group'))

    // Wait for source selection dialog to open
    await waitFor(() => {
      expect(screen.getByText('Select Prefill Source for Dynamic Checkbox Group')).toBeInTheDocument()
    })

    // Wait for direct dependencies to be displayed
    await waitFor(() => {
      expect(screen.getByText('Form B')).toBeInTheDocument()
      expect(screen.getByText('Address')).toBeInTheDocument()
    })

    // Select a field from Form B
    await user.click(screen.getByText('Address'))

    // Check if onPrefillChange was called with correct arguments
    expect(onPrefillChange).toHaveBeenCalledWith('dynamic_checkbox_group', {
      sourceType: 'form',
      sourceFormId: 'form-b',
      sourceFieldId: 'address',
    })
  })

  it('selects a prefill source from global properties', async () => {
    const onPrefillChange = vi.fn()
    const { user } = await render(
      <PrefillModal
        form={mockForm}
        forms={mockForms}
        open={true}
        onClose={() => {}}
        onPrefillChange={onPrefillChange}
      />
    )

    // Wait for global data to load
    await waitFor(() => {
      expect(getGlobalData).toHaveBeenCalled()
    })

    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByText('Dynamic Checkbox Group')).toBeInTheDocument()
    })

    // Click on unprefilled field
    await user.click(screen.getByText('Dynamic Checkbox Group'))

    // Wait for source selection dialog to open
    await waitFor(() => {
      expect(screen.getByText('Select Prefill Source for Dynamic Checkbox Group')).toBeInTheDocument()
    })

    // Wait for Global Properties to be displayed
    await waitFor(() => {
      expect(screen.getByText('Global Properties')).toBeInTheDocument()
    })

    // Wait for global properties to be displayed
    await waitFor(() => {
      expect(screen.getByText('clientName')).toBeInTheDocument()
    })

    // Select a global property
    await user.click(screen.getByText('clientName'))

    // Check if onPrefillChange was called with correct arguments
    expect(onPrefillChange).toHaveBeenCalledWith('dynamic_checkbox_group', {
      sourceType: 'global',
      sourceFormId: 'clientProperties',
      sourceFieldId: 'clientName',
    })
  })
}) 