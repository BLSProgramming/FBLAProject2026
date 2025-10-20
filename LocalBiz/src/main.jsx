import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOMServer from 'react-dom/server'
import { FaForumbee } from 'react-icons/fa'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'


try {
  if (typeof document !== 'undefined') {
    let svg = ReactDOMServer.renderToStaticMarkup(
      <FaForumbee size={64} />
    );
    if (!/xmlns=/.test(svg)) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    const href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
} catch (e) {

}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '768300599069-4dtqhnkvk5sgcqbkej7gdl2c342m05fr.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
