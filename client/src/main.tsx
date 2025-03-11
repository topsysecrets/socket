import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';
import { SocketProvider } from './contexts/socketContext.js';
import socket from './utils/socket.js';
import { ErrorBoundary } from 'react-error-boundary';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallbackRender={fallbackRender}>
    <SocketProvider socket={socket}>
      <Suspense fallback="Loading...">
        <App />
      </Suspense>
    </SocketProvider>
  </ErrorBoundary>
);

function fallbackRender({ error, resetErrorBoundary }: any) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  );
}
