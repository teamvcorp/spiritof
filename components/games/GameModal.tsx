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

  const modalWidth = game.width ? Math.min(game.width + 40, window.innerWidth - 40) : 600;
  const modalHeight = game.height ? Math.min(game.height + 120, window.innerHeight - 40) : 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl relative flex flex-col overflow-hidden"
        style={{ 
          width: modalWidth,
          height: modalHeight,
          maxWidth: '95vw',
          maxHeight: '95vh'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-santa to-berryPink text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Gamepad2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{game.title}</h2>
              <p className="text-white/90 text-sm">{game.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Game Info Bar */}
        <div className="bg-evergreen/10 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {game.category && (
              <span className="bg-evergreen/20 text-evergreen px-2 py-1 rounded-full font-medium">
                {game.category.charAt(0).toUpperCase() + game.category.slice(1)}
              </span>
            )}
            {game.ageRange && (
              <span className="text-gray-600">Ages {game.ageRange}</span>
            )}
            {game.difficulty && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500" />
                <span className="text-gray-600 capitalize">{game.difficulty}</span>
              </div>
            )}
          </div>
          <div className="text-gray-500">
            Press ESC to close
          </div>
        </div>

        {/* Game Content */}
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

// Hook for keyboard controls
export function useGameModalKeyboard(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
}