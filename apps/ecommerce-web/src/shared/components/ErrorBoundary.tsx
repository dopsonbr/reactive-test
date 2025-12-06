import { Component, ReactNode } from 'react';
import { ErrorCard } from './ErrorCard';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.reset) || (
          <div className="container mx-auto p-8">
            <ErrorCard error={this.state.error} onRetry={this.reset} />
          </div>
        )
      );
    }
    return this.props.children;
  }
}
