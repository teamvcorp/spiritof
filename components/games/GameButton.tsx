"use client";

import { useState } from "react";
import { Play, Gamepad2, Star, Clock, Users, X } from "lucide-react";
import { GameModal, useGameModalKeyboard } from "./GameModal";
import { GameConfig, GAMES_CONFIG } from "@/lib/games-config";

interface GameButtonProps {
  gameId?: string;
  game?: GameConfig;
  variant?: 'button' | 'card' | 'compact';
  showAllGames?: boolean;
  className?: string;
}

export function GameButton({ 
  gameId, 
  game, 
  variant = 'button', 
  showAllGames = false,
  className = "" 
}: GameButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [showGameSelector, setShowGameSelector] = useState(false);

  // Use keyboard controls
  useGameModalKeyboard(isModalOpen, () => setIsModalOpen(false));

  // Determine which game to show
  const targetGame = game || (gameId ? GAMES_CONFIG.find(g => g.id === gameId) : null);

  const openGame = (gameToOpen: GameConfig) => {
    setSelectedGame(gameToOpen);
    setIsModalOpen(true);
  };

  const openGameSelector = () => {
    setShowGameSelector(true);
  };

  if (variant === 'button') {
    return (
      <>
        {targetGame ? (
          <button
            onClick={() => openGame(targetGame)}
            className={`bg-santa text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 ${className}`}
          >
            <Play size={20} />
            Play {targetGame.title}
          </button>
        ) : showAllGames ? (
          <button
            onClick={openGameSelector}
            className={`bg-gradient-to-r from-evergreen to-blueberry text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 ${className}`}
          >
            <Gamepad2 size={20} />
            Play Games
          </button>
        ) : (
          <button
            disabled
            className={`bg-gray-400 text-white px-6 py-3 rounded-xl font-bold opacity-50 cursor-not-allowed ${className}`}
          >
            <Play size={20} />
            Game Not Found
          </button>
        )}

        {/* Game Selector Modal */}
        {showGameSelector && (
          <GameSelectorModal
            isOpen={showGameSelector}
            onClose={() => setShowGameSelector(false)}
            onSelectGame={(game) => {
              setShowGameSelector(false);
              openGame(game);
            }}
          />
        )}

        {/* Game Modal */}
        <GameModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          game={selectedGame}
        />
      </>
    );
  }

  if (variant === 'card') {
    if (!targetGame) return null;

    return (
      <>
        <div 
          onClick={() => openGame(targetGame)}
          className={`bg-evergreen rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 overflow-hidden ${className}`}
        >
          <div className=" p-6">
            <div className="flex items-start justify-between mb-4">
              <div className=" p-3 rounded-lg shadow-sm">
                <Gamepad2 size={24} className="text-santa" />
              </div>
              {targetGame.difficulty && (
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {targetGame.difficulty}
                  </span>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">{targetGame.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{targetGame.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {targetGame.ageRange && (
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>Ages {targetGame.ageRange}</span>
                  </div>
                )}
                {targetGame.category && (
                  <span className="bg-evergreen/20 text-evergreen px-2 py-1 rounded-full font-medium">
                    {targetGame.category.charAt(0).toUpperCase() + targetGame.category.slice(1)}
                  </span>
                )}
              </div>
              
              <button className="bg-santa text-white px-4 py-2 rounded-lg font-semibold hover:bg-santa/90 transition-colors flex items-center gap-2">
                <Play size={16} />
                Play
              </button>
            </div>
          </div>
        </div>

        <GameModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          game={selectedGame}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        {targetGame ? (
          <button
            onClick={() => openGame(targetGame)}
            className={`bg-gradient-to-r from-santa to-berryPink text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 text-sm ${className}`}
          >
            <Play size={16} />
            {targetGame.title}
          </button>
        ) : showAllGames ? (
          <button
            onClick={openGameSelector}
            className={` text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 text-sm ${className}`}
          >
            <Gamepad2 size={16} />
            Games
          </button>
        ) : null}

        {showGameSelector && (
          <GameSelectorModal
            isOpen={showGameSelector}
            onClose={() => setShowGameSelector(false)}
            onSelectGame={(game) => {
              setShowGameSelector(false);
              openGame(game);
            }}
          />
        )}

        <GameModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          game={selectedGame}
        />
      </>
    );
  }

  return null;
}

// Game Selector Modal Component
interface GameSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: GameConfig) => void;
}

function GameSelectorModal({ isOpen, onClose, onSelectGame }: GameSelectorModalProps) {
  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(GAMES_CONFIG.map(g => g.category).filter(Boolean))) as string[]];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredGames = selectedCategory === 'all' 
    ? GAMES_CONFIG 
    : GAMES_CONFIG.filter(g => g.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-evergreen rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-[201]">
        {/* Header */}
        <div className="bg-gradient-to-r from-evergreen to-blueberry text-white p-6">
          <div className="flex items-center justify-between">
            <div className='flex flex-col items-start'>
              <h2 className="lg:text-4xl text-xl lg:font-semibold uppercase mb-2">Choose a Game to Play!</h2>
              <p className="text-white left">Pick any game you'd like to play</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-santa text-white'
                    : ' text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Games' : (category || '').charAt(0).toUpperCase() + (category || '').slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-santa hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-santa/10 p-2 rounded-lg">
                    <Gamepad2 size={20} className="text-santa" />
                  </div>
                  {game.difficulty && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      <span className="text-xs text-gray-500 capitalize">{game.difficulty}</span>
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-gray-800 mb-2">{game.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {game.ageRange && <span>Ages {game.ageRange}</span>}
                  {game.category && (
                    <span className="bg-evergreen/20 text-evergreen px-2 py-1 rounded-full font-medium">
                      {game.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}