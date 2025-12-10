import { Header } from './components/Header';
import { AppCard } from './components/AppCard';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { applications, Application } from './types';

export default function App() {
  const { toasts, showToast, dismissToast } = useToast();

  const handleNavigate = (app: Application) => {
    if (app.status === 'active') {
      // Navigate to the application URL in the same tab
      window.location.href = app.url;
    } else {
      // Show "coming soon" toast
      showToast(`${app.title} is coming soon!`, 'info');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-foreground">
              Welcome to Reactive Platform
            </h2>
            <p className="text-muted-foreground">
              Select an application to get started
            </p>
          </div>

          {/* Application Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {applications.map((app) => (
              <AppCard
                key={app.id}
                application={app}
                onNavigate={handleNavigate}
              />
            ))}
          </div>

          {/* Footer */}
          <footer className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>
              Reactive Platform &copy; {new Date().getFullYear()} - A modern
              microservices architecture
            </p>
            <p className="mt-2">
              Built with React, TypeScript, Spring WebFlux, and Nx
            </p>
          </footer>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
