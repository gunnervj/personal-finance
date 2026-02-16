'use client';

import React, { useState } from 'react';
import {
  Home, Car, ShoppingCart, Utensils, Zap, Heart, Briefcase, GraduationCap,
  Phone, Tv, Coffee, Shirt, Plane, Gift, Wrench, DollarSign, Music,
  Dumbbell, PiggyBank, CreditCard, Fuel, UtensilsCrossed, Film, GamepadIcon,
  Palette, Stethoscope, Baby, Dog, Flower, Sparkles
} from 'lucide-react';

const ICONS = [
  { name: 'home', Icon: Home, label: 'Home' },
  { name: 'car', Icon: Car, label: 'Car' },
  { name: 'shopping-cart', Icon: ShoppingCart, label: 'Shopping' },
  { name: 'utensils', Icon: Utensils, label: 'Food' },
  { name: 'zap', Icon: Zap, label: 'Utilities' },
  { name: 'heart', Icon: Heart, label: 'Health' },
  { name: 'briefcase', Icon: Briefcase, label: 'Work' },
  { name: 'graduation-cap', Icon: GraduationCap, label: 'Education' },
  { name: 'phone', Icon: Phone, label: 'Phone' },
  { name: 'tv', Icon: Tv, label: 'Entertainment' },
  { name: 'coffee', Icon: Coffee, label: 'Coffee' },
  { name: 'shirt', Icon: Shirt, label: 'Clothing' },
  { name: 'plane', Icon: Plane, label: 'Travel' },
  { name: 'gift', Icon: Gift, label: 'Gifts' },
  { name: 'wrench', Icon: Wrench, label: 'Maintenance' },
  { name: 'dollar-sign', Icon: DollarSign, label: 'Finance' },
  { name: 'music', Icon: Music, label: 'Music' },
  { name: 'dumbbell', Icon: Dumbbell, label: 'Fitness' },
  { name: 'piggy-bank', Icon: PiggyBank, label: 'Savings' },
  { name: 'credit-card', Icon: CreditCard, label: 'Credit' },
  { name: 'fuel', Icon: Fuel, label: 'Fuel' },
  { name: 'utensils-crossed', Icon: UtensilsCrossed, label: 'Dining' },
  { name: 'film', Icon: Film, label: 'Movies' },
  { name: 'gamepad', Icon: GamepadIcon, label: 'Gaming' },
  { name: 'palette', Icon: Palette, label: 'Hobbies' },
  { name: 'stethoscope', Icon: Stethoscope, label: 'Medical' },
  { name: 'baby', Icon: Baby, label: 'Childcare' },
  { name: 'dog', Icon: Dog, label: 'Pets' },
  { name: 'flower', Icon: Flower, label: 'Garden' },
  { name: 'sparkles', Icon: Sparkles, label: 'Other' },
];

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedIconData = ICONS.find(icon => icon.name === selectedIcon) || ICONS[0];
  const SelectedIcon = selectedIconData.Icon;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Icon
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <SelectedIcon className="w-5 h-5" />
          <span>{selectedIconData.label}</span>
        </div>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-80 overflow-y-auto scroll-smooth">
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map(({ name, Icon, label }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onSelect(name);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    selectedIcon === name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs truncate w-full text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const getIconComponent = (iconName: string) => {
  const icon = ICONS.find(i => i.name === iconName);
  return icon ? icon.Icon : Sparkles;
};
