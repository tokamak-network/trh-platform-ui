"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  DashboardLogoSmIcon,
  LogoIcon,
  RollupItemIcon,
  ExploreItemIcon,
  AnalyticsItemIcon,
  UsersItemIcon,
  SettingItemIcon,
  NotificationItemIcon,
  SupportItemIcon,
} from "@/components/icon";
import { LogoutButton } from "@/components/molecules/LogoutButton";
import { useAuthContext } from "@/providers";
import { User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ isSelected?: boolean } & React.SVGProps<SVGSVGElement>>;
  href: string;
}

const mainNav: NavItem[] = [
  { label: "Rollup", icon: RollupItemIcon, href: "/rollup" },
  { label: "Explore", icon: ExploreItemIcon, href: "/explore" },
  { label: "Analytics", icon: AnalyticsItemIcon, href: "/analytics" },
  { label: "Users", icon: UsersItemIcon, href: "/users" },
  { label: "Configuration", icon: SettingItemIcon, href: "/configuration" },
];

const bottomNav: NavItem[] = [
  { label: "Notifications", icon: NotificationItemIcon, href: "/notifications" },
  { label: "Support", icon: SupportItemIcon, href: "/support" },
];

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

function NavButton({ item, isActive, isCollapsed, onClick }: NavButtonProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
        isActive
          ? "bg-primary text-white"
          : "text-gray-600 hover:bg-gray-100",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon isSelected={isActive} className="w-5 h-5 shrink-0" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const { user } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  const expanded = !isCollapsed || isPinned;

  const handleMouseEnter = () => {
    if (!isPinned) setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (!isPinned) setIsCollapsed(true);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) setIsCollapsed(false);
  };

  const userInitials = user?.email
    ?.split("@")[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2) || "U";

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "h-screen flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ease-out",
        expanded ? "w-[220px]" : "w-16",
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-3 border-b border-gray-200">
        {expanded ? (
          <>
            <DashboardLogoSmIcon className="h-5" />
            <button
              onClick={togglePin}
              className={cn(
                "p-1 rounded hover:bg-gray-100 transition-colors",
                isPinned && "text-primary"
              )}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", isPinned && "rotate-180")} />
            </button>
          </>
        ) : (
          <LogoIcon className="h-5 w-5 mx-auto" />
        )}
      </header>

      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {mainNav.map((item) => (
          <NavButton
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
            isCollapsed={!expanded}
            onClick={() => router.push(item.href)}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <nav className="p-2 space-y-1 border-t border-gray-200">
        {bottomNav.map((item) => (
          <NavButton
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            isCollapsed={!expanded}
            onClick={() => router.push(item.href)}
          />
        ))}
      </nav>

      {/* User Section */}
      <footer className="p-3 border-t border-gray-200">
        <div className={cn("flex items-center gap-2", !expanded && "justify-center")}>
          <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
            {user?.email ? userInitials : <User className="w-4 h-4" />}
          </span>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role || "User"}
                </p>
              </div>
              <LogoutButton variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" />
            </>
          )}
        </div>
      </footer>
    </aside>
  );
}
