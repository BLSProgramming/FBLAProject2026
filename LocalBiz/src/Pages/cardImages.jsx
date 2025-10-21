import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BusinessCardNavbar from '../Components/businessCardNavbar';
import HoneycombBackground from '../Components/HoneycombBackground';
import ImageGrid from '../Components/ImageGrid';
import ImagePreviewModal from '../Components/ImagePreviewModal';
import useImages from '../hooks/useImages';

export default function CardImages() {
  const { slug } = useParams();
  const [preview, setPreview] = useState(null);
  const { images, loading, error, fetchImages } = useImages({ slug });

  useEffect(() => { fetchImages(); }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-black text-yellow-100 relative">
      <HoneycombBackground />
      <div className="relative z-10">
        <BusinessCardNavbar active="images" slug={slug} />

        <main className="pt-24 max-w-7xl mx-auto px-8 mt-10">
          <div className="bg-black/80 rounded-xl p-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-center">Gallery</h1>
            <p className="text-base md:text-lg text-yellow-300 mb-6 text-center">Images uploaded for this business. Click to preview.</p>

            {loading && <div className="text-yellow-200">Loading images...</div>}
            {error && <div className="text-red-400">{error}</div>}

            {!loading && images.length === 0 && !error && (
              <div className="text-yellow-200">No images uploaded yet.</div>
            )}

            <ImageGrid images={images} onPreview={(url) => setPreview(url)} columnsClass={'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'} itemHeight={'h-72'} />
            <ImagePreviewModal src={preview} onClose={() => setPreview(null)} />
          </div>
        </main>
      </div>
    </div>
  );
}
