
import React from 'react';

const BackgroundLogoSVG: React.FC<{ id: string }> = ({ id }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-64">
    <defs>
      <linearGradient id={id} x1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#45a081" />
        <stop offset="100%" stopColor="#2e75c2" />
      </linearGradient>
    </defs>
    <path d="M50 10 C65 10, 75 25, 75 40 C75 45, 60 45, 50 40 C40 35, 35 10, 50 10Z" fill={`url(#${id})`} />
    <path d="M40 85 C25 85, 15 70, 15 55 C15 50, 30 50, 40 55 C50 60, 55 85, 40 85Z" fill={`url(#${id})`} fillOpacity={0.85} />
    <path d="M85 55 C85 70, 70 80, 55 80 C50 80, 50 65, 55 55 C60 45, 85 40, 85 55Z" fill={`url(#${id})`} fillOpacity={0.7} />
  </svg>
);

const GlobalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none bg-[#fbfbfd]">
      {/* Center (subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] scale-[5] md:scale-[8] transform-gpu">
        <BackgroundLogoSVG id="bg-logo-center" />
      </div>
    </div>
  );
};

export default GlobalBackground;
