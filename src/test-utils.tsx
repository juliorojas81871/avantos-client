import type { ReactElement } from 'react'
import { render as rtlRender } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Add any providers here
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
    </>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const user = userEvent.setup()
  const result = rtlRender(ui, {
    wrapper: AllTheProviders,
    ...options,
  })

  return {
    user,
    ...result,
  }
}

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render } 