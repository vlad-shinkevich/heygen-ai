"use client";

import Image from "next/image";
import type { VideoStatus } from "@/lib/types/heygen";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  status: VideoStatus | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}

const statusConfig: Record<
  VideoStatus,
  { label: string; color: string; icon: string }
> = {
  pending: { label: "Pending", color: "text-yellow-500", icon: "⏳" },
  processing: { label: "Processing", color: "text-blue-500", icon: "⚙️" },
  completed: { label: "Completed", color: "text-green-500", icon: "✅" },
  failed: { label: "Failed", color: "text-red-500", icon: "❌" },
};

export function VideoPreview({
  status,
  videoUrl,
  thumbnailUrl,
  error,
}: VideoPreviewProps) {
  const config = status ? statusConfig[status] : null;

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      {config && (
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={cn("font-medium", config.color)}>{config.label}</span>
          {(status === "pending" || status === "processing") && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Video Player */}
      {status === "completed" && videoUrl && (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            <video
              src={videoUrl}
              controls
              className="w-full h-full"
              poster={thumbnailUrl || undefined}
            />
          </div>

          {/* Download Button */}
          <a
            href={videoUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Video
          </a>
        </div>
      )}

      {/* Processing Animation */}
      {(status === "pending" || status === "processing") && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
          {thumbnailUrl ? (
            <>
              <Image
                src={thumbnailUrl}
                alt="Video thumbnail"
                fill
                className="object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white font-medium">
                    {status === "pending" ? "Starting..." : "Processing video..."}
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    This may take a few minutes
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-medium">
                {status === "pending" ? "Starting..." : "Processing video..."}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                This may take a few minutes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

