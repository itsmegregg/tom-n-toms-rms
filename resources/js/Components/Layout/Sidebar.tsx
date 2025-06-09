import { cn } from "@/lib/utils";
import { NavigationMenu } from "./NavigationMenu";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("h-full bg-background flex justify-center items-center mr-4", className)}>
      <NavigationMenu />
    </div>
  );
}
