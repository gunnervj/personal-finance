'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
}) => {
  if (!hover) {
    return (
      <div
        className={`bg-[#111936] rounded-xl shadow-lg border border-gray-800 p-6 ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-[#111936] rounded-xl shadow-lg border border-gray-800 p-6 cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
};
