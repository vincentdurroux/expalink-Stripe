
import React from 'react';

const Logo: React.FC<{ className?: string; color?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#45a081" />
          <stop offset="100%" stopColor="#2e75c2" />
        </linearGradient>
      </defs>
      
      {/* Top Leaf - Petal 1 (Arrive immédiatement) */}
      <path 
        className="animate-petal-stagger-1"
        d="M50 10 C65 10, 75 25, 75 40 C75 45, 60 45, 50 40 C40 35, 35 10, 50 10Z" 
        fill="url(#logo-gradient)"
      />
      
      {/* Bottom Left Leaf - Petal 2 (Arrive à +0.2s) */}
      <path 
        className="animate-petal-stagger-2"
        d="M40 85 C25 85, 15 70, 15 55 C15 50, 30 50, 40 55 C50 60, 55 85, 40 85Z" 
        fill="url(#logo-gradient)"
        fillOpacity={0.85}
      />
      
      {/* Right Leaf - Petal 3 (Arrive à +0.4s) */}
      <path 
        className="animate-petal-stagger-3"
        d="M85 55 C85 70, 70 80, 55 80 C50 80, 50 65, 55 55 C60 45, 85 40, 85 55Z" 
        fill="url(#logo-gradient)"
        fillOpacity={0.7}
      />
    </svg>
  );
};

export default Logo;