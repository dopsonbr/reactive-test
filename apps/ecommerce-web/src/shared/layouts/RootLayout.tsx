import { Outlet } from '@tanstack/react-router';
import { Header } from './Header';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { logger } from '../utils/logger';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            logger.error('Component error caught by boundary', error, {
              componentStack: errorInfo.componentStack,
            });
          }}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
