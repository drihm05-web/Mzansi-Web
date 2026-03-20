import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          message = "You don't have permission to perform this action or view this data.";
        }
      } catch {
        // Not JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-zinc-200">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Application Error</h2>
            <p className="text-zinc-600 mb-6">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
