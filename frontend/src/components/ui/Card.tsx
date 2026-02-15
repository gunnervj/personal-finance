import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false
}) => {
  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6 ${
        hover ? 'transition-all duration-300 hover:shadow-blue-500/20 hover:border-blue-500/30' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
