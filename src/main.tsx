import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for full offline capability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New update available');
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for offline use');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
