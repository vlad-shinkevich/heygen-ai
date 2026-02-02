"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import type { Avatar, AvatarGroup } from "@/lib/types/heygen";
import { cn } from "@/lib/utils";

interface AvatarSelectorProps {
  avatars: Avatar[];
  groups: AvatarGroup[];
  selectedAvatar: Avatar | null;
  selectedGroupId: string | null;
  onAvatarSelect: (avatar: Avatar) => void;
  onGroupSelect: (groupId: string | null) => void;
  isLoading: boolean;
  error: string | null;
}

const AVATARS_PER_PAGE = 15;

export function AvatarSelector({
  avatars,
  groups,
  selectedAvatar,
  selectedGroupId,
  onAvatarSelect,
  onGroupSelect,
  isLoading,
  error,
}: AvatarSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter avatars by search query
  const filteredAvatars = useMemo(
    () =>
      avatars.filter((avatar) =>
        avatar.avatar_name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [avatars, searchQuery]
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredAvatars.length / AVATARS_PER_PAGE);
  const startIndex = (currentPage - 1) * AVATARS_PER_PAGE;
  const endIndex = startIndex + AVATARS_PER_PAGE;
  const paginatedAvatars = filteredAvatars.slice(startIndex, endIndex);

  // Reset to page 1 when search changes or filtered results change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filteredAvatars.length]);

  // Reset page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group Filter */}
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => onGroupSelect(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              selectedGroupId === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            All Avatars
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onGroupSelect(group.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                selectedGroupId === group.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search avatars..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {/* Avatar Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-secondary animate-pulse"
            />
          ))}
        </div>
      ) : filteredAvatars.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No avatars found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {paginatedAvatars.map((avatar) => (
            <button
              key={avatar.avatar_id}
              onClick={() => onAvatarSelect(avatar)}
              className={cn(
                "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                selectedAvatar?.avatar_id === avatar.avatar_id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-primary/50"
              )}
            >
              {avatar.preview_image_url ? (
                <Image
                  src={avatar.preview_image_url}
                  alt={avatar.avatar_name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  unoptimized
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector(".avatar-placeholder")) {
                      const placeholder = document.createElement("div");
                      placeholder.className = "avatar-placeholder w-full h-full bg-secondary flex items-center justify-center";
                      placeholder.innerHTML = '<span class="text-2xl">👤</span>';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              )}

              {/* Overlay with name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-[10px] text-white truncate font-medium">
                  {avatar.avatar_name}
                </p>
              </div>

              {/* Selection indicator */}
              {selectedAvatar?.avatar_id === avatar.avatar_id && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentPage === 1
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({filteredAvatars.length} total)
                </span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  currentPage === totalPages
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Selected Avatar Preview */}
      {selectedAvatar && (
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
            {selectedAvatar.preview_image_url ? (
              <Image
                src={selectedAvatar.preview_image_url}
                alt={selectedAvatar.avatar_name}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector(".avatar-placeholder")) {
                    const placeholder = document.createElement("div");
                    placeholder.className = "avatar-placeholder w-full h-full bg-secondary flex items-center justify-center";
                    placeholder.innerHTML = '<span class="text-lg">👤</span>';
                    parent.appendChild(placeholder);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {selectedAvatar.avatar_name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {selectedAvatar.gender} • {selectedAvatar.type}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

