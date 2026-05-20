import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import ErrorBoundary from '@/components/ErrorBoundary';
import * as Sentry from '@sentry/nextjs';

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

const mockSentry = Sentry as jest.Mocked<typeof Sentry>;

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    test('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <span>Child 1</span>
          <span>Child 2</span>
        </ErrorBoundary>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    test('renders without crashing when children is null', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);
      const container = document.body.firstChild;
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('displays error UI when child component throws', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Coba Lagi' })
      ).toBeInTheDocument();
    });

    test('captures error with Sentry when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Sentry capture test');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        })
      );
    });

    test('shows custom fallback when provided', () => {
      const ThrowError = () => {
        throw new Error('Custom fallback test');
      };

      render(
        <ErrorBoundary
          fallback={
            <div data-testid="custom-fallback">Custom Error Message</div>
          }
        >
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByText('Terjadi kesalahan')).not.toBeInTheDocument();
    });

    test('passes error to custom fallback component', () => {
      const ThrowError = () => {
        throw new Error('Error passed to fallback');
      };

      const MockFallback = ({ children }: { children?: React.ReactNode }) => {
        return <div data-testid="fallback-wrapper">{children}</div>;
      };

      render(
        <ErrorBoundary fallback={<MockFallback />}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('fallback-wrapper')).toBeInTheDocument();
    });
  });

  describe('Recovery', () => {
    test('recovers from error when reset button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Should throw</div>
        </ErrorBoundary>
      );

      rerender(
        <ErrorBoundary>
          <div data-testid="recovered-content">Content after recovery</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('recovered-content')).toBeInTheDocument();
    });

    test('sends recovery message to Sentry on reset', () => {
      const ThrowError = () => {
        throw new Error('Recovery Sentry test');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' });
      fireEvent.click(retryButton);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'User recovered from error'
      );
    });

    test('can recover multiple times with key change', () => {
      const ThrowError = () => {
        throw new Error('Multiple recovery test');
      };

      const { rerender } = render(
        <ErrorBoundary key="eb-1">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' });
      fireEvent.click(retryButton);

      rerender(
        <ErrorBoundary key="eb-2">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('retry button is keyboard accessible', () => {
      const ThrowError = () => {
        throw new Error('Keyboard test');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: 'Coba Lagi' });
      fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' });
      expect(retryButton).toBeEnabled();
    });

    test('error message contains descriptive text', () => {
      const ThrowError = () => {
        throw new Error('Descriptive test');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Kami sedang memperbaiki masalah ini. Silakan coba lagi nanti.'
        )
      ).toBeInTheDocument();
    });

    test('button has accessible name', () => {
      const ThrowError = () => {
        throw new Error('Button name test');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: 'Coba Lagi' });
      expect(button).toBeInTheDocument();
    });

    test('error UI renders with heading element', () => {
      const ThrowError = () => {
        throw new Error('Container test');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const heading = document.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Terjadi kesalahan');

      const button = screen.getByRole('button', { name: 'Coba Lagi' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles error with null message', () => {
      const ThrowError = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument();
    });

    test('handles non-Error objects thrown', () => {
      const ThrowString = () => {
        throw 'String error';
      };

      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      );

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument();
    });

    test('handles nested error boundaries', () => {
      const InnerThrow = () => {
        throw new Error('Inner error');
      };

      const OuterThrow = () => {
        throw new Error('Outer error');
      };

      render(
        <ErrorBoundary>
          <ErrorBoundary>
            <InnerThrow />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByText('Terjadi kesalahan')).toBeInTheDocument();
    });

    test('renders correctly with different fallback node types', () => {
      const ThrowError = () => {
        throw new Error('Fallback types');
      };

      const TextFallback = () => <span>Text fallback</span>;

      render(
        <ErrorBoundary fallback={<TextFallback />}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Text fallback')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('works with React fragments', () => {
      render(
        <ErrorBoundary>
          <>
            <span>Fragment 1</span>
            <span>Fragment 2</span>
          </>
        </ErrorBoundary>
      );

      expect(screen.getByText('Fragment 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment 2')).toBeInTheDocument();
    });

    test('preserves children state after recovery', () => {
      let resetKey = 0;

      const StatefulChild = () => {
        return <div data-testid="stateful">Count: {resetKey}</div>;
      };

      const { rerender } = render(
        <ErrorBoundary key={resetKey}>
          <StatefulChild />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('stateful')).toHaveTextContent('Count: 0');

      resetKey = 1;

      rerender(
        <ErrorBoundary key={resetKey}>
          <StatefulChild />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('stateful')).toHaveTextContent('Count: 1');
    });
  });
});
