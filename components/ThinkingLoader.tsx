import React, { useState, useEffect, useMemo } from 'react';
import Logo from './Logo';
import { useTranslation } from 'react-i18next';

interface ThinkingLoaderProps {
  message?: string;
}

const ThinkingLoader: React.FC<ThinkingLoaderProps> = ({ message: specificMessage }) => {
  const { t } = useTranslation();
  
  // Liste des phrases relaxantes depuis les traductions
  const phrases = useMemo(() => {
    const p = t('common.loaderPhrases', { returnObjects: true });
    return Array.isArray(p) ? p : ["Preparing your space..."];
  }, [t]);

  // État pour la phrase affichée actuellement
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Rotation des phrases si aucun message spécifique n'est fourni
  useEffect(() => {
    if (specificMessage) return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [specificMessage, phrases.length]);

  const displayedMessage = specificMessage || phrases[currentPhraseIndex];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-2xl animate-in fade-in duration-500 px-6">
      {/* Halo de lumière en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#45a081]/10 to-[#2e75c2]/10 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#45a081] to-[#2e75c2] rounded-full blur-3xl opacity-20 animate-pulse scale-150"></div>
        <div className="relative z-10 animate-bounce-gentle">
          <Logo className="w-24 h-24 md:w-32 md:h-32" />
        </div>
      </div>
      
      {/* Message de chargement avec transition douce */}
      <div className="mt-12 text-center max-w-sm">
         <p 
           key={displayedMessage} 
           className="text-sm md:text-base font-bold text-gray-900 tracking-tight leading-relaxed mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700"
         >
           {displayedMessage}
         </p>
         <div className="flex justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.02); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ThinkingLoader;