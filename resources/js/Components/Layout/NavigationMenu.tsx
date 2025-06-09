import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { LogOut, Settings, User } from "lucide-react";
import { Separator } from "@/Components/ui/separator";
import { navigationItems } from './NavigationConfig';
import { NavigationItem } from './NavigationItem';
import { NavigationSubMenu } from './NavigationSubMenu';

interface NavigationMenuProps {
  className?: string;
}

export function NavigationMenu({ className }: NavigationMenuProps) {
  const user = usePage().props.auth.user;

  const isItemActive = (path: string) => {
    return window.location.pathname === `/${path}`;
  };

  return (
    <div className={cn("flex flex-col h-full pt-6", className)}>
      <div className="flex-1 space-y-1">
        {navigationItems.map((item, index) => (
          'route' in item ? (
            <NavigationItem
              key={index}
              {...item}
              isActive={isItemActive(item.route)}
            />
          ) : (
            <NavigationSubMenu
              key={index}
              {...item}
              isItemActive={isItemActive}
            />
          )
        ))}
      </div>

      <div className="mt-auto pt-4">
        <Separator className="my-4" />
        <div className="px-3 py-2">
          <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
            {user.name}
          </div>
          <nav className="space-y-1">
            <Link
              href="/profile"
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isItemActive('profile') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
            <Link
              href='/settings'
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isItemActive('profile') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
            <Link
              href="/logout"
              method="post"
              as="button"
              className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground text-destructive transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
