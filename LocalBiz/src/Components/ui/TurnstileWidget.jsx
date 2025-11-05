import { useEffect, useRef, useState } from 'react';
import useTurnstile from '../../hooks/useTurnstile';
import { logger } from '../../utils/helpers';

export default function TurnstileWidget({ 
  widgetId, 
  turnstileToken, 
  onTokenChange, 
  sitekey = '0x4AAAAAAB8H62zRKw1lOJB5' 
}) {
  const { turnstileToken: hookToken, widgetRendered, reinitializeWidget } = useTurnstile(widgetId, sitekey);
  const containerRef = useRef(null);
  const [showRetry, setShowRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Pass token changes up to parent
  useEffect(() => {
    if (onTokenChange && hookToken !== turnstileToken) {
      onTokenChange(hookToken);
    }
  }, [hookToken, turnstileToken, onTokenChange]);

  // Show retry button if widget fails to render after some time
  useEffect(() => {
    if (!hookToken && widgetRendered) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 15000); // Show retry after 15 seconds (increased from 10)
      
      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [hookToken, widgetRendered]);

  const handleRetry = () => {
    if (retryCount >= 2) { // Reduced to 2 attempts to prevent abuse
      logger.warn('Max retry attempts reached for Turnstile widget');
      return;
    }
    
    logger.info(`Manual retry attempt ${retryCount + 1} for widget: ${widgetId}`);
    setRetryCount(prev => prev + 1);
    setShowRetry(false);
    
    // Add a small delay before retry to ensure cleanup is complete
    setTimeout(() => {
      reinitializeWidget();
    }, 1000);
  };

  return (
    <div className="turnstile-container">
      <div 
        id={widgetId} 
        ref={containerRef}
        className="mt-2 min-h-[65px] flex items-center justify-center"
        style={{ minHeight: '65px' }}
      />
      {!hookToken && !widgetRendered && (
        <p className="text-yellow-300 text-xs mt-1">
          Loading verification widget...
        </p>
      )}
      {!hookToken && widgetRendered && !showRetry && (
        <p className="text-yellow-300 text-xs mt-1">
          Please complete the verification above.
        </p>
      )}
      {showRetry && retryCount < 2 && (
        <div className="mt-2">
          <p className="text-yellow-300 text-xs mb-2">
            Having trouble with verification?
          </p>
          <button
            onClick={handleRetry}
            className="text-xs bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-300 transition-colors"
          >
            Try Again ({retryCount}/2)
          </button>
        </div>
      )}
      {retryCount >= 2 && (
        <div className="mt-2">
          <p className="text-red-400 text-xs mb-2">
            Verification temporarily unavailable.
          </p>
          <p className="text-yellow-300 text-xs">
            Please refresh the page and try again.
          </p>
        </div>
      )}
    </div>
  );
}