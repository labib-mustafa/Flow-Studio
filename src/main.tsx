import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence benign ResizeObserver loop limit exceeded errors
const resizeObserverLoopErrRe = /^[a-zA-Z0-9\s]*ResizeObserver loop limit exceeded/;
window.addEventListener('error', (e) => {
  if (resizeObserverLoopErrRe.test(e.message) || e.message === 'ResizeObserver loop limit exceeded' || e.message === 'Uncaught') {
    e.stopImmediatePropagation();
  }
});

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = REQUIRED_VARS.filter((v) => !import.meta.env[v]);

if (missingVars.length > 0) {
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; font-family: system-ui; background: #fee2e2; color: #991b1b; min-height: 100vh;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Startup Error</h1>
      <p>The application cannot start because the following required environment variables are missing:</p>
      <ul style="margin-top: 10px; font-weight: bold;">
        ${missingVars.map(v => `<li>${v}</li>`).join('')}
      </ul>
      <p style="margin-top: 16px; font-size: 14px; opacity: 0.8;">Check your .env file or environment configuration.</p>
    </div>
  `;
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

