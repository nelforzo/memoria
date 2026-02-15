import './styles.css'
import { createApp } from './App.js'

createApp(document.getElementById('app'))

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/memoria/sw.js', { scope: '/memoria/' })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
