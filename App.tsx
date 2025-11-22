
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './components/Card';
import { EmptyPile } from './components/EmptyPile';
import { GameState, Position, CardType, Rank, Suit, Difficulty } from './types';
import { initGame, isValidTableauMove, isValidFoundationMove, checkWin, createDeck, shuffleDeck } from './utils/solitaire';
import { SUITS } from './constants';

// Simple SVG Icons
const ReloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>(initGame('EASY'));
  const [selected, setSelected] = useState<Position | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);

  const saveHistory = () => {
    const newState = JSON.parse(JSON.stringify(game));
    setHistory(prev => [...prev.slice(-19), newState]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setGame(previousState);
    setHistory(prev => prev.slice(0, -1));
    setSelected(null);
  };

  const handleNewGame = (difficulty: Difficulty = game.difficulty) => {
    setGame(initGame(difficulty));
    setSelected(null);
    setHistory([]);
  };

  const handleDeckClick = () => {
    saveHistory();
    setGame(prev => {
      const newDeck = [...prev.deck];
      const newWaste = [...prev.waste];

      if (newDeck.length === 0) {
        if (newWaste.length === 0) return prev;
        const recycledDeck = newWaste.reverse().map(c => ({ ...c, faceUp: false }));
        return { ...prev, deck: recycledDeck, waste: [], moves: prev.moves + 1 };
      } else {
        const drawCount = prev.difficulty === 'HARD' ? 3 : 1;
        for (let i = 0; i < drawCount; i++) {
          if (newDeck.length === 0) break;
          const card = newDeck.pop();
          if (card) {
            card.faceUp = true;
            newWaste.push(card);
          }
        }
        return { ...prev, deck: newDeck, waste: newWaste, moves: prev.moves + 1 };
      }
    });
    setSelected(null);
  };

  const moveCard = (targetPileType: 'foundation' | 'tableau', targetPileIndex: number) => {
    if (!selected) return;

    let sourceCard: CardType | undefined;
    let sourcePile: CardType[] = [];
    
    if (selected.pileType === 'waste') {
      sourcePile = game.waste;
      sourceCard = sourcePile[sourcePile.length - 1];
    } else if (selected.pileType === 'tableau') {
      sourcePile = game.tableau[selected.pileIndex];
      if (selected.cardIndex !== undefined) {
        sourceCard = sourcePile[selected.cardIndex];
      }
    } else if (selected.pileType === 'foundation') {
       sourcePile = game.foundations[selected.pileIndex];
       sourceCard = sourcePile[sourcePile.length - 1];
    }

    if (!sourceCard) return;

    const cardsToMove: CardType[] = [];
    if (selected.pileType === 'tableau' && selected.cardIndex !== undefined) {
      for (let i = selected.cardIndex; i < sourcePile.length; i++) {
        cardsToMove.push(sourcePile[i]);
      }
    } else {
      cardsToMove.push(sourceCard);
    }

    let isValid = false;
    
    if (targetPileType === 'foundation') {
       if (cardsToMove.length === 1) {
         const targetPile = game.foundations[targetPileIndex];
         const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
         isValid = isValidFoundationMove(cardsToMove[0], targetTop);
       }
    } else if (targetPileType === 'tableau') {
       const targetPile = game.tableau[targetPileIndex];
       const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
       isValid = isValidTableauMove(cardsToMove[0], targetTop);
    }

    if (isValid) {
      saveHistory();
      setGame(prev => {
        const newGame = { ...prev };
        
        if (selected.pileType === 'waste') {
          newGame.waste = newGame.waste.slice(0, -1);
        } else if (selected.pileType === 'foundation') {
          newGame.foundations[selected.pileIndex] = newGame.foundations[selected.pileIndex].slice(0, -1);
        } else if (selected.pileType === 'tableau') {
          const col = newGame.tableau[selected.pileIndex];
          const keepCount = selected.cardIndex!;
          newGame.tableau[selected.pileIndex] = col.slice(0, keepCount);
          
          if (newGame.tableau[selected.pileIndex].length > 0) {
            const lastIdx = newGame.tableau[selected.pileIndex].length - 1;
            newGame.tableau[selected.pileIndex][lastIdx].faceUp = true;
          }
        }

        if (targetPileType === 'foundation') {
          newGame.foundations[targetPileIndex] = [...newGame.foundations[targetPileIndex], ...cardsToMove];
        } else {
          newGame.tableau[targetPileIndex] = [...newGame.tableau[targetPileIndex], ...cardsToMove];
        }

        newGame.moves += 1;
        
        if (checkWin(newGame.foundations)) {
          newGame.gameWon = true;
        }

        return newGame;
      });
      setSelected(null);
    } else {
      setSelected(null);
    }
  };

  const handleCardClick = (pileType: 'waste' | 'foundation' | 'tableau', pileIndex: number, cardIndex?: number) => {
    let clickedCard: CardType | undefined;
    if (pileType === 'waste') {
      if (game.waste.length === 0) return;
      clickedCard = game.waste[game.waste.length - 1];
    } else if (pileType === 'foundation') {
       if (game.foundations[pileIndex].length > 0) {
         clickedCard = game.foundations[pileIndex][game.foundations[pileIndex].length - 1];
       }
    } else if (pileType === 'tableau') {
      if (cardIndex !== undefined) {
        clickedCard = game.tableau[pileIndex][cardIndex];
      }
    }

    if (selected) {
      if (selected.pileType === pileType && selected.pileIndex === pileIndex && selected.cardIndex === cardIndex) {
        setSelected(null);
        return;
      }
      
      if (pileType === 'foundation' || pileType === 'tableau') {
        moveCard(pileType, pileIndex);
        return;
      }
      
      if (clickedCard && clickedCard.faceUp) {
         setSelected({ pileType, pileIndex, cardIndex });
      } else {
         setSelected(null);
      }
    } else {
      if (clickedCard && clickedCard.faceUp) {
        setSelected({ pileType, pileIndex, cardIndex });
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-green-900 text-white font-sans flex flex-col landscape:flex-row safe-padding overflow-hidden">
      
      {/* Responsive Control Panel: Top on Portrait, Side on Landscape */}
      <div className="
          flex flex-row landscape:flex-col 
          justify-between landscape:justify-start 
          items-center landscape:items-stretch
          p-3 bg-green-950 shadow-lg z-20 
          w-full landscape:w-auto landscape:h-full landscape:min-w-[140px]
          gap-3
        ">
        
        {/* Branding & Difficulty */}
        <div className="flex flex-col gap-2 items-start landscape:items-center landscape:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-yellow-400 tracking-wider whitespace-nowrap">
            SOLITAIRE
          </h1>
          <select 
            value={game.difficulty}
            onChange={(e) => handleNewGame(e.target.value as Difficulty)}
            className="bg-green-800 text-white text-xs rounded px-2 py-1 border border-green-600 outline-none focus:ring-1 focus:ring-yellow-400 cursor-pointer w-full"
          >
            <option value="EASY">EASY (1)</option>
            <option value="HARD">HARD (3)</option>
          </select>
        </div>
        
        {/* Stats - Compact in Landscape */}
        <div className="flex landscape:flex-col gap-4 landscape:gap-2 text-xs md:text-sm opacity-80 font-mono landscape:mb-auto landscape:items-center text-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider opacity-60">Score</span>
            <span className="font-bold">{game.score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider opacity-60">Moves</span>
            <span className="font-bold">{game.moves}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center landscape:flex-col gap-3 landscape:w-full">
          <button 
            onClick={undo}
            disabled={history.length === 0}
            className="p-2 md:p-3 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-30 transition-colors landscape:w-full flex justify-center"
            title="Undo"
          >
             <UndoIcon />
          </button>

          <button 
            onClick={() => handleNewGame()}
            className="p-2 md:p-3 bg-green-700 rounded-lg hover:bg-green-600 transition-colors shadow-sm landscape:w-full flex justify-center"
            title="Restart"
          >
            <ReloadIcon />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-grow flex flex-col relative overflow-y-auto overflow-x-hidden">
        <div className="p-2 md:p-4 max-w-[1600px] mx-auto w-full h-full flex flex-col">
          
          {/* Top Row: Deck, Waste, Foundations */}
          <div className="grid grid-cols-7 gap-2 md:gap-4 mb-2 md:mb-6 shrink-0">
            
            {/* Deck */}
            <div className="col-span-1 aspect-[2/3]">
              {game.deck.length > 0 ? (
                  <Card 
                    card={{ id: 'deck', suit: Suit.SPADES, rank: Rank.ACE, faceUp: false }} 
                    onClick={handleDeckClick}
                  />
              ) : (
                <EmptyPile type="deck" onClick={handleDeckClick} label="↺" />
              )}
            </div>

            {/* Waste */}
            <div className="col-span-1 aspect-[2/3] relative">
              {game.waste.length > 0 ? (
                game.waste.slice(-3).map((card, i, arr) => {
                  const isTop = i === arr.length - 1;
                  return (
                    <div 
                      key={card.id} 
                      className="absolute inset-0 shadow-md rounded-lg transition-transform"
                      style={{ 
                        transform: `translateX(${i * 12}%)`, // Tighter fan on mobile
                        zIndex: i 
                      }}
                    >
                      <Card 
                          card={card} 
                          onClick={isTop ? () => handleCardClick('waste', 0) : undefined}
                          isSelected={isTop && selected?.pileType === 'waste'}
                        />
                    </div>
                  );
                })
              ) : (
                <EmptyPile type="waste" />
              )}
            </div>

            {/* Spacer */}
            <div className="col-span-1"></div>

            {/* Foundations */}
            {game.foundations.map((pile, index) => (
              <div key={`foundation-${index}`} className="col-span-1 aspect-[2/3]">
                {pile.length > 0 ? (
                  <Card 
                    card={pile[pile.length - 1]}
                    onClick={() => handleCardClick('foundation', index)}
                    isSelected={selected?.pileType === 'foundation' && selected.pileIndex === index}
                  />
                ) : (
                  <EmptyPile 
                    type="foundation" 
                    suit={SUITS[index]} 
                    onClick={() => handleCardClick('foundation', index)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Tableau Area */}
          <div className="grid grid-cols-7 gap-2 md:gap-4 flex-grow pb-20">
            {game.tableau.map((pile, pileIndex) => (
              <div key={`tableau-${pileIndex}`} className="relative col-span-1 h-full">
                  {pile.length === 0 ? (
                    <div className="aspect-[2/3]">
                      <EmptyPile type="tableau" onClick={() => handleCardClick('tableau', pileIndex)} />
                    </div>
                  ) : (
                    pile.map((card, cardIndex) => {
                      const isSelected = selected?.pileType === 'tableau' && selected.pileIndex === pileIndex && selected.cardIndex === cardIndex;
                      // Dynamic offset based on if card is face up or down to save space
                      // Face down cards can be tighter
                      const prevCards = pile.slice(0, cardIndex);
                      const faceDownCount = prevCards.filter(c => !c.faceUp).length;
                      const faceUpCount = prevCards.filter(c => c.faceUp).length;
                      
                      // Compact calculations:
                      // Face down: 8px spacing
                      // Face up: 24px spacing (enough to see rank)
                      // This ensures tall stacks don't run off screen as fast
                      const topOffset = `${(faceDownCount * 8) + (faceUpCount * 26)}px`;
                      
                      return (
                        <div 
                          key={card.id} 
                          className="absolute w-full aspect-[2/3]"
                          style={{ top: topOffset, zIndex: cardIndex }}
                        >
                          <Card 
                            card={card}
                            isSelected={isSelected}
                            onClick={() => handleCardClick('tableau', pileIndex, cardIndex)}
                          />
                        </div>
                      );
                    })
                  )}
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* Win Modal */}
      {game.gameWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white text-black p-6 md:p-8 rounded-2xl shadow-2xl text-center max-w-md w-full animate-bounce-in">
              <h2 className="text-3xl md:text-4xl font-bold text-green-600 mb-4">VICTORY!</h2>
              <p className="text-gray-600 mb-6">Solved in {game.moves} moves.</p>
              <button 
                onClick={() => handleNewGame()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg w-full"
              >
                Play Again
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
