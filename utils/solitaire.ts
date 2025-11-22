import { CardType, Suit, Rank, Color, GameState, Difficulty } from '../types';
import { SUITS, RANKS } from '../constants';

export const getSuitColor = (suit: Suit): Color => {
  return (suit === Suit.HEARTS || suit === Suit.DIAMONDS) ? Color.RED : Color.BLACK;
};

export const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        id: `${rank}-${suit}-${Math.random().toString(36).substr(2, 9)}`,
        suit,
        rank,
        faceUp: false
      });
    });
  });
  return deck;
};

export const shuffleDeck = (deck: CardType[]): CardType[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const initGame = (difficulty: Difficulty = 'EASY'): GameState => {
  const deck = shuffleDeck(createDeck());
  const tableau: CardType[][] = Array(7).fill([]).map(() => []);
  const foundations: CardType[][] = Array(4).fill([]).map(() => []);
  
  // Deal to tableau
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      const card = deck.pop();
      if (card) {
        card.faceUp = (j === i); // Top card face up
        tableau[i].push(card);
      }
    }
  }

  return {
    deck,
    waste: [],
    foundations,
    tableau,
    score: 0,
    moves: 0,
    gameWon: false,
    difficulty
  };
};

export const isValidTableauMove = (cardToMove: CardType, targetTopCard: CardType | undefined): boolean => {
  if (!targetTopCard) {
    return cardToMove.rank === Rank.KING;
  }
  const differentColor = getSuitColor(cardToMove.suit) !== getSuitColor(targetTopCard.suit);
  const descendingRank = cardToMove.rank === targetTopCard.rank - 1;
  return differentColor && descendingRank;
};

export const isValidFoundationMove = (cardToMove: CardType, targetTopCard: CardType | undefined): boolean => {
  if (!targetTopCard) {
    return cardToMove.rank === Rank.ACE;
  }
  const sameSuit = cardToMove.suit === targetTopCard.suit;
  const ascendingRank = cardToMove.rank === targetTopCard.rank + 1;
  return sameSuit && ascendingRank;
};

export const checkWin = (foundations: CardType[][]): boolean => {
  return foundations.every(pile => pile.length === 13);
};