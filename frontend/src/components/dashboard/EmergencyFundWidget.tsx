'use client';

import { Shield, TrendingUp } from 'lucide-react';

interface EmergencyFundWidgetProps {
  currentSavings: number;
  monthlySalary: number;
  emergencyFundMonths: number;
  currency: string;
}

export function EmergencyFundWidget({
  currentSavings,
  monthlySalary,
  emergencyFundMonths,
  currency,
}: EmergencyFundWidgetProps) {
  const targetAmount = monthlySalary * emergencyFundMonths;
  const progressPercentage = targetAmount > 0 ? (currentSavings / targetAmount) * 100 : 0;

  // Color coding based on progress
  const getColorClasses = () => {
    if (progressPercentage >= 100) {
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/30',
        progress: 'bg-green-500',
      };
    } else if (progressPercentage >= 50) {
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        progress: 'bg-blue-500',
      };
    } else {
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        progress: 'bg-orange-500',
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="p-6 bg-card border border-border/50 rounded-2xl card-glow hover:border-primary/30 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Shield className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground-muted">Emergency Fund</h3>
          <p className="text-2xl font-bold text-foreground">
            {currency} {currentSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground-muted">Target: {emergencyFundMonths} months</span>
          <span className={`font-semibold ${colors.text}`}>
            {progressPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full ${colors.progress} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-foreground-muted pt-1">
          <span>{currency} 0</span>
          <span>{currency} {targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t ${colors.border} flex items-center gap-2`}>
        <TrendingUp className={`w-4 h-4 ${colors.text}`} />
        <span className="text-xs text-foreground-muted">
          {currentSavings < targetAmount ? (
            <>Need: {currency} {(targetAmount - currentSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
          ) : (
            <>Target achieved! 🎉</>
          )}
        </span>
      </div>
    </div>
  );
}
