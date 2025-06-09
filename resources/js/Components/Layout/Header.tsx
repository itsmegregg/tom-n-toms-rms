import { Link, usePage } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/Components/ThemeToggle";
import { cn } from "@/lib/utils";
import ApplicationLogo from '@/Components/ApplicationLogo';
import { MobileDrawer } from './MobileDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

interface HeaderProps {
  className?: string;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function Header({ className, isSidebarOpen, onSidebarToggle }: HeaderProps) {
  const user = usePage().props.auth.user;

  return (
    <header className={cn("h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex h-full items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onSidebarToggle}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className="flex items-center gap-2 md:gap-4">
          <ApplicationLogo className="h-8 w-8" />
          <h1 className="text-xl font-bold hidden sm:block">RMS Dashboard</h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <span className="sr-only">Open user menu</span>
                {/* User initial or avatar */}
                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                  {user.name.charAt(0)}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/logout" method="post" as="button" className="w-full">
                  Log Out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
