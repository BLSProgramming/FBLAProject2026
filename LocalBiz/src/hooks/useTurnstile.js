import { useState, useEffect, useRef } from 'react';

export default function useTurnstile(widgetId, sitekey = '0x4AAAAAAB8H62zRKw1lOJB5') {
  const [turnstileToken, setTurnstileToken] = useState('');
  const [widgetState, setWidgetState] = useState({ rendered: false, hasActiveWidget: false });
  const renderAttempted = useRef(false);
  const widgetIdRef = useRef(null);
  const scriptLoaded = useRef(false);

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

  
  useEffect(() => {
    if (typeof window !== 'undefined' && !scriptLoaded.current) {
      const existingScript = document.getElementById('cf-turnstile-script');
      
      if (!existingScript) {
        const s = document.createElement('script');
        s.id = 'cf-turnstile-script';
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true;
        s.onload = () => {
          scriptLoaded.current = true;
        };
        document.head.appendChild(s);
      } else {
        scriptLoaded.current = true;
      }
    }
  }, []);

  // Initialize Cloudflare Turnstile widget - STABLE VERSION
  useEffect(() => {
    // Prevent re-rendering if already attempted for this widget
    if (renderAttempted.current && widgetIdRef.current === widgetId) {
      return;
    }

    const attemptRender = () => {
      const widgetElement = document.getElementById(widgetId);
      if (!widgetElement) return;

      // Check if Turnstile is available
      if (!window?.turnstile?.render) {
        // Wait and retry if Turnstile isn't ready yet
        setTimeout(attemptRender, 1000);
        return;
      }

      try {
        // Clear existing widget if any
        widgetElement.innerHTML = '';
        
        const widgetInstance = window.turnstile.render(widgetElement, {
          sitekey: sitekey,
          callback: (token) => {
            const evt = new CustomEvent('turnstile-token', { detail: token });
            window.dispatchEvent(evt);
            setWidgetState({ rendered: true, hasActiveWidget: true });
          },
          'error-callback': (error) => {
            console.warn('Turnstile error:', error);
            const evt = new CustomEvent('turnstile-token', { detail: '' });
            window.dispatchEvent(evt);
          },
          'expired-callback': () => {
            const evt = new CustomEvent('turnstile-token', { detail: '' });
            window.dispatchEvent(evt);
          }
        });
        
        renderAttempted.current = true;
        widgetIdRef.current = widgetId;
        setWidgetState({ rendered: true, hasActiveWidget: true });
        
      } catch (e) {
        console.warn('Turnstile render failed:', e);
      }
    };

    // Start rendering attempt after a short delay
    const timeout = setTimeout(attemptRender, 500);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [widgetId, sitekey]);

  const reinitializeWidget = () => {
    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement || !window?.turnstile) return;
    
    try {
      // Reset state
      renderAttempted.current = false;
      widgetIdRef.current = null;
      setWidgetState({ rendered: false, hasActiveWidget: false });
      setTurnstileToken('');
      
      // Clear and re-render
      widgetElement.innerHTML = '';
      
      setTimeout(() => {
        if (window?.turnstile?.render) {
          try {
            window.turnstile.render(widgetElement, {
              sitekey: sitekey,
              callback: (token) => {
                const evt = new CustomEvent('turnstile-token', { detail: token });
                window.dispatchEvent(evt);
                setWidgetState({ rendered: true, hasActiveWidget: true });
              },
              'error-callback': (error) => {
                console.warn('Turnstile reinit error:', error);
                const evt = new CustomEvent('turnstile-token', { detail: '' });
                window.dispatchEvent(evt);
              },
              'expired-callback': () => {
                const evt = new CustomEvent('turnstile-token', { detail: '' });
                window.dispatchEvent(evt);
              }
            });
            renderAttempted.current = true;
            widgetIdRef.current = widgetId;
          } catch (e) {
            console.warn('Turnstile reinit failed:', e);
          }
        }
      }, 300);
    } catch (e) {
      console.warn('Reinitialize widget failed:', e);
    }
  };

  return { turnstileToken, setTurnstileToken, widgetRendered: widgetState.rendered, reinitializeWidget };
}