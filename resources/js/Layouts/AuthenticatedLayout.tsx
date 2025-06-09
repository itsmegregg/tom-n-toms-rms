import { useState } from 'react';
import { User } from '@/types';
import { ThemeProvider } from '@/Components/theme-provider';
import { Header } from '@/Components/Layout/Header';
import Sidebar from '@/Components/Layout/Sidebar';
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Toaster } from "@/Components/ui/toaster";
import { Button } from '@/Components/ui/button';
import { Menu } from 'lucide-react';

export default function Authenticated({ 
  user, 
  children,
  header 
}: { 
  user: User;
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ThemeProvider defaultTheme="system" storageKey="rms-theme">
      <div className="min-h-screen bg-background">
        {/* Header - Full Width */}
        <Header 
          className="fixed top-0 w-full z-50" 
          isSidebarOpen={isSidebarOpen} 
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* Main Layout */}
        <div className="flex pt-16 h-[calc(100vh-4rem)]">
          {/* Mobile Sidebar Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 right-4 z-50 lg:hidden rounded-full shadow-lg"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Sidebar - Mobile & Tablet (Overlay) */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <aside 
            className={`fixed lg:static w-64 h-[calc(100vh-4rem)] bg-background border-r z-40
              transform transition-transform duration-200 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <Sidebar />
          </aside>

          {/* Main Content Area */}
          <main className={`flex-1 transition-all duration-200 ease-in-out
            ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
          `}>
            <ScrollArea className="h-[calc(100vh-4rem)]">
              {header && (
                <div className="py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
                  {header}
                </div>
              )}
              <div className="w-full">
                <div className="px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </div>
            </ScrollArea>
            <Toaster />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}