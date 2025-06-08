
import React from 'react';
import BlastLoader from './common/BlastLoader';
import LoadingMessages from './common/LoadingMessages';

const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="text-center space-y-8">
        <BlastLoader />
        <LoadingMessages />
        
        {/* Floating elements for visual interest */}
        <div className="absolute top-20 left-20 w-4 h-4 brand-gold-bg rounded-full animate-gentle-pulse opacity-30"></div>
        <div className="absolute bottom-32 right-24 w-6 h-6 bg-amber-300 rounded-full animate-gentle-pulse opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-20 w-3 h-3 bg-yellow-300 rounded-full animate-gentle-pulse opacity-35" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
};

export default LoadingState;
