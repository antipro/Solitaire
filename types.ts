export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES'
}

export enum Rank {
  ACE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13
}

export enum Color {
  RED = 'RED',
  BLACK = 'BLACK'
}

export interface CardType {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export type PileType = 'deck' | 'waste' | 'foundation' | 'tableau';

export interface Position {
  pileType: PileType;
  pileIndex: number; // 0-3 for foundation, 0-6 for tableau, 0 for others
  cardIndex?: number; // Index within the stack
}

export type Difficulty = 'EASY' | 'HARD';

export interface GameState {
  deck: CardType[];
  waste: CardType[];
  foundations: CardType[][]; // 4 piles
  tableau: CardType[][]; // 7 piles
  score: number;
  moves: number;
  gameWon: boolean;
  difficulty: Difficulty;
}