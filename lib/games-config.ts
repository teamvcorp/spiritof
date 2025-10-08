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
    id: 'christmas-memory',
    title: 'Christmas Memory Match',
    description: 'Match the Christmas-themed cards to win!',
    htmlFile: '/games/christmas-memory.html',
    width: 600,
    height: 500,
    category: 'memory',
    ageRange: '4-12',
    difficulty: 'easy',
  },
  {
    id: 'santa-catch',
    title: 'Help Santa Catch Presents',
    description: 'Move Santa left and right to catch falling presents!',
    htmlFile: '/games/santa-catch.html',
    width: 400,
    height: 600,
    category: 'action',
    ageRange: '5-12',
    difficulty: 'medium',
  },
  {
    id: 'reindeer-puzzle',
    title: 'Reindeer Jigsaw Puzzle',
    description: 'Put together the pieces to complete the reindeer picture!',
    htmlFile: '/games/reindeer-puzzle.html',
    width: 500,
    height: 500,
    category: 'puzzle',
    ageRange: '6-12',
    difficulty: 'medium',
  },
  {
    id: 'christmas-coloring',
    title: 'Christmas Coloring Book',
    description: 'Color beautiful Christmas scenes with your favorite colors!',
    htmlFile: '/games/christmas-coloring.html',
    width: 700,
    height: 600,
    category: 'creative',
    ageRange: '3-10',
    difficulty: 'easy',
  },
];

export function getGameById(id: string): GameConfig | undefined {
  return GAMES_CONFIG.find(game => game.id === id);
}

export function getGamesByCategory(category: GameConfig['category']): GameConfig[] {
  return GAMES_CONFIG.filter(game => game.category === category);
}