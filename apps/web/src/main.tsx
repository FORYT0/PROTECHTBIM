import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';
import './overflow-fix.css';
import { warmApi } from './utils/api';
import toast, { Toaster } from 'react-hot-toast';

// Silently warm the API on app load so the first user action isn't slow
warmApi();

// Listen for cold-start events from apiRequest and show a toast
window.addEventListener('api:cold-start', (e: Event) => {
  const detail = (e as CustomEvent).detail;
  toast.loading(detail.message || 'API waking up…', {
    id: 'cold-start',
    duration: 45000,
    icon: '🔄',
    style: {
      background: '#0A0A0A',
      color: '#94a3b8',
      border: '1px solid rgba(255,255,255,0.08)',
      fontSize: '13px',
    },
  });
});

// Dismiss cold-start toast once API responds
window.addEventListener('api:warm', () => {
  toast.dismiss('cold-start');
  toast.success('Connected!', { id: 'cold-start-done', duration: 2000 });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
