import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/actions/locations', () => ({
  getCustomLocations: vi.fn().mockResolvedValue([]),
  addCustomLocation: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/crags', () => ({
  ISRAEL_CRAGS: ['Mt. Arbel', 'Keshet Cave', 'Nahal Amud'],
  ISRAEL_GYMS: ['Climbzone Tel Aviv', 'Vertical Herzliya'],
}))

import { LocationSearch } from '@/components/LocationSearch'
import { getCustomLocations, addCustomLocation } from '@/lib/actions/locations'

function setup(props: Partial<React.ComponentProps<typeof LocationSearch>> = {}) {
  const onChange = vi.fn()
  const utils = render(
    <LocationSearch
      value=""
      onChange={onChange}
      type="crag"
      label="Location"
      {...props}
    />
  )
  return { onChange, ...utils }
}

describe('LocationSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCustomLocations).mockResolvedValue([])
  })

  describe('rendering', () => {
    it('renders the label', () => {
      setup({ label: 'Pick a crag' })
      expect(screen.getByText('Pick a crag')).toBeTruthy()
    })

    it('renders a search input with crag placeholder for type=crag', () => {
      setup({ type: 'crag' })
      expect(screen.getByPlaceholderText('Search crags…')).toBeTruthy()
    })

    it('renders a search input with gym placeholder for type=gym', () => {
      setup({ type: 'gym' })
      expect(screen.getByPlaceholderText('Search gyms…')).toBeTruthy()
    })

    it('shows initial value in the input', () => {
      setup({ value: 'Mt. Arbel' })
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Mt. Arbel')
    })
  })

  describe('dropdown', () => {
    it('shows all crags on focus', async () => {
      setup({ type: 'crag' })
      fireEvent.focus(screen.getByRole('textbox'))
      await waitFor(() => {
        expect(screen.getByText('Mt. Arbel')).toBeTruthy()
        expect(screen.getByText('Keshet Cave')).toBeTruthy()
        expect(screen.getByText('Nahal Amud')).toBeTruthy()
      })
    })

    it('shows only gyms when type=gym', async () => {
      setup({ type: 'gym' })
      fireEvent.focus(screen.getByRole('textbox'))
      await waitFor(() => {
        expect(screen.getByText('Climbzone Tel Aviv')).toBeTruthy()
        expect(screen.getByText('Vertical Herzliya')).toBeTruthy()
        expect(screen.queryByText('Mt. Arbel')).toBeNull()
      })
    })

    it('filters suggestions as user types', async () => {
      setup({ type: 'crag' })
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'keshet' } })
      await waitFor(() => {
        expect(screen.getByText('Keshet Cave')).toBeTruthy()
        expect(screen.queryByText('Mt. Arbel')).toBeNull()
      })
    })

    it('shows "Add" option when query has no exact match', async () => {
      setup({ type: 'crag' })
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Gita' } })
      await waitFor(() => {
        expect(screen.getByText(/Add.*Gita/)).toBeTruthy()
      })
    })

    it('hides "Add" option when query matches an existing entry exactly', async () => {
      setup({ type: 'crag' })
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mt. Arbel' } })
      await waitFor(() => {
        expect(screen.queryByText(/Add/)).toBeNull()
      })
    })

    it('includes community-added locations from DB', async () => {
      vi.mocked(getCustomLocations).mockResolvedValue(['Gita'])
      setup({ type: 'crag' })
      fireEvent.focus(screen.getByRole('textbox'))
      await waitFor(() => {
        expect(screen.getByText('Gita')).toBeTruthy()
      })
    })
  })

  describe('selection', () => {
    it('calls onChange with the selected suggestion', async () => {
      const { onChange } = setup({ type: 'crag' })
      fireEvent.focus(screen.getByRole('textbox'))
      await waitFor(() => screen.getByText('Mt. Arbel'))
      fireEvent.mouseDown(screen.getByText('Mt. Arbel'))
      expect(onChange).toHaveBeenCalledWith('Mt. Arbel')
    })

    it('calls onChange and addCustomLocation when "Add X" is clicked', async () => {
      const { onChange } = setup({ type: 'crag' })
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Gita' } })
      await waitFor(() => screen.getByText(/Add.*Gita/))
      fireEvent.mouseDown(screen.getByText(/Add.*Gita/))
      expect(onChange).toHaveBeenCalledWith('Gita')
      expect(addCustomLocation).toHaveBeenCalledWith('Gita', 'crag')
    })

    it('sets the input value after selecting a suggestion', async () => {
      setup({ type: 'crag' })
      fireEvent.focus(screen.getByRole('textbox'))
      await waitFor(() => screen.getByText('Keshet Cave'))
      fireEvent.mouseDown(screen.getByText('Keshet Cave'))
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Keshet Cave')
    })

    it('closes the dropdown after selecting', async () => {
      setup({ type: 'crag' })
      fireEvent.focus(screen.getByRole('textbox'))
      await waitFor(() => screen.getByText('Mt. Arbel'))
      fireEvent.mouseDown(screen.getByText('Mt. Arbel'))
      expect(screen.queryByText('Keshet Cave')).toBeNull()
    })
  })

  describe('clear button', () => {
    it('resets the input when clicked', async () => {
      const { onChange } = setup({ value: 'Mt. Arbel' })
      const input = screen.getByRole('textbox') as HTMLInputElement
      // Simulate user having typed
      fireEvent.change(input, { target: { value: 'Mt. Arbel' } })
      const clearBtn = screen.getByRole('button')
      fireEvent.mouseDown(clearBtn)
      expect(onChange).toHaveBeenCalledWith('')
      expect(input.value).toBe('')
    })
  })

  describe('keyboard navigation', () => {
    it('closes dropdown on Escape', async () => {
      setup({ type: 'crag' })
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      await waitFor(() => screen.getByText('Mt. Arbel'))
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(screen.queryByText('Mt. Arbel')).toBeNull()
    })

    it('selects highlighted item on Enter', async () => {
      const { onChange } = setup({ type: 'crag' })
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      await waitFor(() => screen.getByText('Mt. Arbel'))
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith('Mt. Arbel')
    })
  })
})
