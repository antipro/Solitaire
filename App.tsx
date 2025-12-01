import React, { useState } from 'react';
import { Card } from './components/Card';
import { EmptyPile } from './components/EmptyPile';
import { GameState, Position, CardType, Rank, Suit, Difficulty, PileType } from './types';
import { initGame, isValidTableauMove, isValidFoundationMove, checkWin } from './utils/solitaire';
import { checkSolvability } from './utils/solver';
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

const SolverIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>(() => initGame('EASY'));
  const [selected, setSelected] = useState<Position | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [solverStatus, setSolverStatus] = useState<'IDLE' | 'CHECKING' | 'SOLVABLE' | 'UNSOLVABLE' | 'UNKNOWN'>('IDLE');

  const saveHistory = () => {
    const newState = JSON.parse(JSON.stringify(game));
    setHistory(prev => [...prev.slice(-19), newState]);
    // Reset solver status when state changes
    setSolverStatus('IDLE');
  };

  const undo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setGame(previousState);
    setHistory(prev => prev.slice(0, -1));
    setSelected(null);
    setSolverStatus('IDLE');
  };

  const handleNewGame = (difficulty: Difficulty = game.difficulty) => {
    setGame(initGame(difficulty));
    setSelected(null);
    setHistory([]);
    setSolverStatus('IDLE');
  };

  const handleCheckSolvability = async () => {
    if (game.gameWon) return;
    setSolverStatus('CHECKING');
    const result = await checkSolvability(game);
    setSolverStatus(result);
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

  // Core move logic separated from event handling
  const attemptMove = (source: Position, targetPileType: PileType, targetPileIndex: number): boolean => {
    let sourceCard: CardType | undefined;
    let sourcePile: CardType[] = [];
    
    if (source.pileType === 'waste') {
      sourcePile = game.waste;
      sourceCard = sourcePile[sourcePile.length - 1];
    } else if (source.pileType === 'tableau') {
      sourcePile = game.tableau[source.pileIndex];
      if (source.cardIndex !== undefined) {
        sourceCard = sourcePile[source.cardIndex];
      }
    } else if (source.pileType === 'foundation') {
       sourcePile = game.foundations[source.pileIndex];
       sourceCard = sourcePile[sourcePile.length - 1];
    }

    if (!sourceCard) return false;

    const cardsToMove: CardType[] = [];
    if (source.pileType === 'tableau' && source.cardIndex !== undefined) {
      for (let i = source.cardIndex; i < sourcePile.length; i++) {
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
        
        if (source.pileType === 'waste') {
          newGame.waste = newGame.waste.slice(0, -1);
        } else if (source.pileType === 'foundation') {
          newGame.foundations[source.pileIndex] = newGame.foundations[source.pileIndex].slice(0, -1);
        } else if (source.pileType === 'tableau') {
          const col = newGame.tableau[source.pileIndex];
          const keepCount = source.cardIndex!;
          newGame.tableau[source.pileIndex] = col.slice(0, keepCount);
          
          if (newGame.tableau[source.pileIndex].length > 0) {
            const lastIdx = newGame.tableau[source.pileIndex].length - 1;
            newGame.tableau[source.pileIndex][lastIdx].faceUp = true;
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
      return true;
    }
    return false;
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
      // Deselect if clicking same card
      if (selected.pileType === pileType && selected.pileIndex === pileIndex && selected.cardIndex === cardIndex) {
        setSelected(null);
        return;
      }
      
      // Attempt move to clicked location
      if (pileType === 'foundation' || pileType === 'tableau') {
        const success = attemptMove(selected, pileType, pileIndex);
        if (success) {
          setSelected(null);
          return;
        }
      }
      
      // If move failed or clicked unrelated pile, change selection
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

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, position: Position) => {
    e.stopPropagation();
    // Encode position data
    e.dataTransfer.setData('application/json', JSON.stringify(position));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPileType: PileType, targetPileIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const source = JSON.parse(data) as Position;
      if (source.pileType === targetPileType && source.pileIndex === targetPileIndex) return;
      
      const success = attemptMove(source, targetPileType, targetPileIndex);
      if (success) {
        setSelected(null);
      }
    } catch (err) {
      console.error('Invalid drag data', err);
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

        {/* Solver Status Display */}
        {solverStatus !== 'IDLE' && (
           <div className={`
             text-[10px] font-bold px-2 py-1 rounded text-center mb-2 animate-pulse
             ${solverStatus === 'CHECKING' ? 'bg-blue-500 text-white' : ''}
             ${solverStatus === 'SOLVABLE' ? 'bg-green-500 text-white' : ''}
             ${solverStatus === 'UNSOLVABLE' ? 'bg-red-500 text-white' : ''}
             ${solverStatus === 'UNKNOWN' ? 'bg-gray-500 text-white' : ''}
           `}>
             {solverStatus === 'CHECKING' && 'ANALYZING...'}
             {solverStatus === 'SOLVABLE' && 'SOLVABLE'}
             {solverStatus === 'UNSOLVABLE' && 'UNSOLVABLE'}
             {solverStatus === 'UNKNOWN' && 'COMPLEX'}
           </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center landscape:flex-col gap-3 landscape:w-full">
          <button 
             onClick={handleCheckSolvability}
             disabled={solverStatus === 'CHECKING' || game.gameWon}
             className="p-2 md:p-3 bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-30 transition-colors landscape:w-full flex justify-center"
             title="Check Solvability"
           >
             <SolverIcon />
           </button>

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
                        transform: `translateX(${i * 12}%)`, 
                        zIndex: i 
                      }}
                    >
                      <Card 
                          card={card} 
                          onClick={isTop ? () => handleCardClick('waste', 0) : undefined}
                          isSelected={isTop && selected?.pileType === 'waste'}
                          draggable={isTop}
                          onDragStart={(e) => isTop && handleDragStart(e, { pileType: 'waste', pileIndex: 0 })}
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
              <div 
                key={`foundation-${index}`} 
                className="col-span-1 aspect-[2/3]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'foundation', index)}
              >
                {pile.length > 0 ? (
                  <Card 
                    card={pile[pile.length - 1]}
                    onClick={() => handleCardClick('foundation', index)}
                    isSelected={selected?.pileType === 'foundation' && selected.pileIndex === index}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, { pileType: 'foundation', pileIndex: index })}
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
              <div 
                key={`tableau-${pileIndex}`} 
                className="relative col-span-1 h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'tableau', pileIndex)}
              >
                  {pile.length === 0 ? (
                    <div className="aspect-[2/3]">
                      <EmptyPile type="tableau" onClick={() => handleCardClick('tableau', pileIndex)} />
                    </div>
                  ) : (
                    pile.map((card, cardIndex) => {
                      const isSelected = selected?.pileType === 'tableau' && selected.pileIndex === pileIndex && selected.cardIndex === cardIndex;
                      // Dynamic offset based on if card is face up or down to save space
                      const prevCards = pile.slice(0, cardIndex);
                      const faceDownCount = prevCards.filter(c => !c.faceUp).length;
                      const faceUpCount = prevCards.filter(c => c.faceUp).length;
                      
                      // Increased faceUp offset from 26 to 45 to show Rank/Suit
                      const topOffset = `${(faceDownCount * 8) + (faceUpCount * 45)}px`;
                      
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
                            draggable={card.faceUp}
                            onDragStart={(e) => card.faceUp && handleDragStart(e, { pileType: 'tableau', pileIndex: pileIndex, cardIndex: cardIndex })}
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