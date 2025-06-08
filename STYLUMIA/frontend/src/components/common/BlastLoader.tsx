
import React from 'react';

const BlastLoader: React.FC = () => {
  return (
    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
      {/* Central blast core */}
      <div className="absolute w-8 h-8 brand-gold-bg rounded-full animate-blast"></div>
      
      {/* Ripple effects */}
      <div className="absolute w-16 h-16 border-2 border-amber-300 rounded-full animate-ripple opacity-60"></div>
      <div className="absolute w-24 h-24 border border-amber-200 rounded-full animate-ripple opacity-40" style={{ animationDelay: '0.3s' }}></div>
      
      {/* Particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 brand-gold-bg rounded-full animate-particle"
          style={{
            left: `${50 + 30 * Math.cos((i * Math.PI * 2) / 8)}%`,
            top: `${50 + 30 * Math.sin((i * Math.PI * 2) / 8)}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        ></div>
      ))}
      
      {/* Energy waves */}
      <div className="absolute w-20 h-20 border border-yellow-300 rounded-full animate-ping opacity-30"></div>
      <div className="absolute w-28 h-28 border border-yellow-200 rounded-full animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
    </div>
  );
};

export default BlastLoader;
