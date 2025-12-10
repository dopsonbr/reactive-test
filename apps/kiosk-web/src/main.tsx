import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Providers } from './app/providers';
import { logger } from './shared/utils/logger';
import './styles.css';

// Initialize logger with kiosk context
logger.setContext({
  sessionId: crypto.randomUUID(),
  kioskId: import.meta.env.VITE_KIOSK_ID || 'KIOSK-UNKNOWN',
  storeNumber: import.meta.env.VITE_STORE_NUMBER || '0',
  appVersion: import.meta.env.VITE_APP_VERSION || 'dev',
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <Providers />
  </StrictMode>
);