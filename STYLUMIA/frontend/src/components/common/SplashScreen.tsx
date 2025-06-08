
import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ 
        background: 'linear-gradient(90deg, #a6792e 0%, #cfae63 50%, #e7d8aa 100%)' 
      }}
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white font-clash animate-gentle-pulse">
          Stylumia
        </h1>
        <div className="mt-4 flex justify-center">
          <div className="w-24 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="w-full h-full bg-white animate-progress origin-left"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
