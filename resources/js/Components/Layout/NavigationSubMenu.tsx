import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/Components/ui/collapsible";
import { MenuItemWithSub } from './NavigationConfig';
import { NavigationItem } from './NavigationItem';

interface NavigationSubMenuProps extends MenuItemWithSub {
  isItemActive: (path: string) => boolean;
}

export function NavigationSubMenu({ title, icon: Icon, items, isItemActive }: NavigationSubMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAnyItemActive = items.some(item => isItemActive(item.route));

  return (
    <Collapsible
      open={isOpen || isAnyItemActive}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center">
            <Icon className="mr-2 h-4 w-4" />
            <span>{title}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen || isAnyItemActive ? "rotate-180" : ""
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="relative pl-6 before:absolute before:left-6 before:top-0 before:h-full before:w-[1px] before:bg-muted-foreground/20 space-y-1 py-1">
          {items.map((item, index) => (
            <NavigationItem
              key={index}
              {...item}
              isActive={isItemActive(item.route)}
              isSubMenuItem={true}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
