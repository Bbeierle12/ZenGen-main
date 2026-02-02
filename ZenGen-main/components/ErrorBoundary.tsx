import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React rendering errors.
 * Prevents the entire app from crashing when a component fails.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/50 rounded-xl border border-red-500/30">
          <div className="text-red-400 text-lg font-medium mb-2">
            Something went wrong
          </div>
          <p className="text-slate-400 text-sm mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized error boundary for player components
 * Shows a more prominent error UI with close button
 */
interface PlayerErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
  componentName: string;
}

interface PlayerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PlayerErrorBoundary extends Component<PlayerErrorBoundaryProps, PlayerErrorBoundaryState> {
  constructor(props: PlayerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PlayerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`${this.props.componentName} error:`, error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8">
          <div className="bg-slate-900/80 rounded-2xl border border-red-500/30 p-8 max-w-md text-center">
            <div className="text-red-400 text-xl font-medium mb-3">
              {this.props.componentName} Error
            </div>
            <p className="text-slate-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred while loading this component.'}
            </p>
            <button
              onClick={this.props.onClose}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
