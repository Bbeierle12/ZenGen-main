import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, PlayerErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Content rendered successfully</div>;
};

// Component that throws a custom error
const CustomErrorComponent = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should not show error UI', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display the error message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should call onError callback with error and errorInfo', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should display Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('should reset state when Try Again is clicked', () => {
      let shouldThrow = true;

      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Error');
        }
        return <div>Recovered successfully</div>;
      };

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Error state
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      // Should re-render children
      expect(screen.getByText('Recovered successfully')).toBeInTheDocument();
    });

    it('should handle errors without message', () => {
      const NoMessageError = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <NoMessageError />
        </ErrorBoundary>
      );

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  describe('getDerivedStateFromError', () => {
    it('should set hasError to true', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // If we see the error UI, hasError must be true
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});

describe('PlayerErrorBoundary', () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  const defaultProps = {
    onClose: vi.fn(),
    componentName: 'SessionPlayer',
  };

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      render(
        <PlayerErrorBoundary {...defaultProps}>
          <div>Player content</div>
        </PlayerErrorBoundary>
      );

      expect(screen.getByText('Player content')).toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    it('should catch errors and display player error UI', () => {
      render(
        <PlayerErrorBoundary {...defaultProps}>
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      expect(screen.getByText('SessionPlayer Error')).toBeInTheDocument();
    });

    it('should display the component name in the error', () => {
      render(
        <PlayerErrorBoundary {...defaultProps} componentName="BreathingPlayer">
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      expect(screen.getByText('BreathingPlayer Error')).toBeInTheDocument();
    });

    it('should display the error message', () => {
      render(
        <PlayerErrorBoundary {...defaultProps}>
          <CustomErrorComponent message="Player failed to load" />
        </PlayerErrorBoundary>
      );

      expect(screen.getByText('Player failed to load')).toBeInTheDocument();
    });

    it('should display Close button', () => {
      render(
        <PlayerErrorBoundary {...defaultProps}>
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should call onClose when Close button is clicked', () => {
      const onClose = vi.fn();

      render(
        <PlayerErrorBoundary {...defaultProps} onClose={onClose}>
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('should render full-screen overlay', () => {
      const { container } = render(
        <PlayerErrorBoundary {...defaultProps}>
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      const overlay = container.firstChild;
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50');
    });

    it('should handle errors without message', () => {
      const NoMessageError = () => {
        throw new Error();
      };

      render(
        <PlayerErrorBoundary {...defaultProps}>
          <NoMessageError />
        </PlayerErrorBoundary>
      );

      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
    });

    it('should log error with component name', () => {
      render(
        <PlayerErrorBoundary {...defaultProps} componentName="TestComponent">
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'TestComponent error:',
        expect.any(Error),
        expect.anything()
      );
    });
  });

  describe('styling', () => {
    it('should have dark background', () => {
      const { container } = render(
        <PlayerErrorBoundary {...defaultProps}>
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      const overlay = container.firstChild;
      expect(overlay).toHaveClass('bg-slate-950');
    });

    it('should have red-themed error card', () => {
      const { container } = render(
        <PlayerErrorBoundary {...defaultProps}>
          <ThrowingComponent />
        </PlayerErrorBoundary>
      );

      const errorCard = container.querySelector('.border-red-500\\/30');
      expect(errorCard).toBeInTheDocument();
    });
  });
});
