import { Suit, Rank } from './types';

export const SUITS = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

export const RANKS = [
  Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
  Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING
];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.HEARTS]: '♥',
  [Suit.DIAMONDS]: '♦',
  [Suit.CLUBS]: '♣',
  [Suit.SPADES]: '♠'
};

export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.HEARTS]: 'text-red-600',
  [Suit.DIAMONDS]: 'text-red-600',
  [Suit.CLUBS]: 'text-gray-900',
  [Suit.SPADES]: 'text-gray-900'
};

export const RANK_LABELS: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K'
};
