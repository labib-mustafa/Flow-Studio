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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

