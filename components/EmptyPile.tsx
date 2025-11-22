import React from 'react';
import { Suit } from '../types';
import { SUIT_SYMBOLS } from '../constants';

interface EmptyPileProps {
  type: 'foundation' | 'tableau' | 'waste' | 'deck';
  suit?: Suit;
  onClick?: () => void;
  label?: string;
}

export const EmptyPile: React.FC<EmptyPileProps> = ({ type, suit, onClick, label }) => {
  return (
    <div
      onClick={onClick}
      className={`
        w-full h-full rounded-lg border-2 border-dashed border-white/30 
        flex items-center justify-center
        ${onClick ? 'cursor-pointer hover:bg-white/10' : ''}
      `}
    >
      {suit && (
        <span className="text-3xl text-white/20 select-none">
          {SUIT_SYMBOLS[suit]}
        </span>
      )}
      {label && (
        <span className="text-xs text-white/40 font-bold uppercase tracking-widest select-none">
          {label}
        </span>
      )}
    </div>
  );
};
