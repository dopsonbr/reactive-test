import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Providers } from './app/providers';
import { logger } from './shared/utils/logger';
import { initWebVitals } from './shared/utils/vitals';
import './styles.css';

// Initialize logger with session context
logger.setContext({
  sessionId: crypto.randomUUID(),
  appVersion: import.meta.env.VITE_APP_VERSION || 'dev',
});

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_MSW_ENABLED === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
  return Promise.resolve();
}

enableMocking().then(() => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <StrictMode>
      <Providers />
    </StrictMode>
  );

  // Initialize Web Vitals after render
  initWebVitals();
});
