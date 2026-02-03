"use client";

interface QuotaDisplayProps {
  quota: { remaining: number; used: number } | null;
}

export function QuotaDisplay({ quota }: QuotaDisplayProps) {
  if (!quota) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  const totalCredits = 100; // Total credits available
  const percentage = (quota.remaining / totalCredits) * 100;

  return (
    <div className="flex items-center gap-2">
      {/* Progress Ring */}
      <div className="relative w-6 h-6">
        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-secondary"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage * 0.628} 62.8`}
            className="text-primary"
          />
        </svg>
      </div>

      {/* Quota Text */}
      <div className="text-xs">
        <span className="font-medium">{quota.remaining}</span>
        <span className="text-muted-foreground"> credits</span>
      </div>
    </div>
  );
}

