import React, { useState, useEffect, useRef } from 'react';
import ManageBusinessNavbar from '../Components/manageBusinessNavbar';
import HoneycombBackground from '../Components/HoneycombBackground';
import ImageGrid from '../Components/ImageGrid';
import ImagePreviewModal from '../Components/ImagePreviewModal';
import useImages from '../hooks/useImages';
import { HiArrowSmallLeft, HiArrowSmallRight } from 'react-icons/hi2';

export default function ManageImages() {
  const [files, setFiles] = useState([]);
  const { images, setImages, loading, error, fetchImages, uploadFiles, saveImages } = useImages({ userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null });
  const fileInputRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [changed, setChanged] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => { fetchImages(); }, []);

  const onFileChange = (e) => { setFiles(Array.from(e.target.files || [])); };

  const uploadAll = async () => {
    if (!files || files.length === 0) {
      if (fileInputRef && fileInputRef.current) { fileInputRef.current.click(); return; }
      return;
    }
    try {
      setChanged(true);
      await uploadFiles(files);
      setFiles([]);
    } catch (e) {
      console.warn('uploadAll error', e);
    }
  };

  const removeImage = (index) => { const next = [...images]; next.splice(index, 1); if (next.length > 0 && !next.some(i => i.isPrimary)) next[0].isPrimary = true; setImages(next); setChanged(true); };

  const moveImage = (index, dir) => { const next = [...images]; const newIndex = index + dir; if (newIndex < 0 || newIndex >= next.length) return; const [item] = next.splice(index, 1); next.splice(newIndex, 0, item); setImages(next); setChanged(true); };

  // primary selection removed — keep isPrimary field in db but selection handled elsewhere

  const revertChanges = async () => { await fetchImages(); setChanged(false); };

  const saveImagesHandler = async () => {
    if (!userId) return;
    try {
      await saveImages(images, userId);
      setSuccessMessage('Images saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setChanged(false);
    } catch (e) {
      console.warn('saveImages error', e);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <HoneycombBackground />
      <div className="relative z-10 p-0 min-h-screen w-full flex flex-col items-center text-yellow-100">
        <ManageBusinessNavbar active="manageImages" onChange={() => {}} />
        <main className="w-full pt-12">
          <div className="w-full mx-auto max-w-none px-8 py-8">
            <div className="max-w-6xl mx-auto bg-black/90 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Manage Images</h2>
                  <p className="text-yellow-300">Upload and arrange images for your business card.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" multiple onChange={onFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-2 bg-yellow-400 text-black rounded-md transform transition-all duration-200 hover:scale-105 hover:shadow-md">Choose files</button>
                  <button onClick={uploadAll} disabled={loading} className={`px-3 py-2 bg-yellow-400 text-black rounded-md transform transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}>Upload</button>
                  <button onClick={saveImagesHandler} disabled={!changed || loading} className={`px-3 py-2 bg-green-400 text-black rounded-md transform transition-all duration-200 ${!changed || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}>Save changes</button>
                  <button onClick={revertChanges} disabled={!changed || loading} className={`px-3 py-2 bg-gray-700 text-yellow-100 rounded-md transform transition-all duration-200 ${!changed || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}>Revert</button>
                </div>
              </div>

              <div className="mb-4 text-sm text-yellow-200">{images.length} image(s). Use move buttons to reorder. Click a tile to preview.</div>

              <ImageGrid
                images={images.map(it => ({ url: it.url, alt: it.altText, isPrimary: !!it.isPrimary }))}
                onPreview={(url) => setPreviewUrl(url)}
                renderActions={(img, idx) => (
                  <>
                    <button title="Move left" onClick={() => moveImage(idx, -1)} className="p-1 rounded bg-black/40 text-yellow-100 hover:scale-110 transform transition"><HiArrowSmallLeft /></button>
                    <button title="Move right" onClick={() => moveImage(idx, 1)} className="p-1 rounded bg-black/40 text-yellow-100 hover:scale-110 transform transition"><HiArrowSmallRight /></button>
                    <button title="Remove" onClick={() => removeImage(idx)} className="p-1 rounded bg-red-600 text-white hover:scale-110 transform transition">🗑</button>
                  </>
                )}
                columnsClass="grid grid-cols-3 gap-4"
              />

            </div>
          </div>
        </main>
      </div>

      <ImagePreviewModal src={previewUrl} onClose={() => setPreviewUrl(null)} />

      {/* success toast */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg transition transform duration-300 ease-out opacity-100 translate-y-0">{successMessage}</div>
        </div>
      )}
    </div>
  );
}

