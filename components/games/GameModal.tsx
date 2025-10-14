"use client";

import { useState, useEffect } from "react";
import { X, Play, Gamepad2, Star } from "lucide-react";
import { GameConfig } from "@/lib/games-config";

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameConfig | null;
}

export function GameModal({ isOpen, onClose, game }: GameModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && game) {
      setIsLoading(true);
      setError(null);
      // Focus the modal for better accessibility and ensure it captures keyboard events
      const timer = setTimeout(() => {
        const modal = document.querySelector('[data-game-modal]') as HTMLElement;
        if (modal) {
          modal.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, game]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load game. Please try again later.");
  };

  if (!isOpen || !game) return null;

  // Make the modal take up 90% minimum of screen for maximum play area
  const modalWidth = Math.max(
    window.innerWidth * 0.9,
    game.width ? game.width + 40 : 1200
  );
  const modalHeight = Math.max(
    window.innerHeight * 0.9,
    game.height ? game.height + 100 : 800
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2">
      <div 
        data-game-modal
        tabIndex={-1}
        className="relative z-[201] bg-evergreen rounded-xl shadow-2xl flex flex-col overflow-hidden outline-none"
        style={{ 
          width: modalWidth,
          height: modalHeight,
          maxWidth: '98vw',
          maxHeight: '98vh',
          minWidth: '90vw',
          minHeight: '90vh'
        }}
      >
        {/* Always visible close button in top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white hover:bg-gray-100 text-santa p-2.5 rounded-full shadow-lg transition-all group border-2 border-santa/20"
          title="Close Game (ESC)"
        >
          <X size={24} className="group-hover:scale-110 transition-transform font-bold" />
        </button>
        {/* Compact Header with Close Button */}
        <div className="bg-gradient-to-r from-santa to-berryPink text-white p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1 rounded">
              <Gamepad2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold">{game.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 text-santa p-2 rounded-full shadow-lg transition-all group font-bold"
            title="Close (ESC)"
          >
            <X size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Game Content - Maximum Space */}
        <div className="flex-1 relative bg-gray-50">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-santa border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading game...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="text-6xl mb-4">😕</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                  }}
                  className="bg-santa text-white px-4 py-2 rounded-lg hover:bg-santa/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          <iframe
            src={game.htmlFile}
            width="100%"
            height="100%"
            frameBorder="0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className={`${isLoading || error ? 'invisible' : 'visible'}`}
            title={game.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

// Hook for keyboard controls and focus management
export function useGameModalKeyboard(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      // Add event listener to document for global capture
      document.addEventListener('keydown', handleKeyDown, true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Focus trap - ensure modal stays focused
      const modal = document.querySelector('[data-game-modal]') as HTMLElement;
      if (modal) {
        modal.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
}