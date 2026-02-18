"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu, Settings, ChevronDown } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { preferencesApi } from "@/lib/api/preferences";

interface HeaderProps {
  onMenuClick?: () => void;
  onPreferencesClick?: () => void;
}

export default function Header({ onMenuClick, onPreferencesClick }: HeaderProps) {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.email) {
      loadAvatar();
    }
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const loadAvatar = async () => {
    try {
      const url = await preferencesApi.getAvatarUrl();
      setAvatarUrl(url);
    } catch (error) {
      // Avatar not found is expected, use fallback
      setAvatarUrl(null);
    }
  };

  if (!session) return null;

  const userEmail = session.user?.email || '';
  const userName = session.user?.name || userEmail.split("@")[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background-secondary/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 hover:bg-card-hover rounded-lg transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* User Menu on Right */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-3 py-2 hover:bg-card-hover rounded-lg transition-colors"
          >
            <Avatar
              src={avatarUrl}
              name={userEmail}
              size="sm"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-foreground-muted">{userEmail}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-slide-up">
              <div className="p-3 border-b border-border/50 sm:hidden">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-foreground-muted truncate">{userEmail}</p>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  onPreferencesClick?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card-hover text-foreground transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-sm">Edit Preferences</span>
              </button>

              <div className="border-t border-border/50" />

              <button
                onClick={() => {
                  setShowDropdown(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-foreground hover:text-red-400 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
