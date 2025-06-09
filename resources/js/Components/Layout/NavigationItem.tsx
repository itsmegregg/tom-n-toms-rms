import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { MenuItem } from './NavigationConfig';

interface NavigationItemProps extends MenuItem {
  isActive: boolean;
  isSubMenuItem?: boolean;
}

export function NavigationItem({ title, route, icon: Icon, isActive, isSubMenuItem = false }: NavigationItemProps) {
  return (
    <Link
      href={`/${route}`}
      className={cn(
        "group flex items-center rounded-md py-1.5 text-sm font-medium transition-colors",
        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground',
        isSubMenuItem ? 'px-3' : 'px-3'
      )}
    >
      <Icon className="mr-2 h-4 w-4" />
      <span>{title}</span>
    </Link>
  );
}
