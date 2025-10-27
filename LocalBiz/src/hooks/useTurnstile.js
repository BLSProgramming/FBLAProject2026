import { useState, useEffect, useRef } from 'react';

export default function useTurnstile(widgetId, sitekey = '0x4AAAAAAB8H62zRKw1lOJB5') {
  const [turnstileToken, setTurnstileToken] = useState('');
  const [widgetState, setWidgetState] = useState({ rendered: false, hasActiveWidget: false });
  const renderAttempted = useRef(false);

  useEffect(() => {
    // Capture global turnstile events dispatched by the renderer script
    const handler = (e) => {
      try {
        const t = e.detail || '';
        setTurnstileToken(t);
      } catch (err) {
        // noop
      }
    };
    window.addEventListener('turnstile-token', handler);
    return () => window.removeEventListener('turnstile-token', handler);
  }, []);

  // Load the Turnstile script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.document.getElementById('cf-turnstile-script')) {
      const s = document.createElement('script');
      s.id = 'cf-turnstile-script';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  // Initialize Cloudflare Turnstile widget - PRODUCTION VERSION
  useEffect(() => {
    const attemptRender = () => {
      if (renderAttempted.current) return;
      
      const widgetElement = document.getElementById(widgetId);
      if (!widgetElement || !window?.turnstile) return;

      try {
        window.turnstile.render(`#${widgetId}`, {
          sitekey: sitekey,
          callback: (token) => {
            const evt = new CustomEvent('turnstile-token', { detail: token });
            window.dispatchEvent(evt);
            setWidgetState({ rendered: true, hasActiveWidget: true });
          },
          'error-callback': () => {
            const evt = new CustomEvent('turnstile-token', { detail: '' });
            window.dispatchEvent(evt);
          },
          'expired-callback': () => {
            const evt = new CustomEvent('turnstile-token', { detail: '' });
            window.dispatchEvent(evt);
          }
        });
        renderAttempted.current = true;
      } catch (e) {
        // Turnstile render failed - silently handle
      }
    };

    // Try after a delay to ensure DOM and script are ready
    const timeout = setTimeout(attemptRender, 1000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [widgetId, sitekey]);

  const reinitializeWidget = () => {
    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return;
    
    // Clear the element and reset state
    widgetElement.innerHTML = '';
    renderAttempted.current = false;
    setWidgetState({ rendered: false, hasActiveWidget: false });
    setTurnstileToken('');
    
    // Try to render after ensuring script is loaded
    const attemptReinit = () => {
      if (renderAttempted.current || !window?.turnstile) return;
      
      try {
        window.turnstile.render(`#${widgetId}`, {
          sitekey: sitekey,
          callback: (token) => {
            const evt = new CustomEvent('turnstile-token', { detail: token });
            window.dispatchEvent(evt);
            setWidgetState({ rendered: true, hasActiveWidget: true });
          },
          'error-callback': () => {
            const evt = new CustomEvent('turnstile-token', { detail: '' });
            window.dispatchEvent(evt);
            setWidgetState({ rendered: false, hasActiveWidget: false });
          },
          'expired-callback': () => {
            const evt = new CustomEvent('turnstile-token', { detail: '' });
            window.dispatchEvent(evt);
            setWidgetState({ rendered: false, hasActiveWidget: false });
          }
        });
        renderAttempted.current = true;
      } catch (e) {
        // Retry after a delay if it failed
        setTimeout(attemptReinit, 1000);
      }
    };
    
    setTimeout(attemptReinit, 300);
  };

  return { turnstileToken, setTurnstileToken, widgetRendered: widgetState.rendered, reinitializeWidget };
}