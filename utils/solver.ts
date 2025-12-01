import { GameState, Position, PileType } from '../types';
import { executeMove, executeDraw, checkWin, isValidFoundationMove, isValidTableauMove } from './solitaire';

interface Move {
    type: 'MOVE' | 'DRAW';
    source?: Position;
    targetPile?: PileType;
    targetIndex?: number;
    priority: number;
}

// Generates a string hash of the game state to detect cycles and visited states
const getStateHash = (state: GameState): string => {
    // We only need to hash the mutable parts that define the gameplay state
    // Deck index/content, Waste top, Foundations tops, Tableau structure
    // Simplifying to just IDs of key cards
    
    const fHash = state.foundations.map(f => f.length > 0 ? f[f.length-1].id : 'X').join('|');
    
    // For tableau, we need face-up cards and the count of face-down cards
    const tHash = state.tableau.map(t => {
        const faceUp = t.filter(c => c.faceUp).map(c => c.id).join(',');
        const faceDownCount = t.filter(c => !c.faceUp).length;
        return `${faceDownCount}:${faceUp}`;
    }).join('|');

    const wHash = state.waste.length > 0 ? state.waste[state.waste.length-1].id : 'X';
    // Deck state is defined by the cards remaining. Since deck order is static until recycle, just length + top is enough or just joining all is safest.
    const dHash = state.deck.length; 

    return `D${dHash}-W${wHash}-F${fHash}-T${tHash}`;
};

const getPossibleMoves = (state: GameState): Move[] => {
    const moves: Move[] = [];

    // 1. Check moves from Tableau to Foundation/Tableau
    state.tableau.forEach((pile, pileIndex) => {
        if (pile.length === 0) return;
        
        // Check moves for all face-up cards (technically only top for Foundation, but stack for Tableau)
        // Optimization: Only move the deepest face-up card valid for a tableau move to avoid breaking stacks unnecessarily? 
        // No, standard rules allow moving any substack.
        
        pile.forEach((card, cardIndex) => {
            if (!card.faceUp) return;
            
            const isTopCard = cardIndex === pile.length - 1;

            // To Foundation (Only top card)
            if (isTopCard) {
                state.foundations.forEach((_, fIndex) => {
                   const targetTop = state.foundations[fIndex].length > 0 ? state.foundations[fIndex][state.foundations[fIndex].length - 1] : undefined;
                   if (isValidFoundationMove(card, targetTop)) {
                       moves.push({
                           type: 'MOVE',
                           source: { pileType: 'tableau', pileIndex, cardIndex },
                           targetPile: 'foundation',
                           targetIndex: fIndex,
                           priority: 100 // Highest priority
                       });
                   }
                });
            }

            // To Tableau
            state.tableau.forEach((_, tIndex) => {
                if (pileIndex === tIndex) return; // Don't move to self
                
                const targetPile = state.tableau[tIndex];
                const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
                
                if (isValidTableauMove(card, targetTop)) {
                    // Heuristic: Prefer moving a king to an empty spot only if it reveals a card or clears waste
                    const isKingMove = card.rank === 13 && targetPile.length === 0;
                    // If moving from a tableau column where this is the bottom-most face-up card, check if it reveals a face-down card
                    const revealsCard = cardIndex > 0 && !pile[cardIndex-1].faceUp;
                    const clearsColumn = cardIndex === 0; // Emptying a column is good if we have a King to put there

                    let priority = 10;
                    if (revealsCard) priority = 50;
                    if (isKingMove && !revealsCard) priority = 5; // Low priority to just move King between empty spots
                    if (!isKingMove && !revealsCard) priority = 15;

                    moves.push({
                        type: 'MOVE',
                        source: { pileType: 'tableau', pileIndex, cardIndex },
                        targetPile: 'tableau',
                        targetIndex: tIndex,
                        priority
                    });
                }
            });
        });
    });

    // 2. Check moves from Waste
    if (state.waste.length > 0) {
        const card = state.waste[state.waste.length - 1];
        
        // To Foundation
        state.foundations.forEach((_, fIndex) => {
            const targetTop = state.foundations[fIndex].length > 0 ? state.foundations[fIndex][state.foundations[fIndex].length - 1] : undefined;
            if (isValidFoundationMove(card, targetTop)) {
                moves.push({
                    type: 'MOVE',
                    source: { pileType: 'waste', pileIndex: 0 },
                    targetPile: 'foundation',
                    targetIndex: fIndex,
                    priority: 90
                });
            }
        });

        // To Tableau
        state.tableau.forEach((_, tIndex) => {
            const targetPile = state.tableau[tIndex];
            const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
            if (isValidTableauMove(card, targetTop)) {
                 moves.push({
                    type: 'MOVE',
                    source: { pileType: 'waste', pileIndex: 0 },
                    targetPile: 'tableau',
                    targetIndex: tIndex,
                    priority: 40
                });
            }
        });
    }

    // 3. Draw/Recycle
    // Always possible if deck or waste has cards
    if (state.deck.length > 0 || state.waste.length > 0) {
         moves.push({
            type: 'DRAW',
            priority: 1 // Low priority, try to move cards first
        });
    }

    return moves;
};

export const checkSolvability = async (initialState: GameState, maxIterations: number = 2000): Promise<'SOLVABLE' | 'UNSOLVABLE' | 'UNKNOWN'> => {
    // Use a promise to avoid blocking UI immediately, though logic is synchronous
    return new Promise((resolve) => {
        setTimeout(() => {
            const visited = new Set<string>();
            const queue: GameState[] = [initialState];
            let iterations = 0;

            while (queue.length > 0) {
                iterations++;
                if (iterations > maxIterations) {
                    resolve('UNKNOWN');
                    return;
                }

                // Optimization: Pop from end (DFS) to go deep quickly.
                const currentState = queue.pop()!;

                if (checkWin(currentState.foundations)) {
                    resolve('SOLVABLE');
                    return;
                }

                const hash = getStateHash(currentState);
                if (visited.has(hash)) continue;
                visited.add(hash);

                const moves = getPossibleMoves(currentState);
                // Sort by priority to check most likely winning moves first
                moves.sort((a, b) => a.priority - b.priority);

                for (const move of moves) {
                    let nextState: GameState | null = null;
                    if (move.type === 'DRAW') {
                        // Avoid drawing if we just cycled and changed nothing?
                        // Hash checks should handle cycles, but drawing is infinite loop if we don't change anything else.
                        nextState = executeDraw(currentState);
                    } else {
                        nextState = executeMove(currentState, move.source!, move.targetPile!, move.targetIndex!);
                    }

                    if (nextState) {
                        // Quick check before pushing
                        if (checkWin(nextState.foundations)) {
                            resolve('SOLVABLE');
                            return;
                        }
                        queue.push(nextState);
                    }
                }
            }

            resolve('UNSOLVABLE');
        }, 0);
    });
};