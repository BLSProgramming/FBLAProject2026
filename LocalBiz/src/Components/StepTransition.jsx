import { useEffect, useState } from 'react';

export default function StepTransition({ children, isVisible, direction = 'right' }) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure element is in DOM before animation
      setTimeout(() => {
        setAnimationClass(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
      }, 10);
    } else {
      setAnimationClass(direction === 'right' ? 'slide-out-left' : 'slide-out-right');
      // Wait for animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isVisible, direction]);

  if (!shouldRender) return null;

  return (
    <div className={`transition-transform duration-300 ease-in-out ${animationClass}`}>
      {children}
    </div>
  );
}