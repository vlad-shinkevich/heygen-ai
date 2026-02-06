"use client";

import { useAuth } from "@/lib/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthorized, error, user, isTelegram } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              {error || "You don't have access to this application"}
            </p>
          </div>

          {/* User info if available */}
          {user && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Your Telegram ID:</p>
              <p className="font-mono font-medium">{user.id}</p>
              {user.username && (
                <p className="text-sm text-muted-foreground mt-1">
                  @{user.username}
                </p>
              )}
            </div>
          )}

          {/* Help text */}
          <div className="text-sm text-muted-foreground">
            <p>Please contact the administrator to get access.</p>
            {user && (
              <p className="mt-2">
                Provide your Telegram ID: <strong>{user.id}</strong>
              </p>
            )}
          </div>

          {/* Not in Telegram notice */}
          {!isTelegram && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                This application works only through Telegram Mini App. Open it through the bot in Telegram.
              </p>
            </div>
          )}
          
          {/* Development mode notice */}
          {!isTelegram && typeof window !== "undefined" && window.location.hostname === "localhost" && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Development mode: access allowed for testing on localhost.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}

