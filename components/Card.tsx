import React from 'react';
import { CardType, Rank } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS, RANK_LABELS } from '../constants';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

// Internal component for Court Cards (Jack, Queen, King)
const CourtCardVisual = ({ rank, colorClass }: { rank: Rank; colorClass: string }) => {
  const isRed = colorClass.includes('red');
  const primaryColor = isRed ? '#dc2626' : '#1f2937'; // red-600 : gray-800
  const secondaryColor = isRed ? '#fca5a5' : '#9ca3af'; // red-300 : gray-400
  const gold = '#fbbf24'; // amber-400

  if (rank === Rank.KING) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-4">
        {/* Crown Base */}
        <path d="M20,75 Q50,85 80,75 L80,65 L20,65 Z" fill={gold} stroke={primaryColor} strokeWidth="2" />
        {/* Crown Body */}
        <path d="M20,65 L10,30 L35,50 L50,15 L65,50 L90,30 L80,65 Z" fill="none" stroke={primaryColor} strokeWidth="3" />
        <path d="M20,65 L10,30 L35,50 L50,15 L65,50 L90,30 L80,65 Z" fill={gold} opacity="0.3" />
        
        {/* Cross on top */}
        <rect x="47" y="5" width="6" height="10" fill={primaryColor} />
        <rect x="42" y="8" width="16" height="4" fill={primaryColor} />
        
        {/* Jewels */}
        <circle cx="10" cy="30" r="3" fill={secondaryColor} />
        <circle cx="90" cy="30" r="3" fill={secondaryColor} />
        <circle cx="50" cy="55" r="5" fill={isRed ? '#ef4444' : '#374151'} />
        
        {/* Face/Beard Implication */}
        <path d="M35,75 Q50,95 65,75" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.5" />
      </svg>
    );
  }

  if (rank === Rank.QUEEN) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-4">
        {/* Tiara */}
        <path d="M25,70 Q50,80 75,70 L85,40 Q50,60 15,40 Z" fill={gold} stroke={primaryColor} strokeWidth="2" />
        
        {/* Arches */}
        <path d="M15,40 Q30,10 50,35 Q70,10 85,40" fill="none" stroke={primaryColor} strokeWidth="3" />
        
        {/* Gems */}
        <circle cx="50" cy="35" r="6" fill={secondaryColor} stroke={primaryColor} strokeWidth="1"/>
        <circle cx="30" cy="25" r="3" fill={primaryColor} />
        <circle cx="70" cy="25" r="3" fill={primaryColor} />
        
        {/* Hair/Face implication */}
        <path d="M30,70 Q50,90 70,70" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.5"/>
      </svg>
    );
  }

  if (rank === Rank.JACK) {
    // Duke / Prince style
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-4">
        {/* Cap */}
        <path d="M20,60 Q50,50 80,60 L70,30 Q50,20 30,30 Z" fill={secondaryColor} stroke={primaryColor} strokeWidth="2" />
        <path d="M20,60 L20,70 Q50,80 80,70 L80,60" fill={gold} stroke={primaryColor} strokeWidth="2" />
        
        {/* Feather */}
        <path d="M70,35 Q90,10 60,10 Q80,10 70,35" fill={primaryColor} stroke={primaryColor} strokeWidth="1" />
        
        {/* Collar/Shoulders */}
        <path d="M25,70 L25,85 L75,85 L75,70" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.4" />
      </svg>
    );
  }

  return null;
};

export const Card: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  onDoubleClick,
  isSelected, 
  className = '', 
  style,
  draggable,
  onDragStart
}) => {
  if (!card.faceUp) {
    return (
      <div
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        style={style}
        className={`relative w-full h-full rounded-lg bg-blue-800 border-2 border-white shadow-md ${className} 
        bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]`}
      >
        <div className="absolute inset-2 border border-blue-400 rounded opacity-50"></div>
      </div>
    );
  }

  const colorClass = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  const rankLabel = RANK_LABELS[card.rank] || card.rank.toString();
  const isCourtCard = card.rank === Rank.JACK || card.rank === Rank.QUEEN || card.rank === Rank.KING;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={style}
      className={`
        relative w-full h-full bg-white rounded-lg shadow-md select-none
        transition-transform duration-100 overflow-hidden
        ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-2 shadow-xl z-50' : 'hover:-translate-y-0.5'}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${colorClass} ${className}
      `}
    >
      {/* Top Left */}
      <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col items-center leading-none">
        <span className="font-bold text-xl md:text-3xl tracking-tighter">{rankLabel}</span>
        <span className="text-xl md:text-3xl">{symbol}</span>
      </div>

      {/* Center Content */}
      <div className="absolute inset-0 flex justify-center items-center p-4 md:p-6">
        {isCourtCard ? (
          <CourtCardVisual rank={card.rank} colorClass={colorClass} />
        ) : (
          <span className="text-6xl md:text-8xl opacity-20">{symbol}</span>
        )}
      </div>

      {/* Bottom Right (Rotated) */}
      <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 flex flex-col items-center leading-none transform rotate-180">
        <span className="font-bold text-xl md:text-3xl tracking-tighter">{rankLabel}</span>
        <span className="text-xl md:text-3xl">{symbol}</span>
      </div>
    </div>
  );
};