import { render, screen, fireEvent, act } from '@testing-library/react'
import SocialShare from '@/components/ui/SocialShare'

const mockOpen = jest.fn()
const mockWriteText = jest.fn()
const mockExecCommand = jest.fn()

jest.mock('@/lib/api/config', () => ({
  SITE_URL: 'https://mitrabantennews.com',
}))

Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
})

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
})

Object.defineProperty(document, 'execCommand', {
  value: mockExecCommand,
  writable: true,
})

describe('SocialShare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteText.mockResolvedValue(undefined)
    mockExecCommand.mockReturnValue(undefined)
  })

  test('renders social share buttons', () => {
    render(<SocialShare title="Test" url="/test" />)
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  test('renders Facebook button', () => {
    render(<SocialShare title="Test" url="/test" />)
    expect(screen.getByRole('button', { name: 'Bagikan ke Facebook' })).toBeInTheDocument()
  })

  test('renders Twitter button', () => {
    render(<SocialShare title="Test" url="/test" />)
    expect(screen.getByRole('button', { name: 'Bagikan ke Twitter' })).toBeInTheDocument()
  })

  test('renders WhatsApp button', () => {
    render(<SocialShare title="Test" url="/test" />)
    expect(screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })).toBeInTheDocument()
  })

  test('renders copy link button', () => {
    render(<SocialShare title="Test" url="/test" />)
    expect(screen.getByRole('button', { name: 'Salin tautan' })).toBeInTheDocument()
  })

  test('opens Facebook share dialog', () => {
    render(<SocialShare title="Test Title" url="/test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Bagikan ke Facebook' }))
    expect(mockOpen).toHaveBeenCalled()
  })

  test('opens Twitter share dialog', () => {
    render(<SocialShare title="Test Title" url="/test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Bagikan ke Twitter' }))
    expect(mockOpen).toHaveBeenCalled()
  })

  test('opens WhatsApp share dialog', () => {
    render(<SocialShare title="Test Title" url="/test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Bagikan ke WhatsApp' }))
    expect(mockOpen).toHaveBeenCalled()
  })

  test('copies URL to clipboard', async () => {
    render(<SocialShare title="Test" url="/test" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salin tautan' }))
    })
    expect(mockWriteText).toHaveBeenCalledWith('https://mitrabantennews.com/test')
  })

  test('shows check icon after copy', async () => {
    render(<SocialShare title="Test" url="/test" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salin tautan' }))
    })
    expect(screen.getByRole('button', { name: 'Tautan disalin' })).toBeInTheDocument()
  })

  test('buttons have aria-labels', () => {
    render(<SocialShare title="Test" url="/test" />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label')
    })
  })
})
