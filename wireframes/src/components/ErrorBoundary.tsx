import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#0F1117] p-5 font-['DM_Sans',sans-serif] text-[#E8EAF0]">
          <h1 className="mb-4 text-2xl">Something went wrong</h1>
          <p className="mb-6 text-[#8B90A5]">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-[10px] border-none bg-[#6C5CE7] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
