import { Menu } from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/Components/ui/sheet";
import { NavigationMenu } from "./NavigationMenu";

export function MobileDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="block lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto">
          <NavigationMenu className="py-6" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
