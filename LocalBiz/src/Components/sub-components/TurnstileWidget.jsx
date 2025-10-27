export default function TurnstileWidget({ 
  widgetId, 
  turnstileToken, 
  onTokenChange, 
  sitekey = '0x4AAAAAAB8H62zRKw1lOJB5' 
}) {
  return (
    <>
      <div id={widgetId} className="mt-2" />
      {!turnstileToken && (
        <p className="text-yellow-300 text-xs mt-1">
          Verification loading or not completed yet.
        </p>
      )}
    </>
  );
}