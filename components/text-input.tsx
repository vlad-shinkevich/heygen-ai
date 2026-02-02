"use client";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function TextInput({ value, onChange, maxLength = 5000 }: TextInputProps) {
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;
  const isAtLimit = charCount >= maxLength;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="Enter the text you want the avatar to speak..."
        className="w-full h-40 px-4 py-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Tip: Use punctuation for natural pauses
        </p>
        <p
          className={`text-xs font-medium ${
            isAtLimit
              ? "text-destructive"
              : isNearLimit
              ? "text-yellow-500"
              : "text-muted-foreground"
          }`}
        >
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

