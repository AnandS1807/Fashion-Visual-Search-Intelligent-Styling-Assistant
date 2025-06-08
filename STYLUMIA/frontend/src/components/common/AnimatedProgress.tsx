
import React from 'react';

const AnimatedProgress: React.FC = () => {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-4 border-slate-200/30"></div>
      
      {/* Animated progress ring */}
      <div 
        className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
        style={{
          borderTopColor: 'var(--dynamic-accent)',
          borderRightColor: 'var(--dynamic-accent)',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          animationDuration: '1s',
        }}
      ></div>
      
      {/* Inner pulsing circle */}
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white to-slate-50 animate-pulse shadow-inner">
        <div className="absolute inset-2 rounded-full dynamic-accent-bg opacity-20 animate-gentle-pulse"></div>
      </div>
      
      {/* Center sparkle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 dynamic-accent-bg rounded-full animate-ping"></div>
      </div>
    </div>
  );
};

export default AnimatedProgress;
