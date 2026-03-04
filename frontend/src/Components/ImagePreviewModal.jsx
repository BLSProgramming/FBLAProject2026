import React, { useEffect, useRef, useCallback, useState } from 'react';
import { HiXMark, HiArrowsPointingOut, HiArrowsPointingIn, HiArrowDownTray } from 'react-icons/hi2';

export default function ImagePreviewModal({ src, alt = 'preview', onClose = () => {} }) {
  const dialogRef = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleClose = useCallback(() => {
    setZoomed(false);
    setImgLoaded(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!src) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [src, handleClose]);

  // Reset state when src changes
  useEffect(() => {
    setZoomed(false);
    setImgLoaded(false);
  }, [src]);

  if (!src) return null;

  const handleDownload = async () => {
    try {
      const res = await fetch(src, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = src.split('/').pop() || 'image';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={handleClose}
    >
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10"
        >
          {zoomed ? <HiArrowsPointingIn className="w-5 h-5" /> : <HiArrowsPointingOut className="w-5 h-5" />}
        </button>
        <button
          onClick={handleDownload}
          aria-label="Download image"
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10"
        >
          <HiArrowDownTray className="w-5 h-5" />
        </button>
        <button
          onClick={handleClose}
          aria-label="Close preview"
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-600/80 transition-colors border border-white/10"
        >
          <HiXMark className="w-5 h-5" />
        </button>
      </div>

      {/* Image container */}
      <div
        className={`relative transition-all duration-300 ease-out ${zoomed ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl max-h-[85vh]'} w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
          </div>
        )}

        <img
          src={src}
          alt={alt}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl transition-all duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          } ${zoomed ? 'max-h-[95vh] cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setZoomed((z) => !z)}
        />
      </div>

      {/* Hint text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none select-none">
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">Esc</kbd> to close
      </div>
    </div>
  );
}
