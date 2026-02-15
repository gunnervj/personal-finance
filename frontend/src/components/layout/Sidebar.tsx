"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/budgets", label: "Budgets", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: Receipt },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-sidebar-bg border-r border-border/50 transition-all duration-300 z-50 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-3" onClick={onMobileClose}>
              <Image
                src="/logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="drop-shadow-lg"
              />
              <span className="text-lg font-semibold text-primary">
                Personal Finance
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto" onClick={onMobileClose}>
              <Image
                src="/logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="drop-shadow-lg"
              />
            </Link>
          )}
          {/* Mobile Close Button */}
          <button
            className="lg:hidden p-2 hover:bg-card-hover rounded-lg transition-colors"
            onClick={onMobileClose}
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block absolute -right-3 top-20 bg-card border border-border rounded-full p-1 hover:bg-primary/20 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-primary" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* Menu Items */}
        <nav className="p-3 space-y-1 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-muted hover:text-foreground hover:bg-card-hover"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
