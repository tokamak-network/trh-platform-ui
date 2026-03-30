"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
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
import { SidebarItem } from "@/components/molecules";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<
    { isSelected?: boolean } & React.SVGProps<SVGSVGElement>
  >;
  href: string;
}

const navItems: NavItem[] = [
  // {
  //   label: "Dashboard",
  //   icon: DashboardItemIcon,
  //   href: "/dashboard",
  // },
  {
    label: "Rollup",
    icon: RollupItemIcon,
    href: "/rollup",
  },
  {
    label: "Explore",
    icon: ExploreItemIcon,
    href: "/explore",
  },
  {
    label: "Analytics",
    icon: AnalyticsItemIcon,
    href: "/analytics",
  },
  {
    label: "Users",
    icon: UsersItemIcon,
    href: "/users",
  },
  {
    label: "Configuration",
    icon: SettingItemIcon,
    href: "/configuration",
  },
  // {
  //   label: "Settings",
  //   icon: SettingItemIcon,
  //   href: "/settings",
  // },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Notifications",
    icon: NotificationItemIcon,
    href: "/notification",
  },
  {
    label: "Support",
    icon: SupportItemIcon,
    href: "/support",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 p-2 ${
        isCollapsed ? "w-16" : "w-[250px]"
      } ${className}`}
    >
      {/* Header with Logo */}
      <div className=" flex items-center justify-center p-3 border-b border-gray-200">
        {!isCollapsed && <DashboardLogoSmIcon className="h-6" />}
        {isCollapsed && <LogoIcon className="h-6 w-3" />}
        {/* <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button> */}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              title={isCollapsed ? "" : item.label}
              isSelected={isActive}
              onClick={() => handleNavigation(item.href)}
            />
          );
        })}
      </nav>

      {/* Bottom Navigation Items */}
      <div className="p-4 space-y-2 border-t border-gray-200">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              title={isCollapsed ? "" : item.label}
              isSelected={isActive}
              onClick={() => handleNavigation(item.href)}
            />
          );
        })}
      </div>

    </div>
  );
};
