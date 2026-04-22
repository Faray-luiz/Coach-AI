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
  return (
    <div className="glass rounded-3xl p-6 transition-all hover:bg-white/[0.05]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground/60">{title}</h3>
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
        {trend === 'neutral' && <Minus className="h-4 w-4 text-foreground/40" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-foreground">{score}</span>
        <span className="text-sm text-foreground/40">/100</span>
      </div>
      {description && (
        <p className="mt-2 text-xs text-foreground/40">{description}</p>
      )}
      
      {/* Visual Progress Bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div 
          className={cn(
            "h-full transition-all duration-1000",
            score > 80 ? "bg-primary" : score > 60 ? "bg-secondary" : "bg-accent"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
