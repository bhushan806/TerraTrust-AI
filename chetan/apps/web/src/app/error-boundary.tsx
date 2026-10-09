import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled TerraTrust-AI Application Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm space-y-5">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-7 h-7" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold text-neutral-900">Application Error Encountered</h1>
              <p className="text-xs text-neutral-600 leading-relaxed">
                An unhandled rendering fault occurred within this view. Your session credentials and form drafts are protected.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-neutral-100 rounded-lg text-left text-xs font-mono text-neutral-700 max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-800 text-white font-semibold rounded-lg hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application Shell</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
