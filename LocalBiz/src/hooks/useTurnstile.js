import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/helpers.js';

// Global registry to track all widget instances and prevent conflicts
const widgetRegistry = {
  instances: new Map(), // widgetId -> instance
  rendering: new Set(),  // widgetIds currently rendering
  tokens: new Map(),     // widgetId -> token
  
  // Clean up a specific widget
  cleanup(widgetId) {
    const instance = this.instances.get(widgetId);
    if (instance && window?.turnstile?.remove) {
      try {
        window.turnstile.remove(instance);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    this.instances.delete(widgetId);
    this.rendering.delete(widgetId);
    this.tokens.delete(widgetId);
  },
  
  // Check if widget can render (not already rendered or rendering)
  canRender(widgetId) {
    return !this.instances.has(widgetId) && !this.rendering.has(widgetId);
  }
};

export default function useTurnstile(widgetId, sitekey = '0x4AAAAAAB8H62zRKw1lOJB5') {
  const [turnstileToken, setTurnstileToken] = useState('');
  const [widgetState, setWidgetState] = useState({ rendered: false, hasActiveWidget: false });
  const scriptLoaded = useRef(false);
  const mounted = useRef(true);
  const renderTimeout = useRef(null);

  // Track component mount status
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Capture global turnstile events dispatched by the renderer script
    const handler = (e) => {
      if (!mounted.current) return;
      try {
        const data = e.detail || {};
        const token = typeof data === 'string' ? data : data.token || '';
        const sourceWidgetId = data.widgetId || '';
        
        // Only update if this event is for our widget
        if (sourceWidgetId === widgetId || !sourceWidgetId) {
          setTurnstileToken(token);
          widgetRegistry.tokens.set(widgetId, token);
        }
      } catch (err) {
        // noop
      }
    };
    window.addEventListener('turnstile-token', handler);
    return () => window.removeEventListener('turnstile-token', handler);
  }, [widgetId]);

  
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

  // Render function
  const renderWidget = useCallback(() => {
    if (!mounted.current) return;
    
    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) {
      // Turnstile widget element not found
      return;
    }

    // Check if Turnstile API is available
    if (!window?.turnstile?.render) {
      // Turnstile API not available, retrying
      if (renderTimeout.current) clearTimeout(renderTimeout.current);
      renderTimeout.current = setTimeout(renderWidget, 2000);
      return;
    }

    // Prevent multiple render attempts
    if (!widgetRegistry.canRender(widgetId)) {
      logger.warn(`Widget ${widgetId} already rendered or rendering`);
      return;
    }

    // Attempting to render Turnstile widget
    widgetRegistry.rendering.add(widgetId);

    try {
      // Ensure the container is clean
      widgetElement.innerHTML = '';
      
      const instance = window.turnstile.render(widgetElement, {
        sitekey: sitekey,
        callback: (token) => {
          logger.info(`Turnstile callback for ${widgetId}:`, token ? 'token received' : 'empty token');
          if (mounted.current) {
            const evt = new CustomEvent('turnstile-token', { 
              detail: { token, widgetId } 
            });
            window.dispatchEvent(evt);
            setWidgetState({ rendered: true, hasActiveWidget: true });
          }
        },
        'error-callback': (error) => {
          logger.warn(`Turnstile error for ${widgetId}:`, error);
          widgetRegistry.cleanup(widgetId);
          if (mounted.current) {
            const evt = new CustomEvent('turnstile-token', { 
              detail: { token: '', widgetId } 
            });
            window.dispatchEvent(evt);
            setWidgetState({ rendered: false, hasActiveWidget: false });
          }
        },
        'expired-callback': () => {
          logger.info(`Turnstile expired for ${widgetId}`);
          if (mounted.current) {
            const evt = new CustomEvent('turnstile-token', { 
              detail: { token: '', widgetId } 
            });
            window.dispatchEvent(evt);
          }
        }
      });
      
      // Store the instance
      widgetRegistry.instances.set(widgetId, instance);
      widgetRegistry.rendering.delete(widgetId);
      
      if (mounted.current) {
        setWidgetState({ rendered: true, hasActiveWidget: true });
      }
      
      logger.info(`Turnstile widget rendered successfully: ${widgetId}`);
      
    } catch (e) {
      logger.error(`Turnstile render failed for ${widgetId}:`, e);
      widgetRegistry.rendering.delete(widgetId);
      if (mounted.current) {
        setWidgetState({ rendered: false, hasActiveWidget: false });
      }
    }
  }, [widgetId, sitekey]);

  // Initialize widget
  useEffect(() => {
    // Clear any existing timeout
    if (renderTimeout.current) {
      clearTimeout(renderTimeout.current);
    }

    // Clean up any existing widget first
    widgetRegistry.cleanup(widgetId);
    
    // Delay initial render to prevent conflicts
    renderTimeout.current = setTimeout(renderWidget, 1500);
    
    return () => {
      if (renderTimeout.current) {
        clearTimeout(renderTimeout.current);
      }
      widgetRegistry.cleanup(widgetId);
    };
  }, [widgetId, renderWidget]);

  const reinitializeWidget = useCallback(() => {
    if (!mounted.current) return;
    
    logger.info(`Reinitializing Turnstile widget: ${widgetId}`);
    
    // Clean up existing widget
    widgetRegistry.cleanup(widgetId);
    
    // Reset local state
    setWidgetState({ rendered: false, hasActiveWidget: false });
    setTurnstileToken('');
    
    // Clear any existing timeout
    if (renderTimeout.current) {
      clearTimeout(renderTimeout.current);
    }
    
    // Wait before re-rendering to prevent 300030 error
    renderTimeout.current = setTimeout(() => {
      if (mounted.current) {
        renderWidget();
      }
    }, 3000); // 3 second delay to prevent rapid re-renders
    
  }, [widgetId, renderWidget]);

  return { turnstileToken, setTurnstileToken, widgetRendered: widgetState.rendered, reinitializeWidget };
}