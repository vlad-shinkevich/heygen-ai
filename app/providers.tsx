"use client";

import { VideoStoreProvider } from "@/lib/store/video-store";
import { AuthGuard } from "@/components/auth-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <VideoStoreProvider>{children}</VideoStoreProvider>
    </AuthGuard>
  );
}

