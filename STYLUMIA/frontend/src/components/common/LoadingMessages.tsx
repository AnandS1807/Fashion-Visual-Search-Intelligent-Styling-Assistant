
import React, { useState, useEffect } from 'react';

const LoadingMessages: React.FC = () => {
  const messages = [
    "Scanning your style DNA...",
    "Finding your fashion matches...",
    "Curating perfect looks...",
    "Almost ready to wow you!"
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold dynamic-accent animate-fade-in">
        {messages[currentMessage]}
      </h2>
      <div className="flex items-center justify-center gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentMessage 
                ? 'dynamic-accent-bg scale-125' 
                : 'bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingMessages;
