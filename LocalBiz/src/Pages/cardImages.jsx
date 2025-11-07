import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import BusinessCardNavbar from '../Components/BusinessCardNavbar';
import HoneycombBackground from '../Components/HoneycombBackground';
import PageTransition from '../Components/PageTransition';
import ImageGrid from '../Components/ImageGrid';
import ImagePreviewModal from '../Components/ImagePreviewModal';
import useImages from '../hooks/useImages';
import { 
  HiPhoto, 
  HiArrowPath,
  HiExclamationTriangle,
  HiEye,
  HiStar,
  HiSquares2X2,
  HiListBullet
} from 'react-icons/hi2';

export default function CardImages() {
  const { slug } = useParams();
  const [preview, setPreview] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'masonry'
  const { images, loading, error, fetchImages } = useImages({ slug });

  useEffect(() => { fetchImages(); }, [slug]);

  // Separate primary image
  const primaryImage = images.find(img => img.isPrimary);
  const otherImages = images.filter(img => !img.isPrimary);

  // Image statistics
  const imageStats = useMemo(() => ({
    total: images.length,
    primary: primaryImage ? 1 : 0,
    gallery: otherImages.length
  }), [images.length, primaryImage, otherImages.length]);

  return (
    <div className="min-h-screen text-yellow-100 relative">
      {/* Background layer that covers full viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-black z-0"></div>
      <HoneycombBackground opacity={0.12} />
      <div className="relative z-10">
        <BusinessCardNavbar active="images" slug={slug} />

        <PageTransition>
          <main className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/90 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header Section */}
            <div className="p-8 border-b border-yellow-400/20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-yellow-400 flex items-center gap-3">
                    <HiPhoto className="w-8 h-8" />
                    Business Gallery
                  </h1>
                  <p className="text-lg text-yellow-300">
                    Explore our visual showcase • {imageStats.total} image{imageStats.total !== 1 ? 's' : ''} available
                    {primaryImage && ` • 1 featured`}
                  </p>
                </div>

                {/* View Mode Toggle */}
                {images.length > 0 && (
                  <div className="flex items-center bg-black/60 rounded-lg p-1 border border-gray-600">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-yellow-400 text-black' 
                          : 'text-gray-400 hover:text-yellow-300'
                      }`}
                      title="Grid view"
                    >
                      <HiSquares2X2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('masonry')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'masonry' 
                          ? 'bg-yellow-400 text-black' 
                          : 'text-gray-400 hover:text-yellow-300'
                      }`}
                      title="Masonry view"
                    >
                      <HiListBullet className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
              
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <HiArrowPath className="w-12 h-12 text-yellow-400 animate-spin mb-4" />
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">Loading Gallery</h3>
                  <p className="text-gray-400">Fetching beautiful images...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-20">
                  <HiExclamationTriangle className="w-12 h-12 text-red-400 mb-4" />
                  <h3 className="text-xl font-semibold text-red-300 mb-2">Unable to Load Images</h3>
                  <p className="text-gray-400 mb-6">{error}</p>
                  <button 
                    onClick={fetchImages}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                  >
                    <HiArrowPath className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && images.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-20">
                  <HiPhoto className="w-20 h-20 text-gray-600 mb-6" />
                  <h3 className="text-2xl font-bold text-gray-400 mb-2">No Images Yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    This business hasn't uploaded any images to their gallery yet. 
                    Check back later to see their visual showcase!
                  </p>
                </div>
              )}

              {/* Primary Image Showcase */}
              {!loading && primaryImage && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-4">
                    <HiStar className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-yellow-300">Featured Image</h2>
                  </div>
                  <div 
                    className="relative group cursor-pointer rounded-xl overflow-hidden shadow-2xl max-w-2xl"
                    onClick={() => setPreview(primaryImage.url)}
                  >
                    <img
                      src={primaryImage.url}
                      alt={primaryImage.altText || "Featured business image"}
                      className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/80 rounded-full p-4">
                          <HiEye className="w-8 h-8 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary Image Text Display */}
                    {primaryImage.imageText && (
                      <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-yellow-200 text-sm px-3 py-2 rounded-lg backdrop-blur-sm border border-yellow-300/20">
                        <div className="text-center font-medium">
                          {primaryImage.imageText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              {!loading && otherImages.length > 0 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                      <HiPhoto className="w-6 h-6" />
                      Gallery Collection
                    </h2>
                  </div>

                  <ImageGrid 
                    images={otherImages.map(img => ({ ...img, imageText: img.imageText || '' }))} 
                    onPreview={(url) => setPreview(url)} 
                    columnsClass={
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
                    }
                    itemHeight={viewMode === 'grid' ? 'h-64' : 'h-auto'}
                  />
                </div>
              )}

            </div>
          </div>
          </main>
        </PageTransition>
      </div>

      <ImagePreviewModal src={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
