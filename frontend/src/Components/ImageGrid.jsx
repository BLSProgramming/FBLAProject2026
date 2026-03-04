import React, { useState } from 'react';
import { HiEye, HiStar } from 'react-icons/hi2';

export default function ImageGrid({
  images = [],
  onPreview = () => {},
  renderActions = null,
  columnsClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
  itemHeight = 'h-40',
}) {
  const [failedSrcs, setFailedSrcs] = useState(new Set());

  const handleError = (url) => {
    setFailedSrcs((prev) => new Set(prev).add(url));
  };

  if (images.length === 0) return null;

  const hasActions = typeof renderActions === 'function';

  return (
    <div className={columnsClass}>
      {images.map((img, idx) => {
        const isBroken = failedSrcs.has(img.url);
        return (
          <div
            key={img.url || idx}
            className="flex flex-col bg-gray-900 rounded-2xl overflow-hidden group border border-white/5 hover:border-yellow-400/20 transition-colors shadow-lg"
          >
            {/* Image area */}
            <div className="relative">
              <button
                onClick={() => !isBroken && onPreview(img.url)}
                className={`w-full ${itemHeight} overflow-hidden block focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 focus-visible:ring-inset`}
                aria-label={img.alt || `View image ${idx + 1}`}
              >
                {isBroken ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-sm">
                    Failed to load
                  </div>
                ) : (
                  <img
                    src={img.url}
                    alt={img.alt || `image-${idx + 1}`}
                    loading="lazy"
                    onError={() => handleError(img.url)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                {/* Hover overlay */}
                {!isBroken && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-sm rounded-full p-3">
                      <HiEye className="w-5 h-5 text-yellow-400" />
                    </div>
                  </div>
                )}
              </button>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-yellow-400 text-black text-xs font-semibold px-2.5 py-1 rounded-lg shadow-lg shadow-yellow-400/30 z-10">
                  <HiStar className="w-3.5 h-3.5" />
                  Primary
                </div>
              )}

              {/* Image text overlay */}
              {img.imageText && (
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-md text-yellow-200 text-xs px-3 py-1.5 rounded-lg border border-yellow-400/15 z-10">
                  <p className="text-center font-medium truncate">{img.imageText}</p>
                </div>
              )}
            </div>

            {/* Actions — rendered below the image, outside the image area */}
            {hasActions && (
              <div className="px-3 py-3 bg-gray-900 border-t border-white/5">
                {renderActions(img, idx)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
