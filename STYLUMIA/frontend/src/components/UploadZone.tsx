// STYLUMIA/frontend/src/components/UploadZone.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService, SearchResult } from '../services/api';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  onSearchResults?: (results: SearchResult[]) => void; // Optional callback for search results
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload, onSearchResults }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    console.log('🔌 Checking backend connection...');
    setBackendStatus('checking');
    
    try {
      const isConnected = await apiService.testConnection();
      setBackendStatus(isConnected ? 'connected' : 'disconnected');
      console.log(` Backend status: ${isConnected ? 'connected' : 'disconnected'}`);
    } catch (error) {
      console.error('Backend connection check failed:', error);
      setBackendStatus('disconnected');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      console.log('File dropped:', imageFile.name);
      handleImageUpload(imageFile);
    } else {
      console.warn(' No valid image file found in drop');
      setUploadStatus('Please drop a valid image file');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      console.log(' File selected:', file.name);
      handleImageUpload(file);
    } else {
      console.warn(' No valid image file selected');
      setUploadStatus('Please select a valid image file');
      setTimeout(() => setUploadStatus(''), 3000);
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    console.log('Starting image upload and search process...');
    
    // Call the original onFileUpload callback
    onFileUpload(file);
    
    // Check backend connection before proceeding
    if (backendStatus !== 'connected') {
      console.log('Backend not connected, attempting reconnection...');
      await checkBackendConnection();
      
      if (backendStatus !== 'connected') {
        setUploadStatus('Backend connection failed. Please check if the server is running.');
        return;
      }
    }

    setIsSearching(true);
    setUploadStatus('Uploading and analyzing image...');

    try {
      console.log(' Sending image to backend for search...');
      
      // Call the API service to search by image
      const searchResponse = await apiService.searchByImage(file, 8);
      
      console.log('Search completed successfully');
      setUploadStatus(`Found ${searchResponse.total_found} similar products!`);
      
      // Call the results callback if provided
      if (onSearchResults) {
        onSearchResults(searchResponse.results);
      }
      
      // Clear status after delay
      setTimeout(() => {
        setUploadStatus('');
      }, 3000);

    } catch (error) {
      console.error(' Image search failed:', error);
      
      let errorMessage = 'Search failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid image file. Please try a different image.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      
      setUploadStatus(errorMessage);
      
      // Clear error after delay
      setTimeout(() => {
        setUploadStatus('');
      }, 5000);
      
    } finally {
      setIsSearching(false);
    }
  };

  // Backend status indicator component
  const BackendStatusIndicator = () => {
    if (backendStatus === 'checking') {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting to server...
        </div>
      );
    }
    
    if (backendStatus === 'connected') {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          Server connected
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <AlertCircle className="w-4 h-4" />
        Server disconnected
        <button 
          onClick={checkBackendConnection}
          className="text-blue-500 hover:text-blue-700 underline ml-1"
        >
          Retry
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 stylumia-gradient font-clash">
            Stylumia
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
        </div>

        {/* Backend Status Indicator */}
        <div className="mb-6 flex justify-center">
          <BackendStatusIndicator />
        </div>

        {/* Upload Zone */}
        <div
          className={`
            glass-panel rounded-3xl p-12 hover-lift glow-on-hover
            border-2 border-dashed transition-all duration-300
            ${isDragOver 
              ? 'border-amber-400 bg-amber-50/30 shadow-2xl shadow-amber-500/20' 
              : 'border-amber-300/50 hover:border-amber-400/70'
            }
            ${isSearching ? 'pointer-events-none opacity-75' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-6">
            {/* Icon */}
            <div className={`
              mx-auto w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-300
              ${isDragOver 
                ? 'bg-amber-100 text-amber-600 scale-110' 
                : 'bg-amber-50 text-amber-500 hover:bg-amber-100'
              }
            `}>
              {isSearching ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isDragOver ? (
                <ImageIcon className="w-10 h-10" />
              ) : (
                <Upload className="w-10 h-10" />
              )}
            </div>

            {/* Main Text */}
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-slate-800">
                {isSearching ? 'Analyzing your image...' : 'Find looks you will love—start with an image.'}
              </h2>
              <p className="text-lg text-slate-500 italic font-light">
                {isSearching ? 'Please wait while we search for similar products' : 'Drop a pic—your next outfit is waiting!'}
              </p>
            </div>

            {/* Status Message */}
            {uploadStatus && (
              <div className={`
                p-3 rounded-lg text-sm font-medium
                ${uploadStatus.includes('failed') || uploadStatus.includes('error') || uploadStatus.includes('Cannot connect')
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : uploadStatus.includes('Found')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                }
              `}>
                {uploadStatus}
              </div>
            )}

            {/* Upload Button */}
            <div className="pt-4">
              <label className={`
                inline-flex items-center gap-2 px-8 py-4 
                bg-gradient-to-r from-amber-600 to-amber-500
                hover:from-amber-700 hover:to-amber-600
                text-white font-medium rounded-2xl
                cursor-pointer transition-all duration-300
                hover:shadow-xl hover:shadow-amber-500/25
                transform hover:scale-105
                ${isSearching || backendStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}
              `}>
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {isSearching ? 'Searching...' : 'Choose Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSearching || backendStatus !== 'connected'}
                />
              </label>
            </div>

            {/* Supported formats */}
            <p className="text-sm text-slate-400 mt-4">
              Supports JPG, PNG, WebP, and GIF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;