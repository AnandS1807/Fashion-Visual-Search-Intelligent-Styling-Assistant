
import React, { useState, useEffect } from 'react';
import UploadZone from '@/components/UploadZone';
import LoadingState from '@/components/LoadingState';
import ResultsPage from '@/components/ResultsPage';
import SplashScreen from '@/components/common/SplashScreen';

type AppState = 'splash' | 'upload' | 'loading' | 'results';

const Index: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [uploadedImage, setUploadedImage] = useState<string>('');

  // Show splash screen for 2 seconds on app load
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppState('upload');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Function to extract dominant color from image
  const extractDominantColor = (imageFile: File): Promise<{ hue: number; saturation: number; lightness: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          resolve({ hue: 220, saturation: 50, lightness: 60 });
          return;
        }
        
        // Simple color extraction - take average of center pixels
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const sampleSize = 20;
        
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
          for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
            const index = (y * canvas.width + x) * 4;
            r += imageData.data[index];
            g += imageData.data[index + 1];
            b += imageData.data[index + 2];
            count++;
          }
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        // Convert RGB to HSL
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        const diff = max - min;
        const sum = max + min;
        
        let hue = 0;
        if (diff !== 0) {
          if (max === r / 255) hue = ((g / 255 - b / 255) / diff) % 6;
          else if (max === g / 255) hue = (b / 255 - r / 255) / diff + 2;
          else hue = (r / 255 - g / 255) / diff + 4;
        }
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
        
        const lightness = sum / 2;
        const saturation = diff === 0 ? 0 : diff / (1 - Math.abs(2 * lightness - 1));
        
        resolve({
          hue: hue,
          saturation: Math.round(saturation * 100),
          lightness: Math.round(lightness * 100)
        });
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const handleFileUpload = async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setAppState('loading');
    
    // Extract dominant color and update CSS variables
    try {
      const { hue, saturation, lightness } = await extractDominantColor(file);
      
      // Update CSS custom properties for dynamic theming
      document.documentElement.style.setProperty('--accent-hue', hue.toString());
      document.documentElement.style.setProperty('--accent-saturation', `${Math.max(40, saturation)}%`);
      document.documentElement.style.setProperty('--accent-lightness', `${Math.min(70, Math.max(45, lightness))}%`);
      
      console.log('Extracted color:', { hue, saturation, lightness });
    } catch (error) {
      console.error('Error extracting color:', error);
    }
    
    // Reduced loading time to 800ms for very fast experience
    setTimeout(() => {
      setAppState('results');
    }, 800);
  };

  // Render different states
  switch (appState) {
    case 'splash':
      return <SplashScreen />;
    case 'loading':
      return <LoadingState />;
    case 'results':
      return <ResultsPage uploadedImage={uploadedImage} />;
    default:
      return <UploadZone onFileUpload={handleFileUpload} />;
  }
};

export default Index;
