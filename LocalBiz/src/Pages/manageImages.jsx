import React, { useState, useEffect, useRef } from 'react';
import ManageBusinessNavbar from '../Components/ManageBusinessNavbar';
import HoneycombBackground from '../Components/HoneycombBackground';
import ImageGrid from '../Components/ImageGrid';
import ImagePreviewModal from '../Components/ImagePreviewModal';
import useImages from '../hooks/useImages';
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
  HiPencilSquare
} from 'react-icons/hi2';

export default function ManageImages() {
  const [files, setFiles] = useState([]);
  const { images, setImages, loading, error, fetchImages, uploadFiles, saveImages } = useImages({ userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null });
  const fileInputRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [changed, setChanged] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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

  const validateFiles = (fileList) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const errors = [];

    Array.from(fileList).forEach((file, index) => {
      if (!validTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type. Please use JPG, PNG, or WebP.`);
      }
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: File too large. Maximum size is 5MB.`);
      }
    });

    return errors;
  };

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
      console.warn('uploadAll error', e);
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
    console.log('Primary image set:', { index, images: next.map((img, i) => ({ index: i, isPrimary: img.isPrimary, url: img.url.substring(0, 50) + '...' })) });
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
      console.log('Saving images:', images.map((img, i) => ({ index: i, isPrimary: img.isPrimary, url: img.url.substring(0, 50) + '...' })));
      await saveImages(images, userId);
      setSuccessMessage('Images saved successfully! Your business card has been updated.');
      setChanged(false);
    } catch (e) {
      setErrorMessage('Failed to save images. Please try again.');
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
            <div className="max-w-6xl mx-auto bg-black/90 rounded-2xl p-8 shadow-2xl">
              
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2 flex items-center gap-3">
                    <HiPhoto className="w-8 h-8" />
                    Manage Images
                  </h2>
                  <p className="text-yellow-300 text-lg">Upload and arrange images for your business card showcase.</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
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
                    onClick={() => fileInputRef.current && fileInputRef.current.click()} 
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-yellow-300"
                  >
                    <HiCloudArrowUp className="w-5 h-5" />
                    Choose Files
                  </button>
                  <button 
                    onClick={uploadAll} 
                    disabled={loading || isUploading || files.length === 0} 
                    className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium transform transition-all duration-200 ${
                      loading || isUploading || files.length === 0 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:scale-105 hover:shadow-lg hover:bg-blue-600'
                    }`}
                  >
                    {isUploading ? <HiArrowPath className="w-5 h-5 animate-spin" /> : <HiCloudArrowUp className="w-5 h-5" />}
                    {isUploading ? 'Uploading...' : `Upload${files.length > 0 ? ` (${files.length})` : ''}`}
                  </button>
                  <button 
                    onClick={saveImagesHandler} 
                    disabled={!changed || loading} 
                    className={`flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium transform transition-all duration-200 ${
                      !changed || loading 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:scale-105 hover:shadow-lg hover:bg-green-600'
                    }`}
                  >
                    <HiCheckCircle className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button 
                    onClick={revertChanges} 
                    disabled={!changed || loading} 
                    className={`flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium transform transition-all duration-200 ${
                      !changed || loading 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:scale-105 hover:shadow-lg hover:bg-gray-700'
                    }`}
                  >
                    <HiArrowPath className="w-5 h-5" />
                    Revert
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-200 font-medium">Uploading images...</span>
                    <span className="text-yellow-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* File Upload Drop Zone */}
              {files.length === 0 && (
                <div 
                  className={`mb-8 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-yellow-400 bg-yellow-400/10' 
                      : 'border-gray-600 hover:border-yellow-400 hover:bg-yellow-400/5'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <HiCloudArrowUp className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-200 mb-2">
                    {dragActive ? 'Drop images here!' : 'Drag & drop images here'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    or click "Choose Files" to browse your computer
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG, WebP • Max 5MB per file
                  </p>
                </div>
              )}

              {/* Selected Files Preview */}
              {files.length > 0 && (
                <div className="mb-8 p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3">Selected Files ({files.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-black/40 rounded-lg">
                        <HiPhoto className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-yellow-200 font-medium truncate">{file.name}</p>
                          <p className="text-gray-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-yellow-200">
                  <span className="font-medium">{images.length} image(s)</span>
                  {images.length > 0 && (
                    <span className="text-gray-400 ml-2">• Use move buttons to reorder • Click to preview</span>
                  )}
                </div>
                {changed && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <HiExclamationTriangle className="w-5 h-5" />
                    <span className="font-medium">Unsaved changes</span>
                  </div>
                )}
              </div>

              {/* Image Grid */}
              {images.length > 0 ? (
                <ImageGrid
                  images={images.map(it => ({ url: it.url, alt: it.altText, isPrimary: !!it.isPrimary, imageText: it.imageText || '' }))}
                  onPreview={(url) => setPreviewUrl(url)}
                  renderActions={(img, idx) => (
                    <div className="space-y-2">
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button 
                          title="Move left" 
                          onClick={() => moveImage(idx, -1)} 
                          disabled={idx === 0}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            idx === 0 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-black/60 text-yellow-100 hover:bg-black/80 hover:scale-110'
                          }`}
                        >
                          <HiArrowSmallLeft className="w-4 h-4" />
                        </button>
                        
                        <button 
                          title="Move right" 
                          onClick={() => moveImage(idx, 1)} 
                          disabled={idx === images.length - 1}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            idx === images.length - 1 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-black/60 text-yellow-100 hover:bg-black/80 hover:scale-110'
                          }`}
                        >
                          <HiArrowSmallRight className="w-4 h-4" />
                        </button>
                        
                        <button 
                          title={img.isPrimary ? "Primary image" : "Set as primary"} 
                          onClick={() => setPrimaryImage(idx)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            img.isPrimary 
                              ? 'bg-yellow-500 text-black cursor-default' 
                              : 'bg-black/60 text-yellow-400 hover:bg-black/80 hover:scale-110'
                          }`}
                        >
                          <HiStar className="w-4 h-4" />
                        </button>
                        
                        <button 
                          title="Remove image" 
                          onClick={() => removeImage(idx)} 
                          className="p-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600 hover:scale-110 transition-all duration-200"
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
                            className="flex-1 text-xs bg-black/60 text-yellow-100 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-yellow-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  columnsClass="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                />
              ) : (
                <div className="text-center py-16">
                  <HiPhoto className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2">No images yet</h3>
                  <p className="text-gray-500 mb-6">
                    Upload your first images to create an engaging business showcase
                  </p>
                  <button 
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                  >
                    <HiCloudArrowUp className="w-5 h-5" />
                    Upload Images
                  </button>
                </div>
              )}

              {/* Tips and Guidelines */}
              {images.length === 0 && (
                <div className="mt-12 p-6 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                  <h3 className="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
                    <HiPhoto className="w-5 h-5" />
                    Image Guidelines
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold text-yellow-200 mb-2">📸 Best Practices</h4>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Use high-quality, well-lit photos</li>
                        <li>• Show your products, services, or workspace</li>
                        <li>• Include your team or yourself</li>
                        <li>• Keep images professional and relevant</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-200 mb-2">⚙️ Technical Requirements</h4>
                      <ul className="space-y-1 text-gray-300">
                        <li>• Formats: JPG, PNG, WebP</li>
                        <li>• Maximum size: 5MB per image</li>
                        <li>• Recommended: 1200x800px or higher</li>
                        <li>• First image becomes your primary showcase</li>
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

      {/* Notification System */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {/* Success Messages */}
        {successMessage && (
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-green-500 transition-all transform duration-300 ease-out opacity-100 translate-y-0 max-w-md">
            <div className="flex items-center gap-3">
              <HiCheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Success!</p>
                <p className="text-green-100 text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errorMessage && (
          <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-red-500 transition-all transform duration-300 ease-out opacity-100 translate-y-0 max-w-md">
            <div className="flex items-center gap-3">
              <HiExclamationTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-red-100 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !isUploading && (
          <div className="bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-blue-500 transition-all transform duration-300 ease-out opacity-100 translate-y-0">
            <div className="flex items-center gap-3">
              <HiArrowPath className="w-6 h-6 animate-spin flex-shrink-0" />
              <div>
                <p className="font-semibold">Loading...</p>
                <p className="text-blue-100 text-sm">Processing your request</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

