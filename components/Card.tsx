import React from 'react';
import { CardType, Rank, Suit } from '../types';
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
const CourtCardVisual = ({ rank, suit, colorClass }: { rank: Rank; suit: Suit; colorClass: string }) => {
  const isRed = colorClass.includes('red');
  const mainColor = isRed ? '#d32f2f' : '#212121'; // Red or Black
  const secondaryColor = isRed ? '#ef5350' : '#424242'; 
  const gold = '#fbc02d'; // Gold/Yellow
  const skin = '#ffe0b2'; // Skin tone
  const blue = '#1976d2'; // Blue accents
  const clothingColor = isRed ? blue : '#c62828'; // Contrast for clothes

  // Common Face Component
  const Face = () => (
    <g>
      <path d="M35,30 Q50,25 65,30 L65,55 Q50,65 35,55 Z" fill={skin} stroke="#000" strokeWidth="0.5" />
      {/* Hair backing */}
      <path d="M35,30 Q30,45 35,55" fill="none" stroke="#000" strokeWidth="0.5" /> 
      <path d="M65,30 Q70,45 65,55" fill="none" stroke="#000" strokeWidth="0.5" />
      
      {/* Face Details */}
      <g fill="#000" opacity="0.8">
         <circle cx="43" cy="40" r="1.5" />
         <circle cx="57" cy="40" r="1.5" />
         <path d="M50,42 L48,48 L52,48 Z" /> {/* Nose */}
         <path d="M46,52 Q50,54 54,52" fill="none" stroke="#000" strokeWidth="0.5" /> {/* Mouth */}
      </g>
    </g>
  );

  const KingContent = () => (
    <g>
       {/* Sword Behind */}
       <path d="M20,20 L80,80" stroke={gold} strokeWidth="6" strokeLinecap="round" opacity="0.5" />
       
       {/* Shoulders/Robe */}
       <path d="M15,75 L15,50 Q20,40 30,45 L70,45 Q80,40 85,50 L85,75" fill={mainColor} stroke="#000" strokeWidth="0.5" />
       <rect x="30" y="45" width="40" height="30" fill={clothingColor} stroke="#000" strokeWidth="0.5" />
       
       {/* Pattern on Robe */}
       <path d="M30,45 L70,75 M70,45 L30,75" stroke="#fff" strokeWidth="0.5" opacity="0.3" />

       <Face />
       
       {/* Beard/Hair */}
       <path d="M35,30 Q30,40 35,50 Q50,60 65,50 Q70,40 65,30" fill="none" stroke="#fff" strokeWidth="4" opacity="0.8" />
       <path d="M40,50 Q50,58 60,50" fill="none" stroke="#000" strokeWidth="0.5" />

       {/* Crown */}
       <path d="M30,30 L30,15 L40,25 L50,10 L60,25 L70,15 L70,30 Z" fill={gold} stroke="#000" strokeWidth="0.5" />
       <circle cx="50" cy="8" r="3" fill={mainColor} stroke="#000" strokeWidth="0.5" />
       
       {/* Hand holding sword hilt? */}
       <circle cx="20" cy="60" r="6" fill={skin} stroke="#000" strokeWidth="0.5" />
    </g>
  );

  const QueenContent = () => (
    <g>
       {/* Shoulders/Dress */}
       <path d="M20,75 L20,55 Q30,45 40,50 L60,50 Q70,45 80,55 L80,75" fill={clothingColor} stroke="#000" strokeWidth="0.5" />
       <path d="M40,50 L60,50 L50,75 Z" fill={mainColor} stroke="#000" strokeWidth="0.5" />
       
       {/* Flower Stem */}
       <path d="M70,30 L70,75" stroke="green" strokeWidth="2" />
       
       <Face />
       
       {/* Hair */}
       <path d="M35,30 Q25,40 35,55" fill="none" stroke="#fff" strokeWidth="3" />
       <path d="M65,30 Q75,40 65,55" fill="none" stroke="#fff" strokeWidth="3" />

       {/* Crown/Veil */}
       <path d="M35,30 Q50,15 65,30" fill={gold} stroke="#000" strokeWidth="0.5" />
       <circle cx="50" cy="22" r="3" fill={mainColor} />
       
       {/* Flower */}
       <g transform="translate(70, 35)">
          <circle r="5" fill="#fff" stroke="#000" strokeWidth="0.5" />
          <circle r="2" fill={gold} />
       </g>
    </g>
  );

  const JackContent = () => (
    <g>
      {/* Halberd Shaft */}
      <path d="M15,10 L15,75" stroke="#4a3b2a" strokeWidth="3" />
      
      {/* Shoulders */}
      <path d="M20,75 L20,50 L35,45 L65,45 L80,50 L80,75" fill={clothingColor} stroke="#000" strokeWidth="0.5" />
      <rect x="35" y="45" width="30" height="30" fill={mainColor} stroke="#000" strokeWidth="0.5" />
      
      {/* Collar */}
      <path d="M35,45 L50,55 L65,45" fill="#fff" stroke="#000" strokeWidth="0.5" />

      <Face />
      
      {/* Hat */}
      <path d="M35,30 L25,20 L40,20 L60,20 L75,20 L65,30 Z" fill={gold} stroke="#000" strokeWidth="0.5" />
      <path d="M40,20 L50,10 L60,20" fill={mainColor} stroke="#000" strokeWidth="0.5" />
      
      {/* Feather */}
      <path d="M70,20 Q80,10 85,25" fill="none" stroke={mainColor} strokeWidth="2" />
    </g>
  );

  let Content = null;
  if (rank === Rank.KING) Content = KingContent;
  if (rank === Rank.QUEEN) Content = QueenContent;
  if (rank === Rank.JACK) Content = JackContent;

  if (!Content) return null;

  return (
    <svg viewBox="0 0 100 150" className="w-full h-full p-2 md:p-4 opacity-90">
       <defs>
          <clipPath id="halfClip">
             <rect x="0" y="0" width="100" height="75" />
          </clipPath>
       </defs>
       
       <rect x="5" y="5" width="90" height="140" fill="none" stroke={mainColor} strokeWidth="1.5" rx="5" />
       
       <g>
          {/* Top Half */}
          <g clipPath="url(#halfClip)">
            <Content />
          </g>
          
          {/* Bottom Half (Rotated 180 degrees) */}
          <g transform="rotate(180, 50, 75)" clipPath="url(#halfClip)">
            <Content />
          </g>
          
          {/* Dividing Line */}
          <line x1="10" y1="75" x2="90" y2="75" stroke={mainColor} strokeWidth="0.5" opacity="0.3" />
       </g>
    </svg>
  );
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
      <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col items-center leading-none z-10">
        <span className="font-bold text-lg md:text-2xl tracking-tighter">{rankLabel}</span>
        <span className="text-lg md:text-2xl">{symbol}</span>
      </div>

      {/* Center Content */}
      <div className="absolute inset-0 flex justify-center items-center">
        {isCourtCard ? (
          <CourtCardVisual rank={card.rank} suit={card.suit} colorClass={colorClass} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8">
             {/* For non-court cards, maybe show multiple pips if needed, but for now single big pip is standard for this simplified UI */}
             <span className="text-5xl md:text-7xl opacity-20 transform scale-150">{symbol}</span>
          </div>
        )}
      </div>

      {/* Bottom Right (Rotated) */}
      <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 flex flex-col items-center leading-none transform rotate-180 z-10">
        <span className="font-bold text-lg md:text-2xl tracking-tighter">{rankLabel}</span>
        <span className="text-lg md:text-2xl">{symbol}</span>
      </div>
    </div>
  );
};