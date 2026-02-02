"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface AudioUploadProps {
  audioUrl: string | null;
  fileName: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
}

export function AudioUpload({
  audioUrl,
  fileName,
  onUpload,
  onRemove,
  isUploading,
}: AudioUploadProps) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("audio/")) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (audioUrl && fileName) {
    return (
      <div className="p-4 bg-secondary/50 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          {/* Audio Icon */}
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">Audio file uploaded</p>
          </div>

          {/* Remove Button */}
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Audio Preview */}
        <audio
          src={audioUrl}
          controls
          className="w-full mt-3 h-10"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "relative p-8 border-2 border-dashed rounded-lg text-center transition-colors",
        isUploading
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-secondary/50"
      )}
    >
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
      />

      {isUploading ? (
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium">Uploading...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">
              Drop audio file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supported: MP3, WAV, OGG, WebM (Max 20MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

