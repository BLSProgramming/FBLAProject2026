import React from 'react';


export default function ImageGrid({ images = [], onPreview = () => {}, renderActions = null, columnsClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4', itemHeight = 'h-40' }) {
  return (
    <div className={columnsClass}>
      {images.map((img, idx) => (
        <div key={idx} className="relative bg-gray-900 rounded-md overflow-hidden group">
          <button onClick={() => onPreview(img.url)} className={`w-full ${itemHeight} overflow-hidden block`}>
            <img src={img.url} alt={img.alt || `image-${idx}`} className="w-full h-full object-cover transform group-hover:scale-105 transition" />
          </button>

          {img.isPrimary && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded">Primary</div>
          )}

          {typeof renderActions === 'function' && (
            <div className="absolute top-2 right-2 flex gap-2">
              {renderActions(img, idx)}
            </div>
          )}

          {/* Image Text Display */}
          {img.imageText && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-yellow-200 text-xs px-2 py-1 rounded backdrop-blur-sm border border-yellow-300/20">
              <div className="text-center font-medium truncate">
                {img.imageText}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
