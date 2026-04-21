'use client';

import { useState, useRef } from 'react';
import { Upload, X, Copy, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

export default function MediaUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Optional: simulated progress
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Validate file type (Meta mostly accepts images and docs)
      if (selectedFile.size > 10 * 1024 * 1024) { // Let's limit to 10MB locally for safety
        setError('File size exceeds 10MB limit.');
        return;
      }
      setFile(selectedFile);
      setBlobUrl(null);
      setError(null);
      setCopied(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      setFile(droppedFile);
      setBlobUrl(null);
      setError(null);
      setCopied(false);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(20);

    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file,
        }
      );

      setUploadProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file.');
      }

      setUploadProgress(100);
      setBlobUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Reset progress after a short delay
    }
  };

  const copyToClipboard = async () => {
    if (!blobUrl) return;
    try {
      await navigator.clipboard.writeText(blobUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setBlobUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Media Upload</h2>
        <p className="text-sm text-gray-500 mt-1">Upload files to generate permanent URLs for WhatsApp campaigns.</p>
      </div>

      <div className="p-6">
        {/* Upload Area */}
        {!blobUrl && (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
              file ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            } flex flex-col items-center justify-center min-h-[240px]`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*,application/pdf"
            />

            {!file ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  Click to upload <span className="text-gray-400 font-normal">or drag and drop</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Images, Video, or PDF (max. 10MB)</p>
              </div>
            ) : (
             <div className="w-full max-w-sm">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4 relative">
                  <div className="w-12 h-12 bg-gray-50 rounded-md flex flex-shrink-0 items-center justify-center text-gray-400">
                    {file.type.startsWith('image/') ? (
                         <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-md" />
                      ) : (
                         <ImageIcon className="w-6 h-6" />
                      )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={clearSelection}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
             </div>
            )}
            
            {/* Uploading progress overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
                 <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                 <p className="text-sm font-medium text-gray-700">Uploading to Vercel Blob...</p>
                 <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-300 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Success / Result Area */}
        {blobUrl && (
           <div className="bg-green-50/50 border border-green-100 p-6 rounded-xl relative">
              <button 
                 onClick={clearSelection}
                 className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                  <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Upload Complete!</h3>
                  <p className="text-sm text-gray-500">Your file is now publicly accessible.</p>
                </div>
              </div>

              {/* Preview if image */}
              {file?.type.startsWith('image/') && (
                <div className="mb-6 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-white aspect-video flex items-center justify-center relative group">
                  <img src={blobUrl} alt="Uploaded media" className="max-w-full max-h-[300px] object-contain" />
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Public URL</label>
                 <div className="flex items-stretch gap-2">
                    <input 
                      readOnly 
                      value={blobUrl} 
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center justify-center gap-2 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Actions */}
        {!blobUrl && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={uploadFile}
              disabled={!file || isUploading}
              className={`px-6 py-2.5 rounded-lg font-medium text-black shadow-sm flex items-center gap-2 transition-all ${
                !file || isUploading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 hover:shadow shadow-primary-500/20 active:scale-[0.98]'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black/70" />
                  Uploading...
                </>
              ) : (
                'Upload to Server'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
