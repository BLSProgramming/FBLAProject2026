import React from 'react';

export default function ImagePreviewModal({ src, alt = 'preview', onClose = () => {} }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-w-4xl w-full rounded overflow-hidden">
        <img src={src} alt={alt} className="w-full h-auto object-contain bg-black rounded" />
      </div>
    </div>
  );
}
