import { CardType, Suit, Rank, Color, GameState, Difficulty, Position, PileType } from '../types';
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

// --- Solver Helpers ---

export const cloneState = (state: GameState): GameState => {
  return {
    ...state,
    deck: [...state.deck],
    waste: [...state.waste],
    foundations: state.foundations.map(f => [...f]),
    tableau: state.tableau.map(t => t.map(c => ({...c}))), // Deep copy cards in tableau to handle faceUp changes
  };
};

export const executeDraw = (state: GameState): GameState => {
  const newState = cloneState(state);
  
  if (newState.deck.length === 0) {
    if (newState.waste.length === 0) return newState;
    // Recycle waste to deck
    newState.deck = newState.waste.reverse().map(c => ({ ...c, faceUp: false }));
    newState.waste = [];
  } else {
    const drawCount = state.difficulty === 'HARD' ? 3 : 1;
    for (let i = 0; i < drawCount; i++) {
      if (newState.deck.length === 0) break;
      const card = newState.deck.pop();
      if (card) {
        card.faceUp = true;
        newState.waste.push(card);
      }
    }
  }
  newState.moves += 1;
  return newState;
};

export const executeMove = (
  state: GameState, 
  source: Position, 
  targetPileType: PileType, 
  targetPileIndex: number
): GameState | null => {
  const newState = cloneState(state);
  let sourceCard: CardType | undefined;
  let sourcePile: CardType[] = [];
  
  // 1. Identify Source
  if (source.pileType === 'waste') {
    sourcePile = newState.waste;
    sourceCard = sourcePile[sourcePile.length - 1];
  } else if (source.pileType === 'tableau') {
    sourcePile = newState.tableau[source.pileIndex];
    if (source.cardIndex !== undefined) {
      sourceCard = sourcePile[source.cardIndex];
    }
  } else if (source.pileType === 'foundation') {
     sourcePile = newState.foundations[source.pileIndex];
     sourceCard = sourcePile[sourcePile.length - 1];
  }

  if (!sourceCard) return null;

  // 2. Identify Cards to Move
  const cardsToMove: CardType[] = [];
  if (source.pileType === 'tableau' && source.cardIndex !== undefined) {
    for (let i = source.cardIndex; i < sourcePile.length; i++) {
      cardsToMove.push(sourcePile[i]);
    }
  } else {
    cardsToMove.push(sourceCard);
  }

  // 3. Validate Target
  let isValid = false;
  if (targetPileType === 'foundation') {
     if (cardsToMove.length === 1) {
       const targetPile = newState.foundations[targetPileIndex];
       const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
       isValid = isValidFoundationMove(cardsToMove[0], targetTop);
     }
  } else if (targetPileType === 'tableau') {
     const targetPile = newState.tableau[targetPileIndex];
     const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
     isValid = isValidTableauMove(cardsToMove[0], targetTop);
  }

  if (!isValid) return null;

  // 4. Execute Move
  // Remove from source
  if (source.pileType === 'waste') {
    newState.waste.pop();
  } else if (source.pileType === 'foundation') {
    newState.foundations[source.pileIndex].pop();
  } else if (source.pileType === 'tableau') {
    const col = newState.tableau[source.pileIndex];
    const keepCount = source.cardIndex!;
    newState.tableau[source.pileIndex] = col.slice(0, keepCount);
    
    // Flip new top card
    if (newState.tableau[source.pileIndex].length > 0) {
      const lastIdx = newState.tableau[source.pileIndex].length - 1;
      newState.tableau[source.pileIndex][lastIdx].faceUp = true;
    }
  }

  // Add to target
  if (targetPileType === 'foundation') {
    newState.foundations[targetPileIndex].push(...cardsToMove);
  } else {
    newState.tableau[targetPileIndex].push(...cardsToMove);
  }

  newState.moves += 1;
  return newState;
};