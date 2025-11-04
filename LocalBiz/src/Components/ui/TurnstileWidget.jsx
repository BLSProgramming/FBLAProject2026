import { useEffect, useRef } from 'react';
import useTurnstile from '../../hooks/useTurnstile';

export default function TurnstileWidget({ 
  widgetId, 
  turnstileToken, 
  onTokenChange, 
  sitekey = '0x4AAAAAAB8H62zRKw1lOJB5' 
}) {
  const { turnstileToken: hookToken, widgetRendered } = useTurnstile(widgetId, sitekey);
  const containerRef = useRef(null);

  // Pass token changes up to parent
  useEffect(() => {
    if (onTokenChange && hookToken !== turnstileToken) {
      onTokenChange(hookToken);
    }
  }, [hookToken, turnstileToken, onTokenChange]);

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
      {!hookToken && widgetRendered && (
        <p className="text-yellow-300 text-xs mt-1">
          Please complete the verification above.
        </p>
      )}
    </div>
  );
}