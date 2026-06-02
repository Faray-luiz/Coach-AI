import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ScoreCardProps {
  title: string;
  score: number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, trend, description }) => {
  const barColor = score > 80 ? '#1a73e8' : score > 60 ? '#34a853' : '#f9ab00';

  return (
    <div className="card rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted leading-snug">{title}</p>
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-error shrink-0 mt-0.5" />}
        {trend === 'neutral' && <Minus className="h-4 w-4 text-muted shrink-0 mt-0.5" />}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-sm text-muted">/100</span>
      </div>

      {description && (
        <p className="mt-1 text-xs text-muted">{description}</p>
      )}

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: barColor }}
        />
      </div>
    </div>
  );
};
