export interface GameConfig {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  htmlFile: string;
  width?: number;
  height?: number;
  category?: 'puzzle' | 'action' | 'memory' | 'educational' | 'creative';
  ageRange?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const GAMES_CONFIG: GameConfig[] = [
  {
    id: 'santa-maze-heist',
    title: 'Santa Maze Heist',
    description: 'Help Santa navigate through the maze to collect all the presents!',
    htmlFile: '/games/maze.html',
    width: 800,
    height: 600,
    category: 'puzzle',
    ageRange: '6-12',
    difficulty: 'medium',
  },
  {
    id: 'sky-sleigh',
    title: 'Sky Sleigh Adventure',
    description: 'Fly Santa\'s sleigh through the sky and avoid obstacles!',
    htmlFile: '/games/sky.html',
    width: 800,
    height: 600,
    category: 'action',
    ageRange: '5-12',
    difficulty: 'medium',
  },
  {
    id: 'candy-cane-crush',
    title: 'Candy Cane Crush',
    description: 'Match colorful candy canes in this sweet Christmas puzzle game!',
    htmlFile: '/games/candyCaneCrush.html',
    width: 800,
    height: 600,
    category: 'puzzle',
    ageRange: '4-12',
    difficulty: 'easy',
  },
];

export function getGameById(id: string): GameConfig | undefined {
  return GAMES_CONFIG.find(game => game.id === id);
}

export function getGamesByCategory(category: GameConfig['category']): GameConfig[] {
  return GAMES_CONFIG.filter(game => game.category === category);
}