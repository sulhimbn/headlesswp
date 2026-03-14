import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp'

expect.extend(toHaveNoViolations)

describe('KeyboardShortcutsHelp', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders nothing when closed', () => {
    const { container } = render(<KeyboardShortcutsHelp isOpen={false} onClose={mockOnClose} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the modal when open', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Pintasan Keyboard')).toBeInTheDocument()
    expect(screen.getByText('Fokus bilah pencarian')).toBeInTheDocument()
    expect(screen.getByText('Navigasi ke artikel berikutnya')).toBeInTheDocument()
    expect(screen.getByText('Navigasi ke artikel sebelumnya')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByLabelText('Tutup dialog bantuan pintasan keyboard')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the backdrop', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    
    const backdrop = screen.getByText((content, element) => {
      return element?.classList.contains('bg-black/50') ?? false
    })
    fireEvent.click(backdrop)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-shortcuts-title')
  })

  it('renders all keyboard shortcuts', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    
    const shortcuts = [
      'Fokus bilah pencarian',
      'Navigasi ke artikel berikutnya',
      'Navigasi ke artikel sebelumnya',
      'Tampilkan bantuan pintasan keyboard',
      'Tutup modal atau menu',
    ]
    
    shortcuts.forEach(shortcut => {
      expect(screen.getByText(shortcut)).toBeInTheDocument()
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    const results = await axe(container)
    
    expect(results).toHaveNoViolations()
  })

  it('displays keyboard shortcut keys correctly', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByLabelText('Tombol /')).toBeInTheDocument()
    expect(screen.getByLabelText('Tombol j')).toBeInTheDocument()
    expect(screen.getByLabelText('Tombol k')).toBeInTheDocument()
    expect(screen.getByLabelText('Tombol ?')).toBeInTheDocument()
    expect(screen.getByLabelText('Tombol Escape')).toBeInTheDocument()
  })
})
