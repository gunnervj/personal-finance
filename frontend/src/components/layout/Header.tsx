"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  if (!session) return null;

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
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {session.user?.name || session.user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-foreground-muted">{session.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
