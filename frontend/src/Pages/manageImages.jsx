import React, { useState, useEffect, useRef, useCallback } from 'react';
import ManageBusinessNavbar from '../Components/ManageBusinessNavbar';
import PageShell from '../Components/PageShell';
import { useNavbar } from '../contexts/NavbarContext';
import { useAuth } from '../contexts/AuthContext';
import ImageGrid from '../Components/ImageGrid';
import ImagePreviewModal from '../Components/ImagePreviewModal';
import useImages from '../hooks/useImages';
import { logger } from '../utils/helpers';
import {
  HiArrowSmallLeft,
  HiArrowSmallRight,
  HiCloudArrowUp,
  HiPhoto,
  HiCheckCircle,
  HiExclamationTriangle,
  HiXCircle,
  HiStar,
  HiArrowPath,
  HiPencilSquare,
  HiInformationCircle,
} from 'react-icons/hi2';

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ManageImages() {
  const { isNavbarOpen } = useNavbar();
  const { user } = useAuth();
  const userId = user?.userId ?? null;
  const token = user?.token ?? null;
  const [files, setFiles] = useState([]);
  const { images, setImages, loading, error, fetchImages, uploadFiles, saveImages } = useImages({ userId });
  const fileInputRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [changed, setChanged] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { 
    fetchImages(); 
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+U to upload files
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        if (files.length > 0) {
          uploadAll();
        } else {
          fileInputRef.current?.click();
        }
      }
      // Ctrl+S to save changes
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (changed && !loading) {
          saveImagesHandler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files.length, changed, loading]);

  const validateFiles = useCallback((fileList) => {
    const errs = [];
    Array.from(fileList).forEach((file, i) => {
      if (!VALID_TYPES.includes(file.type)) errs.push(`File ${i + 1}: Invalid type — use JPG, PNG, or WebP.`);
      if (file.size > MAX_FILE_SIZE) errs.push(`File ${i + 1}: Too large — max 5 MB.`);
    });
    return errs;
  }, []);

  const onFileChange = (e) => { 
    const selectedFiles = Array.from(e.target.files || []);
    const validationErrors = validateFiles(selectedFiles);
    
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(' '));
      return;
    }
    
    setFiles(selectedFiles);
    setErrorMessage('');
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validationErrors = validateFiles(droppedFiles);
    
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(' '));
      return;
    }
    
    setFiles(droppedFiles);
    setErrorMessage('');
  };

  const uploadAll = async () => {
    if (!files || files.length === 0) {
      if (fileInputRef && fileInputRef.current) { fileInputRef.current.click(); return; }
      return;
    }
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setChanged(true);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      await uploadFiles(files);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setFiles([]);
      setSuccessMessage(`Successfully uploaded ${files.length} image(s)!`);
      
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (e) {
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMessage('Failed to upload images. Please try again.');
      logger.warn('uploadAll error', e);
    }
  };

  const removeImage = (index) => { 
    const next = [...images]; 
    const removedImage = next[index];
    next.splice(index, 1); 
    
    // If we removed the primary image, make the first remaining image primary
    if (removedImage?.isPrimary && next.length > 0 && !next.some(i => i.isPrimary)) {
      next[0].isPrimary = true;
    }
    
    setImages(next); 
    setChanged(true);
    setSuccessMessage('Image removed successfully');
  };

  const setPrimaryImage = (index) => {
    const next = [...images];
    next.forEach((img, i) => {
      img.isPrimary = i === index;
    });
    setImages(next);
    setChanged(true);
    setSuccessMessage(`Primary image updated (Image ${index + 1})`);
    logger.dev('Primary image set:', { index, images: next.map((img, i) => ({ index: i, isPrimary: img.isPrimary, url: img.url.substring(0, 50) + '...' })) });
  };

  const setImageText = (index, text) => {
    const next = [...images];
    next[index].imageText = text;
    setImages(next);
    setChanged(true);
    setSuccessMessage(`Image text updated`);
  };

  const moveImage = (index, dir) => { 
    const next = [...images]; 
    const newIndex = index + dir; 
    if (newIndex < 0 || newIndex >= next.length) return; 
    const [item] = next.splice(index, 1); 
    next.splice(newIndex, 0, item); 
    setImages(next); 
    setChanged(true); 
  };

  const revertChanges = async () => { 
    try {
      await fetchImages(); 
      setChanged(false);
      setFiles([]);
      setSuccessMessage('Changes reverted successfully');
    } catch (e) {
      setErrorMessage('Failed to revert changes');
    }
  };

  const saveImagesHandler = async () => {
    if (!userId) return;
    try {
      logger.dev('Saving images:', images.map((img, i) => ({ index: i, isPrimary: img.isPrimary, url: img.url.substring(0, 50) + '...' })));
      await saveImages(images, userId);
      setSuccessMessage('Images saved successfully! Your business card has been updated.');
      setChanged(false);
    } catch (e) {
      setErrorMessage('Failed to save images. Please try again.');
      logger.warn('saveImages error', e);
    }
  };

  return (
    <>
      {/* Management Navbar */}
      <ManageBusinessNavbar active="manageImages" onChange={() => {}} isNavbarOpen={isNavbarOpen} />

      {/* Main Content Area */}
      <PageShell>
          <div className="relative z-10 pt-24 p-0 min-h-screen w-full flex flex-col items-center text-yellow-100">
        <main className="w-full pt-6">
          <div className="w-full mx-auto max-w-none px-4 sm:px-8 py-6">

            {/* ── Polished Header Card ─────────────────── */}
            <div className="max-w-6xl mx-auto mb-8 mt-8">
              <div className="relative bg-black/80 backdrop-blur-md border border-yellow-400/20 rounded-3xl px-6 py-8 sm:px-10 sm:py-10 shadow-2xl shadow-black/40 overflow-hidden">
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-yellow-500/8 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-bold text-yellow-50 mb-2 flex items-center gap-3">
                        <HiPhoto className="w-8 h-8 text-yellow-400" />
                        Manage Images
                      </h1>
                      <p className="text-yellow-200/70 text-base sm:text-lg leading-relaxed">
                        Upload and arrange images for your business card showcase
                      </p>
                    </div>

                    {/* Image count badge */}
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                        <HiPhoto className="w-4 h-4 text-yellow-300" />
                        <span className="text-yellow-200 font-semibold text-sm">{images.length} image{images.length !== 1 ? 's' : ''}</span>
                      </div>
                      {changed && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-orange-500/15 border border-orange-400/20 text-orange-300 text-sm font-medium">
                          <HiExclamationTriangle className="w-4 h-4" />
                          Unsaved
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto bg-black/90 border border-yellow-300/20 rounded-3xl p-5 sm:p-8 shadow-2xl">

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={onFileChange}
                  className="hidden"
                  aria-label="Select image files to upload"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-xl font-semibold transition-all hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  <HiCloudArrowUp className="w-5 h-5" />
                  Choose Files
                </button>
                <button
                  onClick={uploadAll}
                  disabled={loading || isUploading || files.length === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-semibold transition-all ${
                    loading || isUploading || files.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg'
                  }`}
                >
                  {isUploading ? <HiArrowPath className="w-5 h-5 animate-spin" /> : <HiCloudArrowUp className="w-5 h-5" />}
                  {isUploading ? 'Uploading…' : `Upload${files.length > 0 ? ` (${files.length})` : ''}`}
                </button>
                <button
                  onClick={saveImagesHandler}
                  disabled={!changed || loading}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl font-semibold transition-all ${
                    !changed || loading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-green-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg'
                  }`}
                >
                  <HiCheckCircle className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={revertChanges}
                  disabled={!changed || loading}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-yellow-200 rounded-xl font-medium border border-gray-600 transition-all ${
                    !changed || loading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-600 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <HiArrowPath className="w-5 h-5" />
                  Revert
                </button>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6 bg-gray-900/50 rounded-2xl p-5 border border-yellow-300/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-200 font-medium text-sm">Uploading images…</span>
                    <span className={`font-bold tabular-nums text-sm ${uploadProgress === 100 ? 'text-green-400' : 'text-yellow-300'}`}>{uploadProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        uploadProgress === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-yellow-400 to-amber-400'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* File Upload Drop Zone */}
              {files.length === 0 && (
                <div
                  className={`mb-8 border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-yellow-400 bg-yellow-400/10 scale-[1.01]'
                      : 'border-gray-600 hover:border-yellow-400/60 hover:bg-yellow-400/5'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                    dragActive ? 'bg-yellow-400/20' : 'bg-gray-800'
                  }`}>
                    <HiCloudArrowUp className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-yellow-100 mb-2">
                    {dragActive ? 'Drop images here!' : 'Drag & drop images here'}
                  </h3>
                  <p className="text-yellow-200/60 mb-4">
                    or click <span className="text-yellow-300 font-medium">Choose Files</span> to browse your computer
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports JPG, PNG, WebP &bull; Max 5 MB per file
                  </p>
                </div>
              )}

              {/* Selected Files Preview */}
              {files.length > 0 && (
                <div className="mb-8 p-5 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
                  <h3 className="text-lg font-bold text-yellow-200 mb-3 flex items-center gap-2">
                    <HiPhoto className="w-5 h-5 text-yellow-400" />
                    Selected Files ({files.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                          <HiPhoto className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-yellow-100 font-medium truncate text-sm">{file.name}</p>
                          <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Section */}
              {images.length > 0 && (
                <div className="mb-6 flex items-center gap-2 text-sm text-yellow-200/60">
                  <HiInformationCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Use the arrow buttons to reorder &bull; Click an image to preview &bull; Star to set primary</span>
                </div>
              )}

              {/* Image Grid */}
              {images.length > 0 ? (
                <ImageGrid
                  images={images.map(it => ({ url: it.url, alt: it.altText, isPrimary: !!it.isPrimary, imageText: it.imageText || '' }))}
                  onPreview={(url) => setPreviewUrl(url)}
                  renderActions={(img, idx) => (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <button
                          title="Move left"
                          onClick={() => moveImage(idx, -1)}
                          disabled={idx === 0}
                          className={`p-2 rounded-lg transition-all ${
                            idx === 0
                              ? 'bg-gray-700/60 text-gray-500 cursor-not-allowed'
                              : 'bg-black/60 text-yellow-100 hover:bg-black/80 active:scale-95'
                          }`}
                        >
                          <HiArrowSmallLeft className="w-4 h-4" />
                        </button>
                        <button
                          title="Move right"
                          onClick={() => moveImage(idx, 1)}
                          disabled={idx === images.length - 1}
                          className={`p-2 rounded-lg transition-all ${
                            idx === images.length - 1
                              ? 'bg-gray-700/60 text-gray-500 cursor-not-allowed'
                              : 'bg-black/60 text-yellow-100 hover:bg-black/80 active:scale-95'
                          }`}
                        >
                          <HiArrowSmallRight className="w-4 h-4" />
                        </button>
                        <button
                          title={img.isPrimary ? 'Primary image' : 'Set as primary'}
                          onClick={() => setPrimaryImage(idx)}
                          className={`p-2 rounded-lg transition-all ${
                            img.isPrimary
                              ? 'bg-yellow-500 text-black cursor-default shadow-lg shadow-yellow-500/30'
                              : 'bg-black/60 text-yellow-400 hover:bg-black/80 active:scale-95'
                          }`}
                        >
                          <HiStar className="w-4 h-4" />
                        </button>
                        <button
                          title="Remove image"
                          onClick={() => removeImage(idx)}
                          className="p-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600 active:scale-95 transition-all"
                        >
                          <HiXCircle className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Text Input */}
                      <div className="w-full">
                        <div className="flex items-center gap-1">
                          <HiPencilSquare className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={images[idx]?.imageText || ''}
                            onChange={(e) => setImageText(idx, e.target.value)}
                            placeholder="Add text (3 words max)"
                            maxLength={30}
                            className="flex-1 text-xs bg-black/60 text-yellow-100 border border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  columnsClass="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                />
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-6">
                    <HiPhoto className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">No images yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Upload your first images to create an engaging business showcase
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 active:scale-[0.98] transition-all shadow-lg"
                  >
                    <HiCloudArrowUp className="w-5 h-5" />
                    Upload Images
                  </button>
                </div>
              )}

              {/* Tips and Guidelines */}
              {images.length === 0 && (
                <div className="mt-10 bg-gray-900/50 rounded-2xl p-6 border border-yellow-300/10 hover:border-yellow-300/20 transition-colors">
                  <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <HiInformationCircle className="w-5 h-5" />
                    Image Guidelines
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold text-yellow-200 mb-3">Best Practices</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>Use high-quality, well-lit photos</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>Show your products, services, or workspace</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>Include your team or yourself</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>Keep images professional and relevant</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-200 mb-3">Technical Requirements</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>Formats: JPG, PNG, WebP</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>Maximum size: 5 MB per image</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>Recommended: 1200×800px or higher</li>
                        <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>First image becomes your primary showcase</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      <ImagePreviewModal src={previewUrl} onClose={() => setPreviewUrl(null)} />

      {/* Notification Toasts */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
        {successMessage && (
          <div className="pointer-events-auto bg-green-600/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-green-400/30 max-w-sm animate-[slideUp_0.3s_ease-out]">
            <div className="flex items-center gap-3">
              <HiCheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="pointer-events-auto bg-red-600/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-red-400/30 max-w-sm animate-[slideUp_0.3s_ease-out]">
            <div className="flex items-center gap-3">
              <HiExclamationTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {loading && !isUploading && (
          <div className="pointer-events-auto bg-blue-600/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-blue-400/30 animate-[slideUp_0.3s_ease-out]">
            <div className="flex items-center gap-3">
              <HiArrowPath className="w-5 h-5 animate-spin flex-shrink-0" />
              <p className="text-sm font-medium">Processing…</p>
            </div>
          </div>
        )}
          </div>
      </PageShell>
    </>
  );
}

