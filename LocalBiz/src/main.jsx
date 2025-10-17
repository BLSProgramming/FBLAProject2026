import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOMServer from 'react-dom/server'
import { FaForumbee } from 'react-icons/fa'
import './index.css'
import App from './App.jsx'

// Create a data URL favicon from the FaForumbee react-icon so the site uses
// the same icon across pages (dev HMR won't swap it out permanently).
try {
  if (typeof document !== 'undefined') {
    let svg = ReactDOMServer.renderToStaticMarkup(
      // render a 64px icon; react-icons outputs an <svg> element
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
  // ignore errors in non-browser envs
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
